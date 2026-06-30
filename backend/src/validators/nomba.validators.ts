import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

type CreateVirtualAccountBody = {
  userId?: unknown;
  name?: unknown;
  email?: unknown;
  companyName?: unknown;
  phoneNumber?: unknown;
};

export function validateCreateVirtualAccount(req: Request, _res: Response, next: NextFunction) {
  const errors: Record<string, string> = {};
  const body = (req.body ?? {}) as CreateVirtualAccountBody;
  const { userId, name, email, companyName, phoneNumber } = body;

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    errors.userId = 'userId is required and must be a non-empty string.';
  } else if (userId.trim().length > 100) {
    errors.userId = 'userId must not exceed 100 characters.';
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'name is required and must be a non-empty string.';
  } else if (name.trim().length < 2) {
    errors.name = 'name must be at least 2 characters.';
  } else if (name.trim().length > 100) {
    errors.name = 'name must not exceed 100 characters.';
  }

  if (typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'email is required and must be a non-empty string.';
  } else if (!isValidEmail(email.trim())) {
    errors.email = 'email must be a valid email address.';
  } else if (email.trim().length > 254) {
    errors.email = 'email must not exceed 254 characters.';
  }

  if (
    companyName !== undefined
    && companyName !== null
    && typeof companyName !== 'string'
  ) {
    errors.companyName = 'companyName must be a string when provided.';
  } else if (typeof companyName === 'string' && companyName.trim().length > 100) {
    errors.companyName = 'companyName must not exceed 100 characters.';
  }

  if (
    phoneNumber !== undefined
    && phoneNumber !== null
    && typeof phoneNumber !== 'string'
  ) {
    errors.phoneNumber = 'phoneNumber must be a string when provided.';
  } else if (typeof phoneNumber === 'string' && phoneNumber.trim().length > 30) {
    errors.phoneNumber = 'phoneNumber must not exceed 30 characters.';
  } else if (
    typeof phoneNumber === 'string'
    && phoneNumber.trim().length > 0
    && !isValidPhoneNumber(phoneNumber.trim())
  ) {
    errors.phoneNumber = 'phoneNumber may only contain digits, spaces, +, -, and parentheses.';
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
  }

  req.body.userId = (userId as string).trim();
  req.body.name = (name as string).trim();
  req.body.email = (email as string).trim().toLowerCase();
  req.body.companyName = typeof companyName === 'string' && companyName.trim().length > 0
    ? companyName.trim()
    : null;
  req.body.phoneNumber = typeof phoneNumber === 'string' && phoneNumber.trim().length > 0
    ? phoneNumber.trim()
    : null;

  next();
}

export function validateGetVirtualAccount(req: Request, _res: Response, next: NextFunction) {
  const { userId } = req.params;

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new AppError('Validation failed. Please check the submitted fields.', 422, {
      userId: 'userId is required and must be a non-empty string.',
    });
  }

  if (userId.trim().length > 100) {
    throw new AppError('Validation failed. Please check the submitted fields.', 422, {
      userId: 'userId must not exceed 100 characters.',
    });
  }

  req.params.userId = userId.trim();

  next();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhoneNumber(phoneNumber: string) {
  return /^[+\d\s().-]+$/.test(phoneNumber);
}
