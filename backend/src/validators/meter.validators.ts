import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

export function validateMeterCheck(req: Request, _res: Response, next: NextFunction) {
  const errors: Record<string, string> = {};
  const { userId, featureName, founderId } = req.body ?? {};

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    errors.userId = 'userId is required and must be a non-empty string.';
  }

  if (typeof featureName !== 'string' || featureName.trim().length === 0) {
    errors.featureName = 'featureName is required and must be a non-empty string.';
  }

  if (
    founderId !== undefined
    && founderId !== null
    && (typeof founderId !== 'string' || founderId.trim().length === 0)
  ) {
    errors.founderId = 'founderId must be a non-empty string when provided.';
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
  }

  req.body.userId = userId.trim();
  req.body.featureName = featureName.trim();
  if (founderId) {
    req.body.founderId = founderId.trim();
  }

  next();
}

export function validateUserBalanceQuery(req: Request, _res: Response, next: NextFunction) {
  const { userId } = req.params;

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new AppError('Validation failed. Please check the submitted fields.', 422, {
      userId: 'userId is required and must be a non-empty string.',
    });
  }

  req.params.userId = userId.trim();
  next();
}
