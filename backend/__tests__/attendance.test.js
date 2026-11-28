const { request, app, db, resetDatabase, createAuthenticatedAgent } = require('./helpers');

let agent;

beforeEach(async () => {
  resetDatabase();
  agent = await createAuthenticatedAgent();
});

describe('Attendance routes — white-box tests', () => {
  test('returns all attendance records with student details', async () => {
    const response = await agent.get('/api/attendance');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data[0].studentName).toBe('Aarav Sharma');
  });

  test('filters attendance by date, student, and class', async () => {
    const byDate = await agent.get('/api/attendance?date=2025-01-15');
    const byStudent = await agent.get('/api/attendance?studentId=STU002');
    const byClass = await agent.get('/api/attendance?class=10');
    expect(byDate.body.data).toHaveLength(3);
    expect(byStudent.body.data).toHaveLength(1);
    expect(byClass.body.data).toHaveLength(2);
  });

  test('uses Unknown and empty class details when a record references a missing student', async () => {
    db.attendance.push({ id: 'ATT-ORPHAN', studentId: 'MISSING', date: '2025-02-01', status: 'present' });
    const response = await agent.get('/api/attendance?date=2025-02-01');
    expect(response.body.data[0].studentName).toBe('Unknown');
    expect(response.body.data[0].studentClass).toBe('');
  });

  test('rejects a bulk request without a date or records array', async () => {
    const noDate = await agent.post('/api/attendance/bulk').send({ records: [] });
    const noRecords = await agent.post('/api/attendance/bulk').send({ date: '2025-02-02' });
    expect(noDate.status).toBe(400);
    expect(noRecords.status).toBe(400);
  });

  test('inserts new attendance records in bulk', async () => {
    const response = await agent.post('/api/attendance/bulk').send({
      date: '2025-02-03',
      records: [
        { studentId: 'STU001', status: 'present' },
        { studentId: 'STU002', status: 'absent' }
      ]
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Attendance saved for 2 students');
    expect(db.attendance).toHaveLength(5);
  });

  test('updates an existing student/date attendance record instead of inserting a duplicate', async () => {
    const response = await agent.post('/api/attendance/bulk').send({
      date: '2025-01-15', records: [{ studentId: 'STU001', status: 'absent' }]
    });
    expect(response.status).toBe(200);
    expect(db.attendance).toHaveLength(3);
    expect(db.attendance.find(record => record.id === 'ATT001').status).toBe('absent');
  });

  test('updates one attendance record and returns 404 for an unknown record', async () => {
    const updated = await agent.put('/api/attendance/ATT001').send({ status: 'absent' });
    const missing = await agent.put('/api/attendance/NO-ATT').send({ status: 'present' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('absent');
    expect(missing.status).toBe(404);
  });

  test('calculates attendance statistics for a populated data set', async () => {
    const response = await agent.get('/api/attendance/stats');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ total: 3, present: 2, absent: 1, percentage: '66.7' });
  });

  test('returns zero attendance percentage when there are no records', async () => {
    db.attendance = [];
    const response = await agent.get('/api/attendance/stats');
    expect(response.body.data).toEqual({ total: 0, present: 0, absent: 0, percentage: 0 });
  });
});
