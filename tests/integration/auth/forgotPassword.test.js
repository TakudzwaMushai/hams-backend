const request  = require('supertest');
const app      = require('../../../src/app');
const db       = require('../../setup/db');
const { signupAndLogin } = require('../../helpers/authHelper');

// Mock sendEmail so no real emails are sent during tests
jest.mock('../../../src/utils/sendEmail', () => jest.fn().mockResolvedValue(true));

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('POST /api/auth/forgot-password', () => {
  it('should return 200 for registered email', async () => {
    await signupAndLogin();
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset link');
  });

  it('should return 200 even for unregistered email (prevent enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
  });

  it('should return 422 if email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'notanemail' });
    expect(res.status).toBe(422);
  });

  it('should call sendEmail when user exists', async () => {
    const sendEmail = require('../../../src/utils/sendEmail');
    await signupAndLogin();
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });
    expect(sendEmail).toHaveBeenCalled();
  });
});