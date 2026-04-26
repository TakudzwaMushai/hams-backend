const request = require('supertest');
const app     = require('../../src/app');
const User    = require('../../src/models/User');

const signupAndLogin = async (overrides = {}) => {
  const userData = {
    email:      'test@example.com',
    password:   'TestPass123',
    role:       'patient',
    first_name: 'Test',
    last_name:  'User',
    ...overrides
  };

  await request(app).post('/api/auth/signup').send(userData);

  // Verify the user directly in DB
  await User.updateOne(
    { email: userData.email },
    { is_verified: true, verification_token: null, verification_token_expiry: null }
  );

  const res = await request(app).post('/api/auth/login').send({
    email:    userData.email,
    password: userData.password
  });

  return {
    token:    res.body.token,
    user:     res.body.user,
    userData
  };
};

module.exports = { signupAndLogin };