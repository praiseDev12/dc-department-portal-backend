import { validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';

export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array().map((error) => error.msg).join(', '), 422));
    return;
  }
  next();
}
