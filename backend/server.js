// server.js - Main Express server
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - allow frontend origin
app.use(cors({
  origin: true,
  credentials: true
}));

// Session configuration
app.use(session({
  secret: 'sms-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/marks', require('./routes/marks'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Student Management API running' });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎓 Student Management System`);
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`\n🔑 Admin Login: username=admin, password=admin123\n`);
});
