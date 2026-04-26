jest.mock('../../../src/utils/sendEmail', () => jest.fn().mockResolvedValue(true));

const request = require('supertest');
const app     = require('../../../src/app');
const db      = require('../../setup/db');
const { signupAndLogin } = require('../../helpers/authHelper');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('POST /api/auth/logout', () => {
  it('should logout successfully with valid cookie', async () => {
    const { cookies } = await signupAndLogin();
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('should clear cookies on logout', async () => {
    const { cookies } = await signupAndLogin();
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);
    const setCookies = res.headers['set-cookie'];
    // Cookies should be cleared (Max-Age=0 or expires in the past)
    expect(setCookies.some(c => c.includes('Max-Age=0') || c.includes('Expires=Thu, 01 Jan 1970'))).toBe(true);
  });

  it('should return 401 without cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'access_token=invalidtoken');
    expect(res.status).toBe(401);
  });
});