import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

type SettlementAccountBody = {
  bankCode?: unknown;
  bankName?: unknown;
  accountNumber?: unknown;
};

type PayoutBody = {
  amount?: unknown;
};

export function validateSettlementAccount(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const body = (req.body ?? {}) as SettlementAccountBody;
    const { bankCode, bankName, accountNumber } = body;

    if (typeof bankCode !== 'string' || bankCode.trim().length === 0) {
        errors.bankCode = 'bankCode is required.';
    } else if (!/^\d{3,12}$/.test(bankCode.trim())) {
        errors.bankCode = 'bankCode must contain 3 to 12 digits.';
    }

    if (typeof bankName !== 'string' || bankName.trim().length === 0) {
        errors.bankName = 'bankName is required.';
    } else if (bankName.trim().length > 120) {
        errors.bankName = 'bankName must not exceed 120 characters.';
    }

    if (typeof accountNumber !== 'string' || accountNumber.trim().length === 0) {
        errors.accountNumber = 'accountNumber is required.';
    } else if (!/^\d{6,20}$/.test(accountNumber.trim())) {
        errors.accountNumber = 'accountNumber must contain 6 to 20 digits.';
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.bankCode = (bankCode as string).trim();
    req.body.bankName = (bankName as string).trim();
    req.body.accountNumber = (accountNumber as string).trim();

    next();
}

export function validatePayoutRequest(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const body = (req.body ?? {}) as PayoutBody;
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        errors.amount = 'amount is required and must be greater than zero.';
    }

    if (amount > 10_000_000) {
        errors.amount = 'amount exceeds the maximum single payout limit.';
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.amount = amount;

    next();
}
