import { Router } from 'express';

import {
  createVirtualAccount,
  getVirtualAccount,
} from '../controllers/NombaAccountController.js';
import {
  validateCreateVirtualAccount,
  validateGetVirtualAccount,
} from '../validators/nomba.validators.js';

export const nombaRoutes = Router();

nombaRoutes.post('/virtual-accounts', validateCreateVirtualAccount, createVirtualAccount);
nombaRoutes.get('/virtual-accounts/:userId', validateGetVirtualAccount, getVirtualAccount);
