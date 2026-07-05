import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

type CreateVirtualAccountBody = {
  userId?: unknown;
  name?: unknown;
  email?: unknown;
  companyName?: unknown;
  phoneNumber?: unknown;
};

type BankLookupBody = {
  accountNumber?: unknown;
  bankCode?: unknown;
};

type BankTransferBody = BankLookupBody & {
  amount?: unknown;
  accountName?: unknown;
  merchantTxRef?: unknown;
  senderName?: unknown;
  narration?: unknown;
  subAccountId?: unknown;
};

type WalletTransferBody = {
  amount?: unknown;
  receiverAccountId?: unknown;
  merchantTxRef?: unknown;
  senderName?: unknown;
  narration?: unknown;
  subAccountId?: unknown;
};

export function validateCreateVirtualAccount(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const body = (req.body ?? {}) as CreateVirtualAccountBody;
    const { userId, name, email, companyName, phoneNumber } = body;

    if (typeof userId !== 'string' || userId.trim().length === 0) {
        errors.userId = 'userId is required and must be a non-empty string.';
    } else if (userId.trim().length > 100) {
        errors.userId = 'userId must not exceed 100 characters.';
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
        errors.name = 'name is required and must be a non-empty string.';
    } else if (name.trim().length < 2) {
        errors.name = 'name must be at least 2 characters.';
    } else if (name.trim().length > 100) {
        errors.name = 'name must not exceed 100 characters.';
    }

    if (typeof email !== 'string' || email.trim().length === 0) {
        errors.email = 'email is required and must be a non-empty string.';
    } else if (!isValidEmail(email.trim())) {
        errors.email = 'email must be a valid email address.';
    } else if (email.trim().length > 254) {
        errors.email = 'email must not exceed 254 characters.';
    }

    if (
        companyName !== undefined
    && companyName !== null
    && typeof companyName !== 'string'
    ) {
        errors.companyName = 'companyName must be a string when provided.';
    } else if (typeof companyName === 'string' && companyName.trim().length > 100) {
        errors.companyName = 'companyName must not exceed 100 characters.';
    }

    if (
        phoneNumber !== undefined
    && phoneNumber !== null
    && typeof phoneNumber !== 'string'
    ) {
        errors.phoneNumber = 'phoneNumber must be a string when provided.';
    } else if (typeof phoneNumber === 'string' && phoneNumber.trim().length > 30) {
        errors.phoneNumber = 'phoneNumber must not exceed 30 characters.';
    } else if (
        typeof phoneNumber === 'string'
    && phoneNumber.trim().length > 0
    && !isValidPhoneNumber(phoneNumber.trim())
    ) {
        errors.phoneNumber = 'phoneNumber may only contain digits, spaces, +, -, and parentheses.';
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.userId = (userId as string).trim();
    req.body.name = (name as string).trim();
    req.body.email = (email as string).trim().toLowerCase();
    req.body.companyName = typeof companyName === 'string' && companyName.trim().length > 0
        ? companyName.trim()
        : null;
    req.body.phoneNumber = typeof phoneNumber === 'string' && phoneNumber.trim().length > 0
        ? phoneNumber.trim()
        : null;

    next();
}

export function validateGetVirtualAccount(req: Request, _res: Response, next: NextFunction) {
    const { userId } = req.params;

    if (typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, {
            userId: 'userId is required and must be a non-empty string.',
        });
    }

    if (userId.trim().length > 100) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, {
            userId: 'userId must not exceed 100 characters.',
        });
    }

    req.params.userId = userId.trim();

    next();
}

export function validateGetBalance(req: Request, _res: Response, next: NextFunction) {
    const { subAccountId } = req.query;

    if (subAccountId !== undefined && typeof subAccountId !== 'string') {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, {
            subAccountId: 'subAccountId must be a string when provided.',
        });
    }

    if (typeof subAccountId === 'string') {
        if (subAccountId.trim().length === 0 || subAccountId.trim().length > 120) {
            throw new AppError('Validation failed. Please check the submitted fields.', 422, {
                subAccountId: 'subAccountId must be a non-empty string and must not exceed 120 characters.',
            });
        }

        req.query.subAccountId = subAccountId.trim();
    }

    next();
}

export function validateBankAccountLookup(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const body = (req.body ?? {}) as BankLookupBody;
    const { accountNumber, bankCode } = body;

    validateAccountNumber(accountNumber, errors);
    validateBankCode(bankCode, errors);

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.accountNumber = (accountNumber as string).trim();
    req.body.bankCode = (bankCode as string).trim();

    next();
}

