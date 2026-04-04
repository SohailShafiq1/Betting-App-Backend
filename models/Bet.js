import mongoose from 'mongoose';

const betSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    choice: { type: String, enum: ['A', 'B'], required: true },
    amount: { type: Number, required: true, min: 1 },
    odds: { type: Number, required: true },
    result: { type: String, enum: ['WIN', 'LOSE'], required: true },
    payout: { type: Number, required: true },
  },
  { timestamps: true }
);

const Bet = mongoose.model('Bet', betSchema);
export default Bet;
