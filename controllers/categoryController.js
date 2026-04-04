import Category from '../models/Category.js';
import Tournament from '../models/Tournament.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { heading } = req.body;

    // Validation
    if (!heading) {
      return res.status(400).json({ message: 'Please provide a category heading' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a category logo' });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ heading });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this heading already exists' });
    }

    const category = await Category.create({
      heading,
      logo: `/uploads/${req.file.filename}`,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { heading } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if new heading already exists (if changing)
    if (heading && heading !== category.heading) {
      const existing = await Category.findOne({ heading });
      if (existing) {
        return res.status(400).json({ message: 'Category with this heading already exists' });
      }
      category.heading = heading;
    }

    // Update logo if provided
    if (req.file) {
      category.logo = `/uploads/${req.file.filename}`;
    }

    await category.save();

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has tournaments
    const tournamentCount = await Tournament.countDocuments({ category: req.params.id });
    if (tournamentCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category with ${tournamentCount} tournaments. Delete all tournaments first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category with tournaments
// @route   GET /api/categories/:id/tournaments
// @access  Public
export const getCategoryTournaments = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const tournaments = await Tournament.find({ category: req.params.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      category,
      tournamentCount: tournaments.length,
      tournaments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
