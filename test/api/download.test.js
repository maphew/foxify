const request = require('supertest');
const { createTestServer, generateTestData } = require('../test-helper');
const app = require('../../app');

describe('Download API', () => {
  let server;
  const { validExtensionUrl, invalidExtensionUrl, nonExistentExtensionUrl } = generateTestData();

  beforeAll(() => {
    server = createTestServer();
  });

  afterAll((done) => {
    // Close the server if needed
    if (server && server.close) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('GET /download/:name.:format', () => {
    it('should return 400 for missing URL parameter', async () => {
      const res = await request(app)
        .get('/download/extension.xpi');
      
      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 for invalid Chrome Web Store URL', async () => {
      const res = await request(app)
        .get(`/download/extension.xpi?url=${encodeURIComponent(invalidExtensionUrl)}`);
      
      expect(res.statusCode).toEqual(400);
    });

    // Note: This test requires mocking the Chrome Web Store API
    it.skip('should return 200 for valid extension URL', async () => {
      const res = await request(app)
        .get(`/download/extension.xpi?url=${encodeURIComponent(validExtensionUrl)}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toMatch(/application\/x-xpinstall/);
    });

    // Test different formats
    it('should support ZIP format', async () => {
      const res = await request(app)
        .get(`/download/extension.zip?url=${encodeURIComponent(validExtensionUrl)}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toMatch(/application\/zip/);
    });

    it('should support CRX format', async () => {
      const res = await request(app)
        .get(`/download/extension.crx?url=${encodeURIComponent(validExtensionUrl)}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toMatch(/application\/x-chrome-extension/);
    });
  });
});
