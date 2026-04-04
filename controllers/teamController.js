import Team from '../models/Team.js';

export const createTeam = async (req, res) => {
  const { name } = req.body;

  if (!name || !req.file) {
    return res.status(400).json({ message: 'Team name and logo are required' });
  }

  const team = await Team.create({
    name,
    logo: `/uploads/${req.file.filename}`,
  });

  res.status(201).json(team);
};

export const getTeams = async (req, res) => {
  const teams = await Team.find().sort({ createdAt: -1 });
  res.json(teams);
};

export const deleteTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  await team.deleteOne();
  res.json({ message: 'Team deleted successfully' });
};
