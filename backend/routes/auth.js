 // routes/auth.js - Authentication routes
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required' });

    const admin = db.admin.find(a => a.username === username);
    if (!admin)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    req.session.admin = { id: admin.id, username: admin.username, name: admin.name };
    res.json({ success: true, message: 'Login successful', admin: req.session.admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session && req.session.admin) {
    return res.json({ success: true, admin: req.session.admin });
  }
  res.status(401).json({ success: false, message: 'Not authenticated' });
});

module.exports = router;
