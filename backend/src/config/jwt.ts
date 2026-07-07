import crypto from 'node:crypto';

const CURRENT_ITERATIONS = 310000;

/**
 * Hashes a plaintext password using PBKDF2.
 * Output format: salt:iterations:hash (or legacy salt:hash)
 */
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, CURRENT_ITERATIONS, 64, 'sha512').toString('hex');
    return `${salt}:${CURRENT_ITERATIONS}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 string.
 * Seamlessly supports legacy formats without breaking existing logins.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    let salt: string | undefined;
    let iterationsStr: string | undefined;
    let hash: string | undefined;
    
    if (parts.length === 2) {
        [salt, hash] = parts;
        iterationsStr = '10000'; // Legacy iteration count
    } else if (parts.length === 3) {
        [salt, iterationsStr, hash] = parts;
    } else {
        return false;
    }

    if (!salt || !hash || !iterationsStr) {
        return false;
    }

    const iterations = parseInt(iterationsStr, 10);
    if (Number.isNaN(iterations) || iterations <= 0) {
        return false;
    }

    const verifyHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    
    // Constant time comparison for the hash verification
    const verifyBuffer = Buffer.from(verifyHash, 'hex');
    const storedBuffer = Buffer.from(hash, 'hex');
    
    if (verifyBuffer.length !== storedBuffer.length) {
        return false;
    }
    
    return crypto.timingSafeEqual(verifyBuffer, storedBuffer);
}

/**
 * Manually encodes and signs a JWT token using HS256 algorithm.
 */
export function generateToken(payload: Record<string, unknown>, secret: string, expiresInSeconds = 86400): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');

    const payloadWithExp = {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payloadWithExp)).toString('base64url');

    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Manually decodes, validates signature, and verifies expiry of an HS256 JWT token.
 * Returns the payload if valid, otherwise null.
 */
export function verifyToken<T = Record<string, unknown>>(token: string, secret: string): T | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
        return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) {
        return null;
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    // Time-safe equality check to protect against timing attacks
    let signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    const EXPECTED_LENGTH = expectedSignatureBuffer.length;
    let isLengthMatch = true;

    if (signatureBuffer.length !== EXPECTED_LENGTH) {
        isLengthMatch = false;
        signatureBuffer = Buffer.alloc(EXPECTED_LENGTH, 0);
    }

    const isHashMatch = crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);

    if (!isLengthMatch || !isHashMatch) {
        return null;
    }

    try {
        const payload = JSON.parse(
            Buffer.from(encodedPayload, 'base64url').toString('utf8'),
        ) as Record<string, unknown> & { exp?: number };

        // Check expiration
        if (payload.exp !== undefined && Date.now() / 1000 > payload.exp) {
            return null;
        }

        return payload as unknown as T;
    } catch {
        return null;
    }
}
