const { request, app, db, resetDatabase, createAuthenticatedAgent } = require('./helpers');

let agent;

beforeEach(async () => {
  resetDatabase();
  agent = await createAuthenticatedAgent();
});

describe('Marks and results routes — white-box tests', () => {
  test('returns marks and enriches them with student, subject, percentage, and grade', async () => {
    const response = await agent.get('/api/marks');
    expect(response.status).toBe(200);
    expect(response.body.data[0].studentName).toBe('Aarav Sharma');
    expect(response.body.data[0].subjectName).toBe('Mathematics');
    expect(response.body.data[0].percentage).toBe('85.0');
    expect(response.body.data[0].grade).toBe('A');
  });

  test('filters marks by student, subject, and exam type', async () => {
    const response = await agent.get('/api/marks?studentId=STU001&subjectId=SUB001&examType=Final');
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe('MRK001');
  });

  test('covers every grade boundary through the marks listing route', async () => {
    const cases = [
      [0, 'F'], [39, 'F'], [40, 'D'], [49, 'D'], [50, 'C'], [59, 'C'],
      [60, 'B'], [69, 'B'], [70, 'B+'], [79, 'B+'], [80, 'A'], [89, 'A'],
      [90, 'A+'], [100, 'A+']
    ];

    for (const [marks, expectedGrade] of cases) {
      const created = await agent.post('/api/marks').send({
        studentId: 'STU003', subjectId: 'SUB005', marks, maxMarks: 100,
        examType: `WB-GRADE-${marks}`
      });
      expect(created.status).toBe(201);
      expect(created.body.data.marks).toBe(marks);
    }

    const listing = await agent.get('/api/marks?studentId=STU003&subjectId=SUB005');
    for (const [marks, expectedGrade] of cases) {
      const record = listing.body.data.find(item => item.examType === `WB-GRADE-${marks}`);
      expect(record).toBeDefined();
      expect(record.grade).toBe(expectedGrade);
    }
  });

  test('rejects missing required fields and marks above maximum marks', async () => {
    const missing = await agent.post('/api/marks').send({ studentId: 'STU001' });
    const excessive = await agent.post('/api/marks').send({
      studentId: 'STU001', subjectId: 'SUB001', marks: 101, maxMarks: 100, examType: 'WB-OVER'
    });
    expect(missing.status).toBe(400);
    expect(missing.body.message).toBe('Required fields missing');
    expect(excessive.status).toBe(400);
    expect(excessive.body.message).toBe('Marks cannot exceed max marks');
  });

  test('updates an existing student/subject/examType record instead of inserting another', async () => {
    const response = await agent.post('/api/marks').send({
      studentId: 'STU001', subjectId: 'SUB001', marks: 88, maxMarks: 100, examType: 'Final'
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Marks updated');
    expect(db.marks).toHaveLength(5);
    expect(db.marks.find(mark => mark.id === 'MRK001').marks).toBe(88);
  });

  test('creates marks with default maxMarks, examType, and date', async () => {
    const response = await agent.post('/api/marks').send({
      studentId: 'STU003', subjectId: 'SUB005', marks: 75, examType: 'WB-DEFAULT'
    });
    expect(response.status).toBe(201);
    expect(response.body.data.maxMarks).toBe(100);
    expect(response.body.data.examType).toBe('WB-DEFAULT');
    expect(response.body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('updates marks and returns 404 for a missing record', async () => {
    const updated = await agent.put('/api/marks/MRK001').send({ marks: 91, maxMarks: 100 });
    const missing = await agent.put('/api/marks/UNKNOWN').send({ marks: 10 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.marks).toBe(91);
    expect(missing.status).toBe(404);
  });

  test('deletes a mark and returns 404 when deleting it again', async () => {
    const deleted = await agent.delete('/api/marks/MRK005');
    const missing = await agent.delete('/api/marks/MRK005');
    expect(deleted.status).toBe(200);
    expect(missing.status).toBe(404);
  });

  test('returns 404 for a result card belonging to an unknown student', async () => {
    const response = await agent.get('/api/marks/result/UNKNOWN');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Student not found');
  });

  test('generates a result card with subject grades and overall pass/fail status', async () => {
    const response = await agent.get('/api/marks/result/STU001?examType=Final');
    expect(response.status).toBe(200);
    expect(response.body.data.subjects).toHaveLength(3);
    expect(response.body.data.overallPercentage).toBe('85.0');
    expect(response.body.data.status).toBe('PASS');
  });

  test('treats a student with no marks as a passing empty result under current implementation', async () => {
    const response = await agent.get('/api/marks/result/STU003?examType=NO-SUCH-EXAM');
    expect(response.status).toBe(200);
    expect(response.body.data.subjects).toHaveLength(0);
    expect(response.body.data.passed).toBe(true);
    expect(response.body.data.overallPercentage).toBe(0);
  });

  test('calculates dashboard averages and handles students without marks', async () => {
    const response = await agent.get('/api/marks/dashboard');
    expect(response.status).toBe(200);
    expect(response.body.data.totalStudents).toBe(3);
    expect(response.body.data.totalSubjects).toBe(5);
    expect(response.body.data.avgPercentage).toBeDefined();
  });

  test('returns zero dashboard percentages when attendance and marks are empty', async () => {
    db.attendance = [];
    db.marks = [];
    const response = await agent.get('/api/marks/dashboard');
    expect(response.body.data.attendancePercentage).toBe(0);
    expect(response.body.data.avgPercentage).toBe(0);
  });
});
