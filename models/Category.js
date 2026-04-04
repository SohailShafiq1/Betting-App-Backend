import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: [true, 'Please provide a category heading'],
      trim: true,
      unique: true,
    },
    logo: {
      type: String,
      required: [true, 'Please upload a category logo'],
    },
    tournamentCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
