import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: [true, 'Please select a tournament'],
    },
    teamAName: { type: String, required: true, trim: true },
    teamBName: { type: String, required: true, trim: true },
    teamALogo: { type: String },
    teamBLogo: { type: String },
    oddsA: { type: Number, required: true, default: 1.8 },
    oddsB: { type: Number, required: true, default: 1.8 },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

const Match = mongoose.model('Match', matchSchema);
export default Match;
