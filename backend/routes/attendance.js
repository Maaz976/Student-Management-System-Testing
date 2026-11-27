// routes/attendance.js - Attendance management routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// GET /api/attendance - Get attendance records (filter by date/student)
router.get('/', isAuthenticated, (req, res) => {
  const { date, studentId, class: cls } = req.query;
  let records = [...db.attendance];

  if (date) records = records.filter(r => r.date === date);
  if (studentId) records = records.filter(r => r.studentId === studentId);

  // Enrich with student details
  const enriched = records.map(r => {
    const student = db.students.find(s => s.id === r.studentId);
    return { ...r, studentName: student ? student.fullName : 'Unknown', studentClass: student ? student.class : '', studentSection: student ? student.section : '' };
  });

  if (cls) {
    return res.json({ success: true, data: enriched.filter(r => r.studentClass === cls) });
  }

  res.json({ success: true, data: enriched });
});

// POST /api/attendance/bulk - Mark attendance for multiple students
router.post('/bulk', isAuthenticated, (req, res) => {
  const { date, records } = req.body; // records: [{studentId, status}]
  if (!date || !records || !Array.isArray(records))
    return res.status(400).json({ success: false, message: 'Date and records array required' });

  let saved = 0;
  records.forEach(({ studentId, status }) => {
    const existing = db.attendance.find(a => a.studentId === studentId && a.date === date);
    if (existing) {
      existing.status = status;
    } else {
      db.attendance.push({
        id: 'ATT' + String(db.attendance.length + 1).padStart(3, '0'),
        studentId, date, status
      });
    }
    saved++;
  });

  res.json({ success: true, message: `Attendance saved for ${saved} students` });
});

// PUT /api/attendance/:id - Update single attendance record
router.put('/:id', isAuthenticated, (req, res) => {
  const record = db.attendance.find(a => a.id === req.params.id);
  if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
  record.status = req.body.status;
  res.json({ success: true, message: 'Attendance updated', data: record });
});

// GET /api/attendance/stats - Get attendance statistics
router.get('/stats', isAuthenticated, (req, res) => {
  const total = db.attendance.length;
  const present = db.attendance.filter(a => a.status === 'present').length;
  const absent = total - present;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
  res.json({ success: true, data: { total, present, absent, percentage } });
});

module.exports = router;
