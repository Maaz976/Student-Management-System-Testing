const { request, app, db, resetDatabase, createAuthenticatedAgent } = require('./helpers');

let agent;

beforeEach(async () => {
  resetDatabase();
  agent = await createAuthenticatedAgent();
});

describe('Subjects routes — white-box tests', () => {
  test('returns all seeded subjects and their count', async () => {
    const response = await agent.get('/api/subjects');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(5);
  });

  test('returns a subject by ID and 404 for an unknown ID', async () => {
    const found = await agent.get('/api/subjects/SUB001');
    const missing = await agent.get('/api/subjects/NO-SUBJECT');
    expect(found.status).toBe(200);
    expect(found.body.data.name).toBe('Mathematics');
    expect(missing.status).toBe(404);
  });

  test('rejects a subject when name or code is missing', async () => {
    const response = await agent.post('/api/subjects').send({ name: 'No Code' });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Name and code required');
  });

  test('rejects a duplicate subject code', async () => {
    const response = await agent.post('/api/subjects').send({ name: 'Duplicate', code: 'MATH10' });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Subject code already exists');
  });

  test('creates a subject with default class and maximum marks', async () => {
    const response = await agent.post('/api/subjects').send({ name: 'Defaulted Subject', code: 'WB-DEFAULT' });
    expect(response.status).toBe(201);
    expect(response.body.data.class).toBe('All');
    expect(response.body.data.maxMarks).toBe(100);
    expect(db.subjects).toHaveLength(6);
  });

  test('creates a subject with supplied class and maximum marks', async () => {
    const response = await agent.post('/api/subjects').send({
      name: 'Advanced Science', code: 'WB-SCI-2', class: '12', maxMarks: 80
    });
    expect(response.status).toBe(201);
    expect(response.body.data.maxMarks).toBe(80);
  });

  test('updates a subject', async () => {
    const response = await agent.put('/api/subjects/SUB001').send({
      name: 'Updated Mathematics', code: 'MATH-UPDATED', class: '11', maxMarks: 75
    });
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Updated Mathematics');
    expect(response.body.data.maxMarks).toBe(75);
  });

  test('returns 404 when updating or deleting an unknown subject', async () => {
    const update = await agent.put('/api/subjects/UNKNOWN').send({ name: 'X', code: 'X' });
    const deletion = await agent.delete('/api/subjects/UNKNOWN');
    expect(update.status).toBe(404);
    expect(deletion.status).toBe(404);
  });

  test('deletes an existing subject', async () => {
    const response = await agent.delete('/api/subjects/SUB005');
    expect(response.status).toBe(200);
    expect(db.subjects.some(subject => subject.id === 'SUB005')).toBe(false);
  });
});
