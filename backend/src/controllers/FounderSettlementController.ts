import type { NextFunction, Response } from 'express';

import type { AuthenticatedRequest } from '../middlewares/auth.js';
import { FounderSettlementService } from '../services/FounderSettlementService.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

const founderSettlementService = new FounderSettlementService();

function getFounder(req: AuthenticatedRequest) {
    if (!req.founder) {
        throw new AppError('Unauthorized.', 401);
    }

    return req.founder;
}

export async function getSettlementSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founder = getFounder(req);
        const [summary, settlementAccount, payouts] = await Promise.all([
            founderSettlementService.getSummary(founder.id),
            founderSettlementService.getSettlementAccount(founder.id),
            founderSettlementService.listPayouts(founder.id),
        ]);

        return successResponse(res, {
            message: 'Settlement summary retrieved successfully.',
            data: {
                summary,
                settlementAccount,
                recentPayouts: payouts,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function listSettlementBanks(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const banks = await founderSettlementService.listBanks();

        return successResponse(res, {
            message: 'Settlement banks retrieved successfully.',
            data: banks,
        });
    } catch (error) {
        next(error);
    }
}

export async function getSettlementAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founder = getFounder(req);
        const account = await founderSettlementService.getSettlementAccount(founder.id);

        return successResponse(res, {
            message: 'Settlement account retrieved successfully.',
            data: account,
        });
    } catch (error) {
        next(error);
    }
}

export async function verifySettlementAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founder = getFounder(req);
        const account = await founderSettlementService.verifySettlementAccount({
            founderId: founder.id,
            accountNumber: req.body.accountNumber,
            bankCode: req.body.bankCode,
            bankName: req.body.bankName,
        });

        return successResponse(res, {
            message: 'Settlement account verified and saved successfully.',
            data: account,
        });
    } catch (error) {
        next(error);
    }
}

export async function listPayouts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founder = getFounder(req);
        const payouts = await founderSettlementService.listPayouts(founder.id);

        return successResponse(res, {
            message: 'Payout history retrieved successfully.',
            data: payouts,
        });
    } catch (error) {
        next(error);
    }
}

export async function requestPayout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const founder = getFounder(req);
        const payout = await founderSettlementService.requestPayout({
            founder: {
                id: founder.id,
                name: founder.name || 'Founder',
            },
            amount: req.body.amount,
        });

        return successResponse(res, {
            statusCode: payout.payout.status === 'paid' ? 201 : 202,
            message: 'Founder payout request submitted successfully.',
            data: payout,
        });
    } catch (error) {
        next(error);
    }
}
