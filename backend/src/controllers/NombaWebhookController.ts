import type { NextFunction, Request, Response } from 'express';

import { NombaWebhookService } from '../services/NombaWebhookService.js';
import { successResponse } from '../utils/apiResponse.js';

const nombaWebhookService = new NombaWebhookService();

export async function receiveNombaWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await nombaWebhookService.receive({
      rawBody: req.body,
      headers: req.headers,
    });

    return successResponse(res, {
      message: result.wasDuplicate
        ? 'Nomba webhook already received.'
        : 'Nomba webhook received.',
      data: {
        eventId: result.eventId,
        status: result.status,
        wasDuplicate: result.wasDuplicate,
      },
    });
  } catch (error) {
    next(error);
  }
}
