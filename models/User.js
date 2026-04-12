import crypto from 'crypto';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 8,
      maxlength: 8,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    wallet: {
      type: Number,
      required: true,
      default: 100,
    },
  },
  { timestamps: true }
);

// Generate a unique 8-character userId and hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.userId) {
    let candidate;
    let existing = true;

    while (existing) {
      candidate = crypto.randomBytes(4).toString('hex');
      existing = await mongoose.models.User.findOne({ userId: candidate });
    }

    this.userId = candidate;
  }

  if (!this.isModified('password')) {
    next();
    return;
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
