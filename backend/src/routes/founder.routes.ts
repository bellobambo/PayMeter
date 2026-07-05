import { Router } from 'express';

import {
    getAnalytics,
    login,
    register,
} from '../controllers/FounderController.js';
import { requireFounderAuth } from '../middlewares/auth.js';
import {
    validateFounderLogin,
    validateFounderRegister,
} from '../validators/founder.validators.js';

export const founderRoutes = Router();

founderRoutes.post('/register', validateFounderRegister, register);
founderRoutes.post('/login', validateFounderLogin, login);
founderRoutes.get('/analytics', requireFounderAuth, getAnalytics);
