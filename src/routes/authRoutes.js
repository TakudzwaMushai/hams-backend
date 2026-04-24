const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { signup, login } = require('../controllers/authController');

const signupValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/signup', signupValidation, validate, signup);
router.post('/login',  loginValidation,  validate, login);

module.exports = router;