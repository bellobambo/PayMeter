import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';
import { verifyToken } from '../config/jwt.js';
import { AppError } from '../utils/AppError.js';

export interface AuthenticatedRequest extends Request {
  founder?: {
    id: string;
    email: string;
    name: string;
  };
}

export function requireFounderAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError('Authorization header is required.', 401);
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        throw new AppError('Authorization header must be formatted as: Bearer <token>.', 401);
    }

    const [type, token] = parts;
    if (type !== 'Bearer' || !token) {
        throw new AppError('Authorization header must be formatted as: Bearer <token>.', 401);
    }

    const decoded = verifyToken<{ id: string; email: string; name: string }>(token, env.jwtSecret);

    if (!decoded) {
        throw new AppError('Invalid or expired authorization token.', 401);
    }

    req.founder = decoded;
    next();
}
