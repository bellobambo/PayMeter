import { Router } from 'express';

import {
    getAnalytics,
    login,
    register,
} from '../controllers/FounderController.js';
import {
    createApiKey,
    deleteApiKey,
    listApiKeys,
} from '../controllers/ApiKeyController.js';
import {
    getSettlementAccount,
    getSettlementSummary,
    listPayouts,
    listSettlementBanks,
    requestPayout,
    verifySettlementAccount,
} from '../controllers/FounderSettlementController.js';
import { requireFounderAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import {
    validateFounderLogin,
    validateFounderRegister,
} from '../validators/founder.validators.js';
import {
    validateCreateApiKey,
    validateDeleteApiKey,
} from '../validators/apiKey.validators.js';
import {
    validatePayoutRequest,
    validateSettlementAccount,
} from '../validators/settlement.validators.js';

export const founderRoutes = Router();

founderRoutes.post('/register', authLimiter, validateFounderRegister, register);
founderRoutes.post('/login', authLimiter, validateFounderLogin, login);
founderRoutes.get('/analytics', requireFounderAuth, getAnalytics);

// API key management routes
founderRoutes.post('/api-keys', requireFounderAuth, validateCreateApiKey, createApiKey);
founderRoutes.get('/api-keys', requireFounderAuth, listApiKeys);
founderRoutes.delete('/api-keys/:id', requireFounderAuth, validateDeleteApiKey, deleteApiKey);

founderRoutes.get('/settlement/summary', requireFounderAuth, getSettlementSummary);
founderRoutes.get('/settlement/banks', requireFounderAuth, listSettlementBanks);
founderRoutes.get('/settlement/account', requireFounderAuth, getSettlementAccount);
founderRoutes.post('/settlement/account/verify', requireFounderAuth, validateSettlementAccount, verifySettlementAccount);
founderRoutes.get('/settlement/payouts', requireFounderAuth, listPayouts);
founderRoutes.post('/settlement/payouts', requireFounderAuth, validatePayoutRequest, requestPayout);
