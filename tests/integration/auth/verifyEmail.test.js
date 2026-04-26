const request = require('supertest');
const app     = require('../../../src/app');
const db      = require('../../setup/db');
const User    = require('../../../src/models/User');

jest.mock('../../../src/utils/sendEmail', () => jest.fn().mockResolvedValue(true));

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('GET /api/auth/verify-email', () => {
  const userData = {
    email:      'jane@example.com',
    password:   'SecurePass123',
    role:       'patient',
    first_name: 'Jane',
    last_name:  'Smith'
  };

  it('should verify email with valid token', async () => {
    await request(app).post('/api/auth/signup').send(userData);
    const user  = await User.findOne({ email: userData.email });
    const token = user.verification_token;

    const res = await request(app).get(`/api/auth/verify-email?token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('verified successfully');
  });

  it('should set is_verified to true after verification', async () => {
    await request(app).post('/api/auth/signup').send(userData);
    const user  = await User.findOne({ email: userData.email });
    const token = user.verification_token;

    await request(app).get(`/api/auth/verify-email?token=${token}`);

    const updated = await User.findOne({ email: userData.email });
    expect(updated.is_verified).toBe(true);
    expect(updated.verification_token).toBeNull();
    expect(updated.verification_token_expiry).toBeNull();
  });

  it('should return 400 for invalid token', async () => {
    const res = await request(app).get('/api/auth/verify-email?token=invalidtoken');
    expect(res.status).toBe(400);
  });

  it('should return 400 if token is missing', async () => {
    const res = await request(app).get('/api/auth/verify-email');
    expect(res.status).toBe(400);
  });

  it('should allow login after verification', async () => {
    await request(app).post('/api/auth/signup').send(userData);
    const user  = await User.findOne({ email: userData.email });
    await request(app).get(`/api/auth/verify-email?token=${user.verification_token}`);

    const loginRes = await request(app).post('/api/auth/login').send({
      email:    userData.email,
      password: userData.password
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});

describe('POST /api/auth/resend-verification', () => {
  const userData = {
    email:      'jane@example.com',
    password:   'SecurePass123',
    role:       'patient',
    first_name: 'Jane',
    last_name:  'Smith'
  };

  it('should resend verification email for unverified user', async () => {
    await request(app).post('/api/auth/signup').send(userData);
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: userData.email });
    expect(res.status).toBe(200);
  });

  it('should return 200 for unregistered email (prevent enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
  });

  it('should return 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'notanemail' });
    expect(res.status).toBe(422);
  });

  it('should generate a new token on resend', async () => {
    await request(app).post('/api/auth/signup').send(userData);
    const before = await User.findOne({ email: userData.email });
    const oldToken = before.verification_token;

    await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: userData.email });

    const after = await User.findOne({ email: userData.email });
    expect(after.verification_token).not.toBe(oldToken);
  });
});