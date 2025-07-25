module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
-    '**/*.js',
+    '<rootDir>/src/**/*.js',
+    '!<rootDir>/src/**/__tests__/**',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!**/bin/**'
  ]
};
