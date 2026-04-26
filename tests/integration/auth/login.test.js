jest.mock('../../../src/utils/sendEmail', () => jest.fn().mockResolvedValue(true));

const request = require('supertest');
const app     = require('../../../src/app');
const db      = require('../../setup/db');
const User    = require('../../../src/models/User');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('POST /api/auth/login', () => {
  const user = {
    email:      'jane@example.com',
    password:   'SecurePass123',
    role:       'patient',
    first_name: 'Jane',
    last_name:  'Smith'
  };

  const signupAndVerify = async () => {
    await request(app).post('/api/auth/signup').send(user);
    await User.updateOne(
      { email: user.email },
      { is_verified: true, verification_token: null, verification_token_expiry: null }
    );
  };

  it('should login successfully with correct credentials', async () => {
    await signupAndVerify();
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.profile).toBeDefined();
    // Tokens in cookies not body
    expect(res.body.token).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 401 with wrong password', async () => {
    await signupAndVerify();
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: 'WrongPassword123'
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should return 401 with unregistered email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    'nobody@example.com',
      password: 'SecurePass123'
    });
    expect(res.status).toBe(401);
  });

  it('should return 422 if email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'SecurePass123' });
    expect(res.status).toBe(422);
  });

  it('should return 422 if password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email });
    expect(res.status).toBe(422);
  });

  it('should not expose password_hash in response', async () => {
    await signupAndVerify();
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('should update last_login on successful login', async () => {
    await signupAndVerify();
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    expect(res.body.user.last_login).not.toBeNull();
  });

  it('should return 403 if email is not verified', async () => {
    await request(app).post('/api/auth/signup').send(user);
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('verify your email');
  });

  it('should set access_token and refresh_token cookies on login', async () => {
    await signupAndVerify();
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    const cookies = res.headers['set-cookie'];
    expect(cookies.some(c => c.startsWith('access_token'))).toBe(true);
    expect(cookies.some(c => c.startsWith('refresh_token'))).toBe(true);
  });

  it('should set cookies as HttpOnly', async () => {
    await signupAndVerify();
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    const cookies = res.headers['set-cookie'];
    expect(cookies.every(c => c.includes('HttpOnly'))).toBe(true);
  });
});