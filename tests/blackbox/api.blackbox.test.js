const request = require('supertest');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const agent = request.agent(BASE_URL);
const createdMarkIds = [];

beforeAll(async () => {
  const health = await request(BASE_URL).get('/api/health');
  if (health.status !== 200) {
    throw new Error(`Application is not healthy at ${BASE_URL}`);
  }
  const login = await agent.post('/api/auth/login').send({ username: ADMIN_USER, password: ADMIN_PASS });
  if (login.status !== 200) {
    throw new Error(`Admin login failed with status ${login.status}`);
  }
});

afterAll(async () => {
  for (const id of createdMarkIds) {
    await agent.delete(`/api/marks/${id}`);
  }
});

describe('Black-box test suite — 12 test cases across six techniques', () => {
  describe('Equivalence Partitioning', () => {
    test('BB-EP-01: valid administrator credentials are accepted', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ username: ADMIN_USER, password: ADMIN_PASS });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.admin.username).toBe(ADMIN_USER);
    });

    test('BB-EP-02: an invalid password is rejected', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ username: ADMIN_USER, password: 'wrong-password' });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('BB-EP-03: an unknown username is rejected', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ username: 'unknown-user', password: ADMIN_PASS });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('Boundary Value Analysis', () => {
    test('BB-BVA-01: zero marks are accepted at the lower boundary', async () => {
      const response = await agent.post('/api/marks').send({
        studentId: 'STU003', subjectId: 'SUB005', marks: 0, maxMarks: 100,
        examType: `BB-BVA-ZERO-${Date.now()}`
      });
      expect(response.status).toBe(201);
      expect(response.body.data.marks).toBe(0);
      expect(response.body.data.maxMarks).toBe(100);
      createdMarkIds.push(response.body.data.id);
    });

    test('BB-BVA-02: maximum marks are accepted at the upper boundary', async () => {
      const response = await agent.post('/api/marks').send({
        studentId: 'STU003', subjectId: 'SUB005', marks: 100, maxMarks: 100,
        examType: `BB-BVA-MAX-${Date.now()}`
      });
      expect(response.status).toBe(201);
      expect(response.body.data.marks).toBe(100);
      createdMarkIds.push(response.body.data.id);
    });

    test('BB-BVA-03: marks one above the maximum are rejected', async () => {
      const response = await agent.post('/api/marks').send({
        studentId: 'STU003', subjectId: 'SUB005', marks: 101, maxMarks: 100,
        examType: `BB-BVA-OVER-${Date.now()}`
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Marks cannot exceed max marks');
    });
  });

  describe('Decision Table Testing', () => {
    test('BB-DT-01: missing username is rejected', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ password: ADMIN_PASS });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username and password required');
    });

    test('BB-DT-02: missing password is rejected', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ username: ADMIN_USER });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username and password required');
    });
  });

  describe('State Transition Testing', () => {
    test('BB-ST-01: login grants access, logout removes access', async () => {
      const session = request.agent(BASE_URL);
      const login = await session.post('/api/auth/login').send({ username: ADMIN_USER, password: ADMIN_PASS });
      expect(login.status).toBe(200);

      const authenticated = await session.get('/api/auth/me');
      expect(authenticated.status).toBe(200);

      const logout = await session.post('/api/auth/logout');
      expect(logout.status).toBe(200);

      const unauthenticated = await session.get('/api/auth/me');
      expect(unauthenticated.status).toBe(401);

      const protectedResource = await session.get('/api/students');
      expect(protectedResource.status).toBe(401);
    });
  });

  describe('Scenario-Based Testing', () => {
    test('BB-SC-01: administrator creates, retrieves, updates, and deletes a student', async () => {
      const suffix = Date.now();
      const created = await agent.post('/api/students').send({
        fullName: 'Black Box Scenario Student',
        class: '8', section: 'Z', rollNumber: `BB-${suffix}`
      });
      expect(created.status).toBe(201);
      const studentId = created.body.data.id;

      const retrieved = await agent.get(`/api/students/${studentId}`);
      expect(retrieved.status).toBe(200);
      expect(retrieved.body.data.fullName).toBe('Black Box Scenario Student');

      const updated = await agent.put(`/api/students/${studentId}`).send({
        fullName: 'Updated Black Box Student',
        class: '8', section: 'Z', rollNumber: `BB-${suffix}`
      });
      expect(updated.status).toBe(200);
      expect(updated.body.data.fullName).toBe('Updated Black Box Student');

      const deleted = await agent.delete(`/api/students/${studentId}`);
      expect(deleted.status).toBe(200);

      const afterDelete = await agent.get(`/api/students/${studentId}`);
      expect(afterDelete.status).toBe(404);
    });
  });

  describe('Error Guessing', () => {
    test('BB-EG-01: creating a student without required fields is rejected', async () => {
      const response = await agent.post('/api/students').send({ fullName: 'Incomplete Student' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Required fields missing');
    });

    test('BB-EG-02: duplicate roll number in the same class and section is rejected', async () => {
      const response = await agent.post('/api/students').send({
        fullName: 'Duplicate Roll Number Student',
        class: '10', section: 'A', rollNumber: '01'
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Roll number already exists in this class/section');
    });
  });
});
