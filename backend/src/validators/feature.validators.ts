import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

export function validateFeature(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const { name, price } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length === 0) {
        errors.name = 'Feature name is required and cannot be empty.';
    } else if (name.trim().length > 100) {
        errors.name = 'Feature name must not exceed 100 characters.';
    }

    const numericPrice = Number(price);
    if (price === undefined || price === null || !Number.isFinite(numericPrice) || numericPrice <= 0) {
        errors.price = 'Price is required and must be a valid number greater than zero.';
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.name = name.trim();
    req.body.price = numericPrice;

    next();
}