export function validateBankTransfer(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const body = (req.body ?? {}) as BankTransferBody;
    const {
        amount,
        accountNumber,
        accountName,
        bankCode,
        merchantTxRef,
        senderName,
        narration,
        subAccountId,
    } = body;

    validateAmount(amount, errors);
    validateAccountNumber(accountNumber, errors);
    validateRequiredString(accountName, 'accountName', 'accountName is required.', errors, 150);
    validateBankCode(bankCode, errors);
    validateMerchantTxRef(merchantTxRef, errors);
    validateOptionalString(senderName, 'senderName', errors, 100);
    validateOptionalString(narration, 'narration', errors, 150);
    validateOptionalString(subAccountId, 'subAccountId', errors, 120);

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.amount = Number(amount);
    req.body.accountNumber = (accountNumber as string).trim();
    req.body.accountName = (accountName as string).trim();
    req.body.bankCode = (bankCode as string).trim();
    req.body.merchantTxRef = (merchantTxRef as string).trim();
    req.body.senderName = normalizeOptionalString(senderName);
    req.body.narration = normalizeOptionalString(narration);
    req.body.subAccountId = normalizeOptionalString(subAccountId);

    next();
}

export function validateWalletTransfer(req: Request, _res: Response, next: NextFunction) {
    const errors: Record<string, string> = {};
    const body = (req.body ?? {}) as WalletTransferBody;
    const {
        amount,
        receiverAccountId,
        merchantTxRef,
        senderName,
        narration,
        subAccountId,
    } = body;

    validateAmount(amount, errors);
    validateRequiredString(
        receiverAccountId,
        'receiverAccountId',
        'receiverAccountId is required.',
        errors,
        120,
    );
    validateMerchantTxRef(merchantTxRef, errors);
    validateOptionalString(senderName, 'senderName', errors, 100);
    validateOptionalString(narration, 'narration', errors, 150);
    validateOptionalString(subAccountId, 'subAccountId', errors, 120);

    if (Object.keys(errors).length > 0) {
        throw new AppError('Validation failed. Please check the submitted fields.', 422, errors);
    }

    req.body.amount = Number(amount);
    req.body.receiverAccountId = (receiverAccountId as string).trim();
    req.body.merchantTxRef = (merchantTxRef as string).trim();
    req.body.senderName = normalizeOptionalString(senderName);
    req.body.narration = normalizeOptionalString(narration);
    req.body.subAccountId = normalizeOptionalString(subAccountId);

    next();
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhoneNumber(phoneNumber: string) {
    return /^[+\d\s().-]+$/.test(phoneNumber);
}

function validateAmount(value: unknown, errors: Record<string, string>) {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount <= 0) {
        errors.amount = 'amount is required and must be greater than zero.';
    }
}

function validateAccountNumber(value: unknown, errors: Record<string, string>) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        errors.accountNumber = 'accountNumber is required and must be a non-empty string.';
    } else if (!/^\d{6,20}$/.test(value.trim())) {
        errors.accountNumber = 'accountNumber must contain 6 to 20 digits.';
    }
}

function validateBankCode(value: unknown, errors: Record<string, string>) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        errors.bankCode = 'bankCode is required and must be a non-empty string.';
    } else if (!/^\d{3,12}$/.test(value.trim())) {
        errors.bankCode = 'bankCode must contain 3 to 12 digits.';
    }
}

function validateMerchantTxRef(value: unknown, errors: Record<string, string>) {
    validateRequiredString(
        value,
        'merchantTxRef',
        'merchantTxRef is required and must be unique per transfer.',
        errors,
        120,
    );
}

function validateRequiredString(
    value: unknown,
    field: string,
    message: string,
    errors: Record<string, string>,
    maxLength: number,
) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        errors[field] = message;
    } else if (value.trim().length > maxLength) {
        errors[field] = `${field} must not exceed ${maxLength} characters.`;
    }
}

function validateOptionalString(
    value: unknown,
    field: string,
    errors: Record<string, string>,
    maxLength: number,
) {
    if (value !== undefined && value !== null && typeof value !== 'string') {
        errors[field] = `${field} must be a string when provided.`;
    } else if (typeof value === 'string' && value.trim().length > maxLength) {
        errors[field] = `${field} must not exceed ${maxLength} characters.`;
    }
}

function normalizeOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : null;
}
