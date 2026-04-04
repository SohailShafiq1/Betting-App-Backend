import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category'],
    },
    name: {
      type: String,
      required: [true, 'Please provide a tournament name'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'],
      default: 'UPCOMING',
    },
    matchCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
