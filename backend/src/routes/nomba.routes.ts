import { Router } from 'express';

import {
    createVirtualAccount,
    getVirtualAccount,
} from '../controllers/NombaAccountController.js';
import {
    getNombaBalance,
    initiateNombaBankTransfer,
    initiateNombaWalletTransfer,
    listNombaBanks,
    lookupNombaBankAccount,
} from '../controllers/NombaMoneyController.js';
import {
    validateBankAccountLookup,
    validateBankTransfer,
    validateCreateVirtualAccount,
    validateGetBalance,
    validateGetVirtualAccount,
    validateWalletTransfer,
} from '../validators/nomba.validators.js';

export const nombaRoutes = Router();

nombaRoutes.post('/virtual-accounts', validateCreateVirtualAccount, createVirtualAccount);
nombaRoutes.get('/virtual-accounts/:userId', validateGetVirtualAccount, getVirtualAccount);
nombaRoutes.get('/balance', validateGetBalance, getNombaBalance);
nombaRoutes.get('/banks', listNombaBanks);
nombaRoutes.post('/bank-lookup', validateBankAccountLookup, lookupNombaBankAccount);
nombaRoutes.post('/transfers/bank', validateBankTransfer, initiateNombaBankTransfer);
nombaRoutes.post('/transfers/wallet', validateWalletTransfer, initiateNombaWalletTransfer);
