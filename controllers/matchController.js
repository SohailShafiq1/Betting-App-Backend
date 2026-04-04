import Match from '../models/Match.js';

export const createMatch = async (req, res) => {
  const { teamAName, teamBName, oddsA, oddsB } = req.body;

  if (!teamAName || !teamBName || !oddsA || !oddsB) {
    return res.status(400).json({ message: 'Both team names and odds are required' });
  }

  const match = await Match.create({
    teamAName,
    teamBName,
    oddsA: Number(oddsA),
    oddsB: Number(oddsB),
    teamALogo: req.files?.teamALogo?.[0]
      ? `/uploads/${req.files.teamALogo[0].filename}`
      : undefined,
    teamBLogo: req.files?.teamBLogo?.[0]
      ? `/uploads/${req.files.teamBLogo[0].filename}`
      : undefined,
  });

  res.status(201).json(match);
};

export const getMatches = async (req, res) => {
  const matches = await Match.find().sort({ createdAt: -1 });
  res.json(matches);
};

export const deleteMatch = async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }
  await match.deleteOne();
  res.json({ message: 'Match deleted successfully' });
};
