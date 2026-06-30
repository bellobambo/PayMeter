import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { nombaRoutes } from './routes/nomba.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { errorResponse, successResponse } from './utils/apiResponse.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  return successResponse(res, {
    message: 'Welcome to the PayMeter backend.',
    data: {
      service: 'paymeter-backend',
      healthCheck: '/health',
      virtualAccounts: '/api/nomba/virtual-accounts',
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

app.use((_req, res) => {
  return errorResponse(res, {
    statusCode: 404,
    message: 'Route not found.',
  });
});

app.use(errorHandler);
