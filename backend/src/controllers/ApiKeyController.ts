import crypto from 'node:crypto';
import type { NextFunction, Response } from 'express';

import { supabase } from '../config/supabase.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import type { AuthenticatedRequest } from '../middlewares/auth.js';

type SupabaseSchemaError = {
    message?: string;
    code?: string;
};

function throwApiKeyStorageError(error: SupabaseSchemaError | null | undefined, fallback: string): never {
    const message = error?.message ?? '';
    const code = error?.code ?? '';
    const missingApiKeysTable =
        code === 'PGRST205' ||
        code === '42P01' ||
        message.includes('api_keys') ||
        message.toLowerCase().includes('schema cache');

    if (missingApiKeysTable) {
        throw new AppError(
            'API-key storage is not ready. Run backend/supabase/migrations/005_api_keys.sql on the deployed Supabase database, then refresh the Supabase schema cache if needed.',
            500,
            {
                migration: 'backend/supabase/migrations/005_api_keys.sql',
                database: message,
            },
        );
    }

    throw new AppError(fallback, 500, {
        database: message,
    });
}

export async function createApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founderId = req.founder?.id;
        const { name } = req.body;

        if (!founderId) {
            throw new AppError('Unauthorized. Founder account required.', 401);
        }

        // Generate 24 random bytes (48 hex characters)
        const randomHex = crypto.randomBytes(24).toString('hex');
        const rawKey = `pm_live_${randomHex}`;
        const keyPrefix = rawKey.substring(0, 14); // pm_live_xxxxxx (first 6 characters of random hex)
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const { data: apiKey, error } = await supabase
            .from('api_keys')
            .insert({
                founder_id: founderId,
                name: name,
                key_hash: keyHash,
                key_prefix: keyPrefix,
            })
            .select('id, name, key_prefix, is_active, created_at')
            .single();

        if (error || !apiKey) {
            throwApiKeyStorageError(error, 'Failed to generate API key.');
        }

        return successResponse(res, {
            statusCode: 201,
            message: 'API key created successfully. Make sure to copy it now, as it will not be shown again.',
            data: {
                id: apiKey.id,
                name: apiKey.name,
                keyPrefix: apiKey.key_prefix,
                isActive: apiKey.is_active,
                createdAt: apiKey.created_at,
                apiKey: rawKey, // Raw key returned only once
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function listApiKeys(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founderId = req.founder?.id;

        if (!founderId) {
            throw new AppError('Unauthorized. Founder account required.', 401);
        }

        const { data: apiKeys, error } = await supabase
            .from('api_keys')
            .select('id, name, key_prefix, is_active, created_at, updated_at')
            .eq('founder_id', founderId)
            .order('created_at', { ascending: false });

        if (error) {
            throwApiKeyStorageError(error, 'Failed to list API keys.');
        }

        return successResponse(res, {
            message: 'API keys retrieved successfully.',
            data: (apiKeys ?? []).map((key) => ({
                id: key.id,
                name: key.name,
                keyPrefix: key.key_prefix,
                isActive: key.is_active,
                createdAt: key.created_at,
                updatedAt: key.updated_at,
            })),
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founderId = req.founder?.id;
        const { id } = req.params;

        if (!founderId) {
            throw new AppError('Unauthorized. Founder account required.', 401);
        }

        // Verify key exists and belongs to the founder before deleting
        const { data: existing, error: fetchError } = await supabase
            .from('api_keys')
            .select('id')
            .eq('id', id)
            .eq('founder_id', founderId)
            .maybeSingle();

        if (fetchError) {
            throwApiKeyStorageError(fetchError, 'Unable to verify API key ownership.');
        }

        if (!existing) {
            throw new AppError('API key not found or not owned by you.', 404);
        }

        const { error: deleteError } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', id)
            .eq('founder_id', founderId);

        if (deleteError) {
            throwApiKeyStorageError(deleteError, 'Failed to delete API key.');
        }

        return successResponse(res, {
            message: 'API key deleted/revoked successfully.',
        });
    } catch (error) {
        next(error);
    }
}
