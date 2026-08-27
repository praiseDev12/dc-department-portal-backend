import { body } from 'express-validator';

export const registerUnitAdminValidation = [
  body('department').notEmpty().withMessage('Please select a department'),
  body('unit').notEmpty().withMessage('Please select a unit'),
  body('adminName').trim().notEmpty().withMessage('Your name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('setupCode').notEmpty().withMessage('Setup code is required'),
];
