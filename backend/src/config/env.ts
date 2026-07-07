import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NOMBA_BASE_URL',
    'NOMBA_CLIENT_ID',
    'NOMBA_CLIENT_SECRET',
    'NOMBA_PARENT_ACCOUNT_ID',
    'NOMBA_SUB_ACCOUNT_ID',
    'JWT_SECRET',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

function getRequiredEnv(key: string): string {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
}

function normalizeSupabaseUrl(url: string): string {
    return url
        .trim()
        .replace(/\/rest\/v1\/?$/i, '')
        .replace(/\/+$/, '');
}

function normalizeNombaBaseUrl(url: string): string {
    return url
        .trim()
        .replace(/\/v1\/?$/i, '')
        .replace(/\/+$/, '');
}

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 5000),
    jwtSecret: getRequiredEnv('JWT_SECRET'),
    supabase: {
        url: normalizeSupabaseUrl(getRequiredEnv('SUPABASE_URL')),
        serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    },
    nomba: {
        baseUrl: normalizeNombaBaseUrl(getRequiredEnv('NOMBA_BASE_URL')),
        clientId: getRequiredEnv('NOMBA_CLIENT_ID'),
        clientSecret: getRequiredEnv('NOMBA_CLIENT_SECRET'),
        parentAccountId: getRequiredEnv('NOMBA_PARENT_ACCOUNT_ID'),
        subAccountId: getRequiredEnv('NOMBA_SUB_ACCOUNT_ID'),
        webhookSecret: process.env.NOMBA_WEBHOOK_SECRET,
    },
};
