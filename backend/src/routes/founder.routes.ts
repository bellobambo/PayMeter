import { Router } from 'express';

import {
    getAnalytics,
    login,
    register,
} from '../controllers/FounderController.js';
import {
    getSettlementAccount,
    getSettlementSummary,
    listPayouts,
    listSettlementBanks,
    requestPayout,
    verifySettlementAccount,
} from '../controllers/FounderSettlementController.js';
import { requireFounderAuth } from '../middlewares/auth.js';
import {
    validateFounderLogin,
    validateFounderRegister,
} from '../validators/founder.validators.js';
import {
    validatePayoutRequest,
    validateSettlementAccount,
} from '../validators/settlement.validators.js';

export const founderRoutes = Router();

founderRoutes.post('/register', validateFounderRegister, register);
founderRoutes.post('/login', validateFounderLogin, login);
founderRoutes.get('/analytics', requireFounderAuth, getAnalytics);
founderRoutes.get('/settlement/summary', requireFounderAuth, getSettlementSummary);
founderRoutes.get('/settlement/banks', requireFounderAuth, listSettlementBanks);
founderRoutes.get('/settlement/account', requireFounderAuth, getSettlementAccount);
founderRoutes.post('/settlement/account/verify', requireFounderAuth, validateSettlementAccount, verifySettlementAccount);
founderRoutes.get('/settlement/payouts', requireFounderAuth, listPayouts);
founderRoutes.post('/settlement/payouts', requireFounderAuth, validatePayoutRequest, requestPayout);
