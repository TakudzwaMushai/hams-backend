const jwt  = require('jsonwebtoken');
const auth = require('../../../src/middleware/authMiddleware');

process.env.JWT_SECRET = 'test_secret';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Middleware', () => {
  it('should call next() with a valid token', () => {
    const token = jwt.sign({ id: 'user123', role: 'patient' }, 'test_secret');
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    const next  = jest.fn();

    auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('user123');
    expect(req.user.role).toBe('patient');
  });

  it('should return 401 if no token provided', () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is malformed', () => {
    const req  = { headers: { authorization: 'Bearer badtoken' } };
    const res  = mockRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', () => {
    const token = jwt.sign({ id: 'user123' }, 'test_secret', { expiresIn: '0s' });
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    const next  = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header missing Bearer prefix', () => {
    const token = jwt.sign({ id: 'user123' }, 'test_secret');
    const req   = { headers: { authorization: token } };
    const res   = mockRes();
    const next  = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});