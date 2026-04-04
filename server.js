import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import betRoutes from './routes/betRoutes.js';
import User from './models/User.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const createDefaultAdmin = async () => {
  const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!defaultEmail || !defaultPassword) {
    console.warn('DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD not defined');
    return;
  }

  const existing = await User.findOne({ email: defaultEmail });
  if (!existing) {
    await User.create({
      name: 'Admin User',
      email: defaultEmail,
      password: defaultPassword,
      role: 'admin',
      wallet: 1000,
    });
    console.log('Default admin created:', defaultEmail);
  }
};

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await createDefaultAdmin();
  })
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/bets', betRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
