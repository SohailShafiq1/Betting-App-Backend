import mongoose from 'mongoose';

const friendlyChallengeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 8,
      maxlength: 8,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creatorTeamName: {
      type: String,
      required: true,
      trim: true,
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    creatorChoice: {
      type: String,
      enum: ['A', 'B'],
      required: true,
    },
    creatorAmount: {
      type: Number,
      required: true,
      min: 5,
    },
    creatorOdds: {
      type: Number,
      required: true,
    },
    creatorBet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bet',
      required: true,
    },
    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    opponentChoice: {
      type: String,
      enum: ['A', 'B'],
    },
    opponentAmount: {
      type: Number,
      min: 5,
    },
    opponentOdds: {
      type: Number,
    },
    opponentBet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bet',
    },
    status: {
      type: String,
      enum: ['OPEN', 'JOINED', 'FINISHED', 'CANCELLED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

const FriendlyChallenge = mongoose.model('FriendlyChallenge', friendlyChallengeSchema);
export default FriendlyChallenge;
