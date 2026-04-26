const jwt  = require('jsonwebtoken');
const auth = require('../../../src/middleware/authMiddleware');

process.env.JWT_ACCESS_SECRET = 'test_access_secret';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Middleware', () => {
  it('should call next() with a valid cookie', () => {
    const token = jwt.sign({ id: 'user123', role: 'patient' }, 'test_access_secret');
    const req   = { cookies: { access_token: token } };
    const res   = mockRes();
    const next  = jest.fn();

    auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('user123');
    expect(req.user.role).toBe('patient');
  });

  it('should return 401 if no cookie provided', () => {
    const req  = { cookies: {} };
    const res  = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is malformed', () => {
    const req  = { cookies: { access_token: 'badtoken' } };
    const res  = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with TOKEN_EXPIRED code if token is expired', () => {
    const token = jwt.sign({ id: 'user123' }, 'test_access_secret', { expiresIn: '0s' });
    const req   = { cookies: { access_token: token } };
    const res   = mockRes();
    const next  = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Access token expired',
      code:    'TOKEN_EXPIRED'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if cookies object is missing', () => {
    const req  = { cookies: undefined };
    const res  = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});