// routes/students.js - Student CRUD routes
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// GET /api/students - Get all students (with optional search)
router.get('/', isAuthenticated, (req, res) => {
  const { search } = req.query;
  let students = [...db.students];
  if (search) {
    const q = search.toLowerCase();
    students = students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.rollNumber.includes(q)
    );
  }
  res.json({ success: true, data: students, total: students.length });
});

// GET /api/students/:id - Get single student
router.get('/:id', isAuthenticated, (req, res) => {
  const student = db.students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: student });
});

// POST /api/students - Add new student
router.post('/', isAuthenticated, (req, res) => {
  const { fullName, class: cls, section, rollNumber, dob, email, phone, address } = req.body;
  if (!fullName || !cls || !section || !rollNumber)
    return res.status(400).json({ success: false, message: 'Required fields missing' });

  // Check for duplicate roll number in same class/section
  const exists = db.students.find(s => s.class === cls && s.section === section && s.rollNumber === rollNumber);
  if (exists) return res.status(400).json({ success: false, message: 'Roll number already exists in this class/section' });

  const newStudent = {
    id: 'STU' + String(db.students.length + 1).padStart(3, '0'),
    fullName, class: cls, section, rollNumber, dob, email, phone, address,
    createdAt: new Date().toISOString()
  };
  db.students.push(newStudent);
  res.status(201).json({ success: true, message: 'Student added successfully', data: newStudent });
});

// PUT /api/students/:id - Update student
router.put('/:id', isAuthenticated, (req, res) => {
  const idx = db.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });

  const { fullName, class: cls, section, rollNumber, dob, email, phone, address } = req.body;
  db.students[idx] = { ...db.students[idx], fullName, class: cls, section, rollNumber, dob, email, phone, address };
  res.json({ success: true, message: 'Student updated successfully', data: db.students[idx] });
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', isAuthenticated, (req, res) => {
  const idx = db.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });
  db.students.splice(idx, 1);
  res.json({ success: true, message: 'Student deleted successfully' });
});

module.exports = router;
