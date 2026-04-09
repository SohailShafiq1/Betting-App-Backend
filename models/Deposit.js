import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [1, 'Minimum deposit is $1'],
      max: [10000, 'Maximum deposit is $10,000'],
    },
    currency: {
      type: String,
      default: 'usd',
      enum: ['usd', 'eur', 'gbp', 'usdt'],
    },
    method: {
      type: String,
      enum: ['card', 'crypto'],
      default: 'card',
    },
    coinName: {
      type: String,
      default: null,
    },
    coinSymbol: {
      type: String,
      default: null,
    },
    network: {
      type: String,
      default: null,
    },
    walletAddress: {
      type: String,
      default: null,
    },
    proofImage: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
depositSchema.index({ userId: 1 });
depositSchema.index({ stripeSessionId: 1 });
depositSchema.index({ stripePaymentIntentId: 1 });

export default mongoose.model('Deposit', depositSchema);
