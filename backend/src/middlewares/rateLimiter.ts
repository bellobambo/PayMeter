import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

import { errorResponse } from '../utils/apiResponse.js';

/**
 * Factory for creating standard rate limiters that adhere to the PayMeter API response format.
 */
const createLimiter = (windowMinutes: number, maxRequests: number, message: string) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
        handler: (_req: Request, res: Response) => {
            return errorResponse(res, {
                statusCode: 429,
                message,
            });
        },
    });
};

/**
 * General API Limiter: Prevents overall abuse of the service from a single IP.
 * Cap: 100 requests per minute.
 */
export const generalLimiter = createLimiter(
    1,
    100,
    'Too many requests to the PayMeter service. Please try again later.'
);

/**
 * Webhook Limiter: Protects against payload parsing DoS attacks.
 * Since webhooks can be bursty in production, we set a high throughput cap: 500 req/min.
 */
export const webhookLimiter = createLimiter(
    1,
    500,
    'Too many webhook events received. Request throttled.'
);

/**
 * Meter Limiter: Critical path for Founder apps.
 * High throughput required but capped to prevent a single rogue app from causing system-wide degradation.
 * Cap: 1000 requests per minute.
 */
export const meterLimiter = createLimiter(
    1,
    1000,
    'Rate limit exceeded for metering checks. Please reduce transaction frequency.'
);

/**
 * Auth Limiter: Protects against brute-forcing login or registration routes.
 * Strict cap: 10 requests per 15 minutes.
 */
export const authLimiter = createLimiter(
    15,
    10,
    'Too many authentication attempts. Please try again in 15 minutes.'
);
