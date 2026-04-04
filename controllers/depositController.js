import Stripe from 'stripe';
import Deposit from '../models/Deposit.js';
import User from '../models/User.js';

// Lazy initialize Stripe client (environment variables loaded by server.js)
let stripeClient;

function getStripeClient() {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe client initialized successfully');
  }
  return stripeClient;
}

/**
 * Create Stripe Payment Intent for embedded payment form
 * POST /deposits/create-payment-intent
 * Returns clientSecret for frontend to complete payment
 */
export const createPaymentIntent = async (req, res) => {
  try {
    console.log('📍 createPaymentIntent called');
    console.log('User:', req.user ? req.user._id : 'No user');
    console.log('Body:', req.body);

    const { amount } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount < 10 || amount > 10000) {
      console.log('❌ Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Amount must be between $10 and $10,000',
      });
    }

    console.log('Creating deposit record...');
    // Create deposit record
    const deposit = await Deposit.create({
      userId,
      amount,
      currency: 'usd',
      status: 'pending',
      paymentStatus: 'pending',
    });
    console.log('✅ Deposit created:', deposit._id);

    console.log('Creating Stripe Payment Intent...');
    const stripe = getStripeClient();

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description: `Betting Platform Deposit - $${amount}`,
      metadata: {
        userId: userId.toString(),
        depositId: deposit._id.toString(),
        amount: amount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    console.log('✅ Payment Intent created:', paymentIntent.id);

    // Update deposit with payment intent ID
    deposit.stripePaymentIntentId = paymentIntent.id;
    await deposit.save();
    console.log('✅ Deposit updated with payment intent ID');

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      depositId: deposit._id,
      amount: amount,
    });
  } catch (error) {
    console.error('❌ Payment Intent error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message,
    });
  }
};

/**
 * Create Stripe checkout session for deposit
 * POST /deposits/create-checkout-session
 */
