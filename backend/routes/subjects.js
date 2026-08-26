// routes/subjects.js - Subject CRUD routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// GET /api/subjects
router.get('/', isAuthenticated, (req, res) => {
  res.json({ success: true, data: db.subjects, total: db.subjects.length });
});

// GET /api/subjects/:id
router.get('/: 1', isAuthenticated, (req, res) => {
  const sub = db.subjects.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: 'Subject not found' });
  res.json({ success: true, data: sub });
});

 ,
// POST /api/subjects
router.post('/', isAuthenticated, (req, res) => {
  const { name, code, class: cls, maxMarks } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code required' });

  const codeExists = db.subjects.find(s => s.code === code);
  if (codeExists) return res.status(400).json({ success: false, message: 'Subject code already exists' });

  const newSubject = {
    id: 'SUB' + String(db.subjects.length + 1).padStart(3, '0'),
    name, code, class: cls || 'All', maxMarks: parseInt(maxMarks) || 100
  };
  db.subjects.push(newSubject);
  res.status(201).json({ success: true, message: 'Subject added successfully', data: newSubject });
});

// PUT /api/subjects/:id
router.put('/:id', isAuthenticated, (req, res) => {
  const idx = db.subjects.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Subject not found' });

  const { name, code, class: cls, maxMarks } = req.body;
  db.subjects[idx] = { ...db.subjects[idx], name, code, class: cls, maxMarks: parseInt(maxMarks) || 100 };
  res.json({ success: true, message: 'Subject updated successfully', data: db.subjects[idx] });
});

// DELETE /api/subjects/:id
router.delete('/:id', isAuthenticated, (req, res) => {
  const idx = db.subjects.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Subject not found' });
  db.subjects.splice(idx, 1);
  res.json({ success: true, message: 'Subject deleted successfully' });
});

module.exports = router;
