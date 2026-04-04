import Tournament from '../models/Tournament.js';
import Match from '../models/Match.js';
import Category from '../models/Category.js';

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
export const getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find().populate('category').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: tournaments.length,
      data: tournaments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single tournament
// @route   GET /api/tournaments/:id
// @access  Public
export const getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create tournament
// @route   POST /api/tournaments
// @access  Private/Admin
export const createTournament = async (req, res) => {
  try {
    const { category, name, description, status } = req.body;

    // Validation
    if (!category || !name || !description) {
      return res.status(400).json({ message: 'Please provide category, name and description' });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if tournament already exists
    const existingTournament = await Tournament.findOne({ name });
    if (existingTournament) {
      return res.status(400).json({ message: 'Tournament with this name already exists' });
    }

    const tournament = await Tournament.create({
      category,
      name,
      description,
      status: status || 'UPCOMING',
    });

    // Increment category tournament count
    categoryExists.tournamentCount = (categoryExists.tournamentCount || 0) + 1;
    await categoryExists.save();

    // Populate category data
    const populatedTournament = await tournament.populate('category');

    res.status(201).json({
      success: true,
      data: populatedTournament,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private/Admin
export const updateTournament = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if new name already exists (if changing name)
    if (name && name !== tournament.name) {
      const existing = await Tournament.findOne({ name });
      if (existing) {
        return res.status(400).json({ message: 'Tournament with this name already exists' });
      }
    }

    if (name) tournament.name = name;
    if (description) tournament.description = description;
    if (status) tournament.status = status;

    await tournament.save();

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
// @access  Private/Admin
export const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if tournament has matches
    const matchCount = await Match.countDocuments({ tournament: req.params.id });
    if (matchCount > 0) {
      return res.status(400).json({
        message: `Cannot delete tournament with ${matchCount} matches. Delete all matches first.`,
      });
    }

    // Decrement category tournament count
    const category = await Category.findById(tournament.category);
    if (category) {
      category.tournamentCount = Math.max(0, (category.tournamentCount || 1) - 1);
      await category.save();
    }

    await Tournament.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Tournament deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tournament with matches
// @route   GET /api/tournaments/:id/matches
// @access  Public
export const getTournamentMatches = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const matches = await Match.find({ tournament: req.params.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      tournament,
      matchCount: matches.length,
      matches,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
