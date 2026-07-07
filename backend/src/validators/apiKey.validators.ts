import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

export function validateCreateApiKey(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const { name } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length === 0) {
        errors.name = 'API key name is required and cannot be empty.';
    } else if (name.trim().length > 100) {
        errors.name = 'API key name must not exceed 100 characters.';
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.name = name.trim();
    next();
}

export function validateDeleteApiKey(req: Request, _res: Response, next: NextFunction) {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (typeof id !== 'string' || !uuidRegex.test(id)) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, {
            id: 'A valid API key ID (UUID) must be provided in the URL path.',
        });
    }

    next();
}
