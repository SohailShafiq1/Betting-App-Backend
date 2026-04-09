import Settings from '../models/Settings.js';

export const getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json(settings);
};

export const getPublicSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json({ coins: settings.coins || [] });
};

export const updateSettings = async (req, res) => {
  const { winRate, upOdds, downOdds, trend, coins } = req.body;
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({ winRate, upOdds, downOdds, trend, coins });
  } else {
    settings.winRate = winRate ?? settings.winRate;
    settings.upOdds = upOdds ?? settings.upOdds;
    settings.downOdds = downOdds ?? settings.downOdds;
    settings.trend = trend ?? settings.trend;
    settings.coins = Array.isArray(coins) ? coins : settings.coins;
    await settings.save();
  }

  res.json(settings);
};
