import { body } from 'express-validator';

const personalDetailValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Enter a valid date'),
  body('gender')
    .isIn(['female', 'male', 'other', 'prefer_not_to_say'])
    .withMessage('Please select a gender'),
  body('maritalStatus')
    .isIn(['single', 'married', 'widowed', 'divorced', 'prefer_not_to_say'])
    .withMessage('Please select a marital status'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('whatsappNumber').optional().trim(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('occupation').optional().trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const onboardValidation = [
  body('departmentName')
    .trim()
    .notEmpty()
    .withMessage('Department name is required'),
  body('unitName').optional().trim(),
  ...personalDetailValidators,
  body('setupCode').notEmpty().withMessage('Setup code is required'),
];

export const registerValidation = [
  body('department').notEmpty().withMessage('Please select a department'),
  body('unit').notEmpty().withMessage('Please select a unit'),
  ...personalDetailValidators,
  body('roleInUnit').optional().trim(),
  body('consentAccepted')
    .toBoolean()
    .custom((value) => value === true)
    .withMessage('You must accept the privacy notice to register'),
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
