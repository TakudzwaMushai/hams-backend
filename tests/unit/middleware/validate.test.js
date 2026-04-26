const validate = require('../../../src/middleware/validate');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// Mock the entire express-validator module
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validationResult } = require('express-validator');

describe('Validate Middleware', () => {
  it('should call next() if no validation errors', () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => true,
      array:   () => []
    });

    const req  = { body: {} };
    const res  = mockRes();
    const next = jest.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 422 if there are validation errors', () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array:   () => [{ msg: 'Email is required', param: 'email' }]
    });

    const req  = { body: {} };
    const res  = mockRes();
    const next = jest.fn();

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Email is required', param: 'email' }]
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return all errors in the errors array', () => {
    const mockErrors = [
      { msg: 'Email is required',    param: 'email' },
      { msg: 'Password is required', param: 'password' }
    ];

    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array:   () => mockErrors
    });

    const req  = { body: {} };
    const res  = mockRes();
    const next = jest.fn();

    validate(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
    expect(next).not.toHaveBeenCalled();
  });
});