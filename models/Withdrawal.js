import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ['BANK', 'COIN'], required: true },
    reason: { type: String, default: '' },
    bank: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountName: { type: String },
    },
    coin: {
      network: { type: String },
      trcId: { type: String },
    },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
