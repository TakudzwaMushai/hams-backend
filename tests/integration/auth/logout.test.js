const request = require('supertest');
const app     = require('../../../src/app');
const db      = require('../../setup/db');
const { signupAndLogin } = require('../../helpers/authHelper');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('POST /api/auth/logout', () => {
  it('should logout successfully with valid token', async () => {
    const { token } = await signupAndLogin();
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});