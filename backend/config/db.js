// db.js - In-memory database (simulates MongoDB/SQL collections)
const bcrypt = require('bcryptjs');

const db = {
  admin: [
    {
      id: '1',
      username: 'admin',
      // password: admin123
      password: bcrypt.hashSync('admin123', 10),
      name: 'Administrator'
    }
  ],
  students: [
    {
      id: 'STU001',
      fullName: 'Aarav Sharma',
      class: '10',
      section: 'A',
      rollNumber: '01',
      dob: '2008-03-15',
      email: 'aarav@example.com',
      phone: '9876543210',
      address: '123 MG Road, Delhi',
      createdAt: new Date().toISOString()
    },
    {
      id: 'STU002',
      fullName: 'Priya Patel',
      class: '10',
      section: 'B',
      rollNumber: '02',
      dob: '2008-07-22',
      email: 'priya@example.com',
      phone: '9876543211',
      address: '456 Park Street, Mumbai',
      createdAt: new Date().toISOString()
    },
    {
      id: 'STU003',
      fullName: 'Rohan Verma',
      class: '9',
      section: 'A',
      rollNumber: '03',
      dob: '2009-01-10',
      email: 'rohan@example.com',
      phone: '9876543212',
      address: '789 Lake View, Bangalore',
      createdAt: new Date().toISOString()
    }
  ],
  subjects: [
    { id: 'SUB001', name: 'Mathematics', code: 'MATH10', class: '10', maxMarks: 100 },
    { id: 'SUB002', name: 'Science', code: 'SCI10', class: '10', maxMarks: 100 },
    { id: 'SUB003', name: 'English', code: 'ENG10', class: '10', maxMarks: 100 },
    { id: 'SUB004', name: 'Social Studies', code: 'SS10', class: '10', maxMarks: 100 },
    { id: 'SUB005', name: 'Hindi', code: 'HIN10', class: '10', maxMarks: 100 }
  ],
  attendance: [
    { id: 'ATT001', studentId: 'STU001', date: '2025-01-15', status: 'present' },
    { id: 'ATT002', studentId: 'STU002', date: '2025-01-15', status: 'absent' },
    { id: 'ATT003', studentId: 'STU003', date: '2025-01-15', status: 'present' }
  ],
  marks: [
    { id: 'MRK001', studentId: 'STU001', subjectId: 'SUB001', marks: 85, maxMarks: 100, examType: 'Final', date: '2025-01-10' },
    { id: 'MRK002', studentId: 'STU001', subjectId: 'SUB002', marks: 78, maxMarks: 100, examType: 'Final', date: '2025-01-10' },
    { id: 'MRK003', studentId: 'STU001', subjectId: 'SUB003', marks: 92, maxMarks: 100, examType: 'Final', date: '2025-01-10' },
    { id: 'MRK004', studentId: 'STU002', subjectId: 'SUB001', marks: 70, maxMarks: 100, examType: 'Final', date: '2025-01-10' },
    { id: 'MRK005', studentId: 'STU002', subjectId: 'SUB002', marks: 65, maxMarks: 100, examType: 'Final', date: '2025-01-10' }
  ]
};

module.exports = db;
