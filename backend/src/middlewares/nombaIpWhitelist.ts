import type { NextFunction, Request, Response } from 'express';
import { errorResponse } from '../utils/apiResponse.js';

// For production, these would be the official Nomba IP ranges.
// We include localhost addresses to ensure we don't break local development and testing.
const DEFAULT_ALLOWED_IPS = new Set([
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
]);

/**
 * Defense-in-depth middleware to restrict access to the Nomba Webhook endpoint.
 * Even if signatures are secure, dropping unauthorized network traffic 
 * preserves server resources and limits exposure.
 */
export function nombaIpWhitelist(req: Request, res: Response, next: NextFunction) {
    // Note: req.ip requires `app.set('trust proxy', ...)` to be correctly configured 
    // if running behind a reverse proxy or load balancer.
    const clientIp = req.ip;

    if (!clientIp) {
        return errorResponse(res, {
            statusCode: 403,
            message: 'Forbidden. Client IP could not be determined.',
        });
    }

    // Allow override via environment variable for production deployments
    const envAllowedIps = process.env.NOMBA_WEBHOOK_IPS 
        ? process.env.NOMBA_WEBHOOK_IPS.split(',').map(ip => ip.trim())
        : [];

    const isAllowed = DEFAULT_ALLOWED_IPS.has(clientIp) || envAllowedIps.includes(clientIp);

    if (!isAllowed) {
        console.warn(`[SECURITY] Blocked unauthorized webhook attempt from IP: ${clientIp}`);
        return errorResponse(res, {
            statusCode: 403,
            message: 'Forbidden. IP address not whitelisted for webhooks.',
        });
    }

    next();
}
