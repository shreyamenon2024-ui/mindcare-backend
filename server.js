// server.js — Main entry point for MindCare backend

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const counsellorRoutes = require('./routes/counsellor');
const peerRoutes = require('./routes/peer');

const app = express();

// ─────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────

// Allow requests from the frontend (GitHub Pages)
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://shreyamenon2024-ui.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON request bodies
app.use(express.json());

// ─────────────────────────────────────────
// Routes
// ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/counsellor', counsellorRoutes);
app.use('/api/peer', peerRoutes);

// Health check — visit this in browser to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: '🌿 MindCare API is running!', status: 'OK' });
});

// ─────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MindCare server running on http://localhost:${PORT}`);
});
