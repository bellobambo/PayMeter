import { Router } from 'express';

import { receiveNombaWebhook } from '../controllers/NombaWebhookController.js';

export const nombaWebhookRoutes = Router();

nombaWebhookRoutes.post('/', receiveNombaWebhook);
