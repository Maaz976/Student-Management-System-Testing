module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'server.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  clearMocks: true
};
