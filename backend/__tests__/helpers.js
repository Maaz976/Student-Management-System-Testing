const request = require('supertest');
const app = require('../server');
const db = require('../config/db');

const initialData = JSON.parse(JSON.stringify(db));

function resetDatabase() {
  for (const key of Object.keys(initialData)) {
    db[key] = JSON.parse(JSON.stringify(initialData[key]));
  }
}

async function createAuthenticatedAgent() {
  const agent = request.agent(app);
  const response = await agent
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });

  if (response.status !== 200) {
    throw new Error(`Test login failed with status ${response.status}`);
  }

  return agent;
}

module.exports = {
  app,
  db,
  request,
  resetDatabase,
  createAuthenticatedAgent
};
