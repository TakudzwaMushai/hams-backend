jest.mock('../../../src/utils/sendEmail', () => jest.fn().mockResolvedValue(true));

const request = require('supertest');
const app     = require('../../../src/app');
const db      = require('../../setup/db');
const { signupAndLogin } = require('../../helpers/authHelper');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('GET /api/auth/me', () => {
  it('should return current user and profile', async () => {
    const { cookies } = await signupAndLogin();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.profile).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should not expose password_hash', async () => {
    const { cookies } = await signupAndLogin();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('should return 401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return correct role in response', async () => {
    const { cookies } = await signupAndLogin({ role: 'patient' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);
    expect(res.body.user.role).toBe('patient');
  });
});