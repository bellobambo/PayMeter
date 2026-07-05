import { Router } from 'express';

import {
  getUserBalanceAndHistory,
  meterCheck,
} from '../controllers/MeterController.js';
import {
  validateMeterCheck,
  validateUserBalanceQuery,
} from '../validators/meter.validators.js';

export const meterRoutes = Router();

meterRoutes.post('/meter', validateMeterCheck, meterCheck);
meterRoutes.get('/users/:userId/balance', validateUserBalanceQuery, getUserBalanceAndHistory);
