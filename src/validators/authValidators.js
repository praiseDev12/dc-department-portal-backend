import { body } from 'express-validator';

export const onboardValidation = [
  body('departmentName')
    .trim()
    .notEmpty()
    .withMessage('Department name is required'),
  body('unitName').optional().trim(),
  body('adminName').trim().notEmpty().withMessage('Admin name is required'),
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

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
