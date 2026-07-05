import type { NextFunction, Response } from 'express';

import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { generateToken, hashPassword, verifyPassword } from '../config/jwt.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import type { AuthenticatedRequest } from '../middlewares/auth.js';

export async function register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { name, email, password } = req.body;

        // Check if email already exists
        const { data: existing } = await supabase
            .from('founders')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existing) {
            throw new AppError('Email address already registered.', 409, {
                email: 'A founder account already exists with this email address.',
            });
        }

        const passwordHash = hashPassword(password);

        const { data: founder, error } = await supabase
            .from('founders')
            .insert({
                name,
                email,
                password_hash: passwordHash,
            })
            .select('id, name, email')
            .single();

        if (error || !founder) {
            throw new AppError('Unable to create founder account. Please try again.', 500);
        }

        const token = generateToken(
            { id: founder.id, email: founder.email, name: founder.name },
            env.jwtSecret,
        );

        return successResponse(res, {
            statusCode: 201,
            message: 'Founder registered successfully.',
            data: {
                founder: {
                    id: founder.id,
                    name: founder.name,
                    email: founder.email,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;

        const { data: founder } = await supabase
            .from('founders')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (!founder) {
            throw new AppError('Invalid email or password.', 401);
        }

        const isValid = verifyPassword(password, founder.password_hash);
        if (!isValid) {
            throw new AppError('Invalid email or password.', 401);
        }

        const token = generateToken(
            { id: founder.id, email: founder.email, name: founder.name },
            env.jwtSecret,
        );

        return successResponse(res, {
            message: 'Founder logged in successfully.',
            data: {
                founder: {
                    id: founder.id,
                    name: founder.name,
                    email: founder.email,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founderId = req.founder?.id;

        if (!founderId) {
            throw new AppError('Unauthorized.', 401);
        }

        // 1. Fetch all features of this founder
        const { data: features, error: featuresError } = await supabase
            .from('features')
            .select('id, name, price, is_active')
            .eq('founder_id', founderId);

        if (featuresError || !features) {
            throw new AppError('Unable to retrieve features for analytics.', 500);
        }

        if (features.length === 0) {
            return successResponse(res, {
                message: 'Analytics retrieved successfully.',
                data: {
                    totalRevenue: 0,
                    activeUsersCount: 0,
                    featuresBreakdown: [],
                },
            });
        }

        const featureIds = features.map((f) => f.id);

        // 2. Fetch all usage logs for these features
        const { data: logs, error: logsError } = await supabase
            .from('usage_logs')
            .select('user_id, amount, feature_id')
            .in('feature_id', featureIds);

        if (logsError || !logs) {
            throw new AppError('Unable to retrieve usage logs for analytics.', 500);
        }

        // Aggregate stats
        let totalRevenue = 0;
        const activeUsersSet = new Set<string>();
        const featureStats: Record<string, { count: number; revenue: number }> = {};

        // Initialize breakdown map
        for (const f of features) {
            featureStats[f.id] = { count: 0, revenue: 0 };
        }

        for (const log of logs) {
            const amount = Number(log.amount);
            totalRevenue += amount;
            activeUsersSet.add(log.user_id);

            const stats = featureStats[log.feature_id];
            if (stats) {
                stats.count += 1;
                stats.revenue += amount;
            }
        }

        const featuresBreakdown = features.map((f) => ({
            id: f.id,
            name: f.name,
            price: Number(f.price),
            isActive: f.is_active,
            useCount: featureStats[f.id]?.count ?? 0,
            revenue: featureStats[f.id]?.revenue ?? 0,
        }));

        return successResponse(res, {
            message: 'Analytics retrieved successfully.',
            data: {
                totalRevenue,
                activeUsersCount: activeUsersSet.size,
                featuresBreakdown,
            },
        });
    } catch (error) {
        next(error);
    }
}
