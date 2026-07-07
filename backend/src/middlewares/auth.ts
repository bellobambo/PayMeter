import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';
import { verifyToken } from '../config/jwt.js';
import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

export interface AuthenticatedRequest extends Request {
  founder?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export function requireFounderAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    let token = req.cookies?.jwt;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }
    }

    if (!token) {
        throw new AppError('Authorization failed. Cookie or Bearer token is required.', 401);
    }

    const decoded = verifyToken<{ id: string; email: string; name: string }>(token, env.jwtSecret);

    if (!decoded) {
        throw new AppError('Invalid or expired authorization token.', 401);
    }

    req.founder = decoded;
    next();
}

export async function requireApiKeyOrJwt(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    try {
        let apiKey: string | undefined;
        let jwtToken: string | undefined;

        // 1. Check x-api-key header
        const xApiKeyHeader = req.headers['x-api-key'];
        if (typeof xApiKeyHeader === 'string') {
            apiKey = xApiKeyHeader;
        }

        // 2. Check cookies or Authorization Bearer header
        if (req.cookies?.jwt) {
            jwtToken = req.cookies.jwt;
        }

        const authHeader = req.headers.authorization;
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2) {
                const [type, token] = parts;
                if (type === 'Bearer' && token) {
                    if (token.startsWith('pm_live_')) {
                        apiKey = token;
                    } else if (!jwtToken) {
                        jwtToken = token;
                    }
                }
            }
        }

        // 3. Authenticate via API Key if present
        if (apiKey) {
            const trimmedKey = apiKey.trim();
            if (trimmedKey.length < 20) {
                throw new AppError('Invalid API key format.', 401);
            }
            const keyHash = crypto.createHash('sha256').update(trimmedKey).digest('hex');

            const { data: keyRecord, error } = await supabase
                .from('api_keys')
                .select('founder_id, is_active')
                .eq('key_hash', keyHash)
                .maybeSingle();

            if (error) {
                throw new AppError(`Database error validating API key: ${error.message}`, 500);
            }

            if (!keyRecord) {
                throw new AppError('Invalid API key.', 401);
            }

            if (!keyRecord.is_active) {
                throw new AppError('API key is inactive/revoked.', 401);
            }

            req.founder = {
                id: keyRecord.founder_id,
            };

            return next();
        }

        // 4. Authenticate via JWT if present
        if (jwtToken) {
            const decoded = verifyToken<{ id: string; email: string; name: string }>(jwtToken, env.jwtSecret);
            if (!decoded) {
                throw new AppError('Invalid or expired authorization token.', 401);
            }

            req.founder = decoded;
            return next();
        }

        throw new AppError('Authentication failed. API key or Bearer token is required.', 401);
    } catch (error) {
        next(error);
    }
}

