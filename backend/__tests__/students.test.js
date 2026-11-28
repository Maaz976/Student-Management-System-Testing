const { request, app, db, resetDatabase, createAuthenticatedAgent } = require('./helpers');

let agent;

beforeEach(async () => {
  resetDatabase();
  agent = await createAuthenticatedAgent();
});

describe('Students routes — white-box tests', () => {
  test('blocks access without authentication', async () => {
    const response = await request(app).get('/api/students');
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  test('returns all seeded students', async () => {
    const response = await agent.get('/api/students');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
    expect(response.body.data).toHaveLength(3);
  });

  test('filters students by a case-insensitive name, ID, or roll number', async () => {
    const byName = await agent.get('/api/students?search=aarav');
    const byId = await agent.get('/api/students?search=STU002');
    const byRoll = await agent.get('/api/students?search=03');
    expect(byName.body.data[0].fullName).toBe('Aarav Sharma');
    expect(byId.body.data[0].id).toBe('STU002');
    expect(byRoll.body.data[0].id).toBe('STU003');
  });

  test('returns 404 for an unknown student', async () => {
    const response = await agent.get('/api/students/NOT-FOUND');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Student not found');
  });

  test('rejects missing required student fields', async () => {
    const response = await agent.post('/api/students').send({ fullName: 'Incomplete' });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Required fields missing');
  });

  test('rejects a duplicate roll number within the same class and section', async () => {
    const response = await agent.post('/api/students').send({
      fullName: 'Duplicate Student', class: '10', section: 'A', rollNumber: '01'
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/already exists/);
  });

  test('creates a student and returns its generated ID', async () => {
    const response = await agent.post('/api/students').send({
      fullName: 'White Box Student', class: '8', section: 'C', rollNumber: 'WB-01'
    });
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe('STU004');
    expect(db.students).toHaveLength(4);
  });

  test('updates an existing student', async () => {
    const response = await agent.put('/api/students/STU001').send({
      fullName: 'Updated Student', class: '10', section: 'A', rollNumber: '01'
    });
    expect(response.status).toBe(200);
    expect(response.body.data.fullName).toBe('Updated Student');
  });

  test('returns 404 when updating a nonexistent student', async () => {
    const response = await agent.put('/api/students/MISSING').send({ fullName: 'Nobody' });
    expect(response.status).toBe(404);
  });

  test('deletes an existing student and then returns 404 for it', async () => {
    const deletion = await agent.delete('/api/students/STU003');
    expect(deletion.status).toBe(200);
    expect(db.students).toHaveLength(2);

    const lookup = await agent.get('/api/students/STU003');
    expect(lookup.status).toBe(404);
  });
});
