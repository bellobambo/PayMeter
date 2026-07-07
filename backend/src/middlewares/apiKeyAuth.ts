import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

export interface AuthenticatedApiKeyRequest extends Request {
  founder?: {
    id: string;
  };
}

export async function requireApiKey(req: AuthenticatedApiKeyRequest, _res: Response, next: NextFunction) {
    try {
        let apiKey: string | undefined;

        // 1. Check x-api-key header
        const xApiKeyHeader = req.headers['x-api-key'];
        if (typeof xApiKeyHeader === 'string') {
            apiKey = xApiKeyHeader;
        }

        // 2. Check Authorization Bearer header if x-api-key is not present
        if (!apiKey) {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const parts = authHeader.split(' ');
                if (parts.length === 2) {
                    const [type, token] = parts;
                    if (type === 'Bearer' && token) {
                        apiKey = token;
                    }
                }
            }
        }

        if (!apiKey) {
            throw new AppError('Authentication failed. API key is required.', 401);
        }

        apiKey = apiKey.trim();

        // Validate prefix format
        if (!apiKey.startsWith('pm_live_') || apiKey.length < 20) {
            throw new AppError('Invalid API key format.', 401);
        }

        // Hash the key using SHA-256
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        // Look up key in the database
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

        // Inject founder details into the request object
        req.founder = {
            id: keyRecord.founder_id,
        };

        next();
    } catch (error) {
        next(error);
    }
}
