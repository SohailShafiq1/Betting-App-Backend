import mongoose from 'mongoose';

const betSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    choice: { type: String, enum: ['A', 'B'], required: true },
    teamName: { type: String, required: true }, // Team name for easy reference
    amount: { type: Number, required: true, min: 5 }, // Minimum 5 USD
    odds: { type: Number, required: true },
    result: { type: String, enum: ['WIN', 'LOSE', 'PENDING'], default: 'PENDING' },
    payout: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['OPEN', 'SETTLED', 'CANCELLED'], default: 'OPEN' },
  },
  { timestamps: true }
);

const Bet = mongoose.model('Bet', betSchema);
export default Bet;
