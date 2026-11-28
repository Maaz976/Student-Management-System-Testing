const { app, request, resetDatabase } = require('./helpers');

let agent;

beforeEach(() => {
  resetDatabase();
  agent = request.agent(app);
});

describe('Authentication routes — white-box tests', () => {
  test('rejects a login when username and password are missing', async () => {
    const response = await agent.post('/api/auth/login').send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Username and password required');
  });

  test('rejects a login when the username does not exist', async () => {
    const response = await agent
      .post('/api/auth/login')
      .send({ username: 'unknown-user', password: 'admin123' });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('rejects a login when the password is incorrect', async () => {
    const response = await agent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'incorrect' });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('authenticates valid credentials and exposes the session admin', async () => {
    const login = await agent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(login.status).toBe(200);
    expect(login.body.admin.username).toBe('admin');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.admin.name).toBe('Administrator');
  });

  test('returns 401 from /me without an authenticated session', async () => {
    const response = await agent.get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Not authenticated');
  });

  test('destroys the session on logout', async () => {
    await agent.post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);
    expect(logout.body.message).toBe('Logged out successfully');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});
