// routes/marks.js - Marks and Results management routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// Grade calculation helper
function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

// GET /api/marks - Get marks (filter by student/subject)
router.get('/', isAuthenticated, (req, res) => {
  const { studentId, subjectId, examType } = req.query;
  let marks = [...db.marks];
  if (studentId) marks = marks.filter(m => m.studentId === studentId);
  if (subjectId) marks = marks.filter(m => m.subjectId === subjectId);
  if (examType) marks = marks.filter(m => m.examType === examType);

  const enriched = marks.map(m => {
    const student = db.students.find(s => s.id === m.studentId);
    const subject = db.subjects.find(s => s.id === m.subjectId);
    return {
      ...m,
      studentName: student ? student.fullName : 'Unknown',
      subjectName: subject ? subject.name : 'Unknown',
      percentage: ((m.marks / m.maxMarks) * 100).toFixed(1),
      grade: calculateGrade((m.marks / m.maxMarks) * 100)
    };
  });
  res.json({ success: true, data: enriched });
});

// POST /api/marks - Enter marks
router.post('/', isAuthenticated, (req, res) => {
  const { studentId, subjectId, marks, maxMarks, examType, date } = req.body;
  if (!studentId || !subjectId || marks === undefined)
    return res.status(400).json({ success: false, message: 'Required fields missing' });

  if (parseInt(marks) > parseInt(maxMarks || 100))
    return res.status(400).json({ success: false, message: 'Marks cannot exceed max marks' });

  // Check if marks already exist for this student/subject/examType
  const existing = db.marks.find(m => m.studentId === studentId && m.subjectId === subjectId && m.examType === examType);
  if (existing) {
    existing.marks = parseInt(marks);
    existing.maxMarks = parseInt(maxMarks) || 100;
    existing.date = date;
    return res.json({ success: true, message: 'Marks updated', data: existing });
  }

  const newMark = {
    id: 'MRK' + String(db.marks.length + 1).padStart(3, '0'),
    studentId, subjectId,
    marks: parseInt(marks),
    maxMarks: parseInt(maxMarks) || 100,
    examType: examType || 'Final',
    date: date || new Date().toISOString().split('T')[0]
  };
  db.marks.push(newMark);
  res.status(201).json({ success: true, message: 'Marks entered successfully', data: newMark });
});

// PUT /api/marks/:id - Update marks
router.put('/:id', isAuthenticated, (req, res) => {
  const mark = db.marks.find(m => m.id === req.params.id);
  if (!mark) return res.status(404).json({ success: false, message: 'Record not found' });
  mark.marks = parseInt(req.body.marks);
  mark.maxMarks = parseInt(req.body.maxMarks) || mark.maxMarks;
  res.json({ success: true, message: 'Marks updated', data: mark });
});

// DELETE /api/marks/:id
router.delete('/:id', isAuthenticated, (req, res) => {
  const idx = db.marks.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Record not found' });
  db.marks.splice(idx, 1);
  res.json({ success: true, message: 'Marks deleted' });
});

// GET /api/marks/result/:studentId - Generate result card
router.get('/result/:studentId', isAuthenticated, (req, res) => {
  const student = db.students.find(s => s.id === req.params.studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const { examType } = req.query;
  let studentMarks = db.marks.filter(m => m.studentId === req.params.studentId);
  if (examType) studentMarks = studentMarks.filter(m => m.examType === examType);

  const subjectResults = studentMarks.map(m => {
    const subject = db.subjects.find(s => s.id === m.subjectId);
    const pct = (m.marks / m.maxMarks) * 100;
    return {
      subjectId: m.subjectId,
      subjectName: subject ? subject.name : 'Unknown',
      subjectCode: subject ? subject.code : '',
      marks: m.marks,
      maxMarks: m.maxMarks,
      percentage: pct.toFixed(1),
      grade: calculateGrade(pct),
      passed: pct >= 40
    };
  });

  const totalMarks = studentMarks.reduce((sum, m) => sum + m.marks, 0);
  const totalMaxMarks = studentMarks.reduce((sum, m) => sum + m.maxMarks, 0);
  const overallPercentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
  const overallGrade = calculateGrade(parseFloat(overallPercentage));
  const passed = subjectResults.every(r => r.passed);

  res.json({
    success: true,
    data: {
      student,
      examType: examType || 'Final',
      subjects: subjectResults,
      totalMarks,
      totalMaxMarks,
      overallPercentage,
      overallGrade,
      passed,
      status: passed ? 'PASS' : 'FAIL',
      generatedAt: new Date().toISOString()
    }
  });
});

// GET /api/marks/dashboard - Get dashboard stats
router.get('/dashboard', isAuthenticated, (req, res) => {
  const totalStudents = db.students.length;
  const totalSubjects = db.subjects.length;
  
  const attTotal = db.attendance.length;
  const attPresent = db.attendance.filter(a => a.status === 'present').length;
  const attendancePercentage = attTotal > 0 ? ((attPresent / attTotal) * 100).toFixed(1) : 0;

  const allResults = db.students.map(student => {
    const marks = db.marks.filter(m => m.studentId === student.id);
    if (marks.length === 0) return null;
    const total = marks.reduce((sum, m) => sum + m.marks, 0);
    const max = marks.reduce((sum, m) => sum + m.maxMarks, 0);
    return { studentId: student.id, percentage: (total / max) * 100 };
  }).filter(Boolean);

  const avgPercentage = allResults.length > 0
    ? (allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length).toFixed(1)
    : 0;

  res.json({
    success: true,
    data: { totalStudents, totalSubjects, attendancePercentage, avgPercentage }
  });
});

module.exports = router;