export const createCheckoutSession = async (req, res) => {
  try {
    console.log('📍 createCheckoutSession called');
    console.log('User:', req.user ? req.user._id : 'No user');
    console.log('Body:', req.body);

    const { amount } = req.body;
    const userId = req.user._id; // From auth middleware

    // Validate amount
    if (!amount || amount < 10 || amount > 10000) {
      console.log('❌ Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Amount must be between $10 and $10,000',
      });
    }

    console.log('Creating deposit record...');
    // Create deposit record with 'pending' status
    const deposit = await Deposit.create({
      userId,
      amount,
      currency: 'usd',
      status: 'pending',
      paymentStatus: 'pending',
    });
    console.log('✅ Deposit created:', deposit._id);

    console.log('Creating Stripe checkout session...');
    // Get Stripe client (lazy initialization)
    const stripe = getStripeClient();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Betting Platform Deposit',
              description: `Deposit $${amount} to your betting wallet`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/deposit?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/deposit?cancelled=true`,
      metadata: {
        userId: userId.toString(),
        depositId: deposit._id.toString(),
        amount: amount.toString(),
      },
    });
    console.log('✅ Stripe session created:', session.id);

    // Update deposit with Stripe session ID
    deposit.stripeSessionId = session.id;
    deposit.stripePaymentIntentId = session.payment_intent || null;
    await deposit.save();
    console.log('✅ Deposit updated with session ID');

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      depositId: deposit._id,
      clientSecret: session.client_secret,
    });
  } catch (error) {
    console.error('❌ Stripe checkout session error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message,
    });
  }
};

/**
 * Handle Stripe webhook events
 * POST /deposits/webhook
 * CRITICAL: Only this handler should mark payments as success
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // req.body will be a Buffer when using express.raw()
  const body = typeof req.body === 'string' ? req.body : req.body.toString('utf-8');

  let event;

  try {
    // Verify webhook signature
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({
      success: false,
      message: 'Webhook Error: Invalid signature',
    });
  }

  try {
    // Handle payment intent success (from embedded payment form)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId, depositId, amount } = paymentIntent.metadata;

      console.log(`📍 payment_intent.succeeded: ${paymentIntent.id}`);

      if (!userId || !depositId || !amount) {
        console.error('Missing metadata in payment intent:', paymentIntent.id);
        return res.status(400).json({ received: true });
      }

      // Find and update deposit
      const deposit = await Deposit.findById(depositId);
      if (!deposit) {
        console.error('Deposit not found:', depositId);
        return res.status(200).json({ received: true });
      }

      // Verify deposit belongs to user
      if (deposit.userId.toString() !== userId) {
        console.error('User ID mismatch for deposit:', depositId);
        return res.status(200).json({ received: true });
      }

      // Update deposit to success
      deposit.status = 'success';
      deposit.paymentStatus = 'success';
      await deposit.save();

      // Update user wallet
      const user = await User.findById(userId);
      if (user) {
        user.wallet = (user.wallet || 0) + parseFloat(amount);
        await user.save();
        console.log(`✅ Payment Intent succeeded: User ${userId} + $${amount}`);
      }

      return res.status(200).json({ received: true });
    }
    // Only process checkout.session.completed event
    else if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Extract metadata
      const { userId, depositId, amount } = session.metadata;

      if (!userId || !depositId || !amount) {
        console.error('Missing metadata in Stripe session:', session.id);
        return res.status(400).json({
          success: false,
          message: 'Missing metadata in Stripe session',
        });
      }

      // Find deposit record
      const deposit = await Deposit.findById(depositId);

      if (!deposit) {
        console.error('Deposit not found:', depositId);
        return res.status(404).json({
          success: false,
          message: 'Deposit record not found',
        });
      }

      // Verify deposit belongs to the user
      if (deposit.userId.toString() !== userId) {
        console.error('User ID mismatch for deposit:', depositId);
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Deposit does not belong to user',
        });
      }

      // Update deposit to success
      deposit.status = 'success';
      deposit.paymentStatus = 'success';
      await deposit.save();

      // Update user wallet balance
      const user = await User.findById(userId);

      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Add amount to user's wallet
      user.wallet = (user.wallet || 0) + parseFloat(amount);
      await user.save();

      console.log(`✅ Deposit successful: User ${userId} + $${amount}`);
    } else if (event.type === 'charge.failed') {
      const charge = event.data.object;
      const { depositId } = charge.metadata;

      if (depositId) {
        const deposit = await Deposit.findById(depositId);
        if (deposit) {
          deposit.status = 'failed';
          deposit.paymentStatus = 'failed';
          deposit.errorMessage = charge.failure_message || 'Payment failed';
          await deposit.save();

          console.log(`❌ Deposit failed: ${depositId}`);
        }
      }
    }

    // Return 200 to acknowledge webhook receipt
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook processing error',
      error: error.message,
    });
  }
};

/**
 * Get user's deposit history
 * GET /deposits
 */
export const getDepositHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const deposits = await Deposit.find({ userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    return res.status(200).json({
      success: true,
      deposits,
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits',
      error: error.message,
    });
  }
};

/**
 * Get deposit by ID
 * GET /deposits/:depositId
 */
export const getDepositById = async (req, res) => {
  try {
    const { depositId } = req.params;
    const userId = req.user._id;

    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found',
      });
    }

    // Verify ownership
    if (deposit.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Deposit does not belong to user',
      });
    }

    return res.status(200).json({
      success: true,
      deposit,
    });
  } catch (error) {
    console.error('Get deposit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch deposit',
      error: error.message,
    });
  }
};

/**
 * Get deposit status
 * GET /deposits/:depositId/status
 */
export const getDepositStatus = async (req, res) => {
  try {
    const { depositId } = req.params;
    const userId = req.user._id;

    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found',
      });
    }

    // Verify ownership
    if (deposit.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      status: deposit.status,
      paymentStatus: deposit.paymentStatus,
      amount: deposit.amount,
      createdAt: deposit.createdAt,
    });
  } catch (error) {
    console.error('Get status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch status',
      error: error.message,
    });
  }
};

/**
 * ADMIN: Get all deposits
 * GET /admin/deposits
 */
export const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .populate('userId', 'email name wallet')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      deposits,
    });
  } catch (error) {
    console.error('Get all deposits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits',
      error: error.message,
    });
  }
};

/**
 * TEST ENDPOINT: Manually mark a pending deposit as successful
 * POST /deposits/test-confirm/:depositId
 * Use this to test webhook functionality
 */
export const testConfirmDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    
    console.log(`📍 Test confirm deposit: ${depositId}`);

    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found',
      });
    }

    // Verify ownership
    if (deposit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Update deposit
    deposit.status = 'success';
    deposit.paymentStatus = 'success';
    await deposit.save();

    // Update user wallet
    const user = await User.findById(deposit.userId);
    if (user) {
      user.wallet = (user.wallet || 0) + deposit.amount;
      await user.save();
      console.log(`✅ Test: User ${user._id} + $${deposit.amount}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Deposit manually confirmed',
      deposit,
      userWallet: user?.wallet || 0,
    });
  } catch (error) {
    console.error('Test confirm deposit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm deposit',
      error: error.message,
    });
  }
};
