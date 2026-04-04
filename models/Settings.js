import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    winRate: { type: Number, required: true, default: 65 },
    upOdds: { type: Number, required: true, default: 1.45 },
    downOdds: { type: Number, required: true, default: 2.1 },
    trend: {
      type: String,
      enum: ['UP', 'DOWN', 'NORMAL'],
      default: 'NORMAL',
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
