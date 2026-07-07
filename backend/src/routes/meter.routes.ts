import { Router } from 'express';

import {
    getUserBalanceAndHistory,
    meterCheck,
} from '../controllers/MeterController.js';
import { requireApiKey } from '../middlewares/apiKeyAuth.js';
import {
    validateMeterCheck,
    validateUserBalanceQuery,
} from '../validators/meter.validators.js';

export const meterRoutes = Router();

meterRoutes.post('/meter', requireApiKey, validateMeterCheck, meterCheck);
meterRoutes.get('/users/:userId/balance', validateUserBalanceQuery, getUserBalanceAndHistory);

