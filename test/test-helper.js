const request = require('supertest');
const app = require('../app');

// Helper function to create a test server
const createTestServer = () => {
  return request(app);
};

// Helper function to generate test data
const generateTestData = () => {
  return {
    validExtensionUrl: 'https://chrome.google.com/webstore/detail/valid-extension/abcdefghijklmnopqrstuvwxyz',
    invalidExtensionUrl: 'https://example.com/not-a-chrome-extension',
    nonExistentExtensionUrl: 'https://chrome.google.com/webstore/detail/non-existent-extension/1234567890'
  };
};

module.exports = {
  createTestServer,
  generateTestData
};
