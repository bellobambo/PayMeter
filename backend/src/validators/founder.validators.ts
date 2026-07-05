import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

export function validateFounderRegister(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const { name, email, password } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length === 0) {
        errors.name = 'Name is required and cannot be empty.';
    } else if (name.trim().length > 100) {
        errors.name = 'Name must not exceed 100 characters.';
    }

    if (typeof email !== 'string' || email.trim().length === 0) {
        errors.email = 'Email is required and cannot be empty.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Email must be a valid email address.';
    } else if (email.trim().length > 254) {
        errors.email = 'Email must not exceed 254 characters.';
    }

    if (typeof password !== 'string' || password.length < 6) {
        errors.password = 'Password is required and must be at least 6 characters.';
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.name = name.trim();
    req.body.email = email.trim().toLowerCase();
    req.body.password = password;

    next();
}

export function validateFounderLogin(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || email.trim().length === 0) {
        errors.email = 'Email is required.';
    }

    if (typeof password !== 'string' || password.length === 0) {
        errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.email = email.trim().toLowerCase();
    req.body.password = password;

    next();
}
