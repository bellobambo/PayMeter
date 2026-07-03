import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { nombaRoutes } from './routes/nomba.routes.js';
import { nombaWebhookRoutes } from './routes/nombaWebhook.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { errorResponse, successResponse } from './utils/apiResponse.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

app.use(
  '/webhooks/nomba',
  express.raw({ type: 'application/json', limit: '1mb' }),
  nombaWebhookRoutes,
);

app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  return successResponse(res, {
    message: 'Welcome to the PayMeter backend.',
    data: {
      service: 'paymeter-backend',
      healthCheck: '/health',
      virtualAccounts: '/api/nomba/virtual-accounts',
      nombaBalance: '/api/nomba/balance',
      nombaBanks: '/api/nomba/banks',
      nombaBankLookup: '/api/nomba/bank-lookup',
      nombaBankTransfer: '/api/nomba/transfers/bank',
      nombaWalletTransfer: '/api/nomba/transfers/wallet',
      nombaWebhook: '/webhooks/nomba',
    },
  });
});

app.get('/health', (_req, res) => {
  return successResponse(res, {
    message: 'PayMeter backend is running.',
    data: {
      status: 'ok',
      service: 'paymeter-backend',
    },
  });
});

app.use('/api/nomba', nombaRoutes);

const routeMethods: Record<string, string[]> = {
  '/': ['GET'],
  '/health': ['GET'],
  '/api/nomba/virtual-accounts': ['POST'],
  '/api/nomba/balance': ['GET'],
  '/api/nomba/banks': ['GET'],
  '/api/nomba/bank-lookup': ['POST'],
  '/api/nomba/transfers/bank': ['POST'],
  '/api/nomba/transfers/wallet': ['POST'],
  '/webhooks/nomba': ['POST'],
};

app.use((req, res, next) => {
  const allowedMethods = routeMethods[req.path]
    ?? (
      req.path.startsWith('/api/nomba/virtual-accounts/')
        ? ['GET']
        : null
    );

  if (!allowedMethods || allowedMethods.includes(req.method)) {
    next();
    return;
  }

  res.setHeader('Allow', allowedMethods.join(', '));

  return errorResponse(res, {
    statusCode: 405,
    message: `Method ${req.method} is not allowed for ${req.path}.`,
    errors: {
      allowedMethods,
    },
  });
});

app.use((_req, res) => {
  return errorResponse(res, {
    statusCode: 404,
    message: 'Route not found.',
  });
});

app.use(errorHandler);
