const { validationResult } = require('express-validator');
const validate = require('../../../src/middleware/validate');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('Validate Middleware', () => {
  it('should call next() if no validation errors', () => {
    const req  = { body: {} };
    const res  = mockRes();
    const next = jest.fn();

    // Mock validationResult to return no errors
    jest.spyOn(require('express-validator'), 'validationResult').mockReturnValueOnce({
      isEmpty: () => true,
      array:   () => []
    });

    validate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 422 if there are validation errors', () => {
    const req  = { body: {} };
    const res  = mockRes();
    const next = jest.fn();

    jest.spyOn(require('express-validator'), 'validationResult').mockReturnValueOnce({
      isEmpty: () => false,
      array:   () => [{ msg: 'Email is required', param: 'email' }]
    });

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Email is required', param: 'email' }]
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return all errors in the errors array', () => {
    const req  = { body: {} };
    const res  = mockRes();
    const next = jest.fn();

    const mockErrors = [
      { msg: 'Email is required',    param: 'email' },
      { msg: 'Password is required', param: 'password' }
    ];

    jest.spyOn(require('express-validator'), 'validationResult').mockReturnValueOnce({
      isEmpty: () => false,
      array:   () => mockErrors
    });

    validate(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
  });
});