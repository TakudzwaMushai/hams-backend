const request = require('supertest');
const app     = require('../../../src/app');
const db      = require('../../setup/db');

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

  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(user);
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.profile).toBeDefined();
  });

  it('should return 401 with wrong password', async () => {
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
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('should update last_login on successful login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    user.email,
      password: user.password
    });
    expect(res.body.user.last_login).not.toBeNull();
  });
});