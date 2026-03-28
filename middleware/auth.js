// middleware/auth.js
// Protects routes — checks if the request has a valid JWT token

const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  // Token should come in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Use this on routes that only counsellors can access
const counsellorOnly = (req, res, next) => {
  if (req.user.role !== 'counsellor') {
    return res.status(403).json({ error: 'Only counsellors can access this.' });
  }
  next();
};

module.exports = { authMiddleware, counsellorOnly };
