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
    matchDate: {
      type: Date,
      required: [true, 'Match date is required'],
    },
    matchTime: {
      type: String,
      required: [true, 'Match time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format'],
    },
  },
  { timestamps: true }
);

const Match = mongoose.model('Match', matchSchema);
export default Match;
