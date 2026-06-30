import type { NextFunction, Request, Response } from 'express';

import { NombaVirtualAccountService } from '../services/NombaVirtualAccountService.js';
import { successResponse } from '../utils/apiResponse.js';

const nombaVirtualAccountService = new NombaVirtualAccountService();

export async function createVirtualAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, name, email, companyName, phoneNumber } = req.body;

    const account = await nombaVirtualAccountService.createForUser({
      internalUserId: userId,
      name,
      email,
      companyName,
      phoneNumber,
    });

    return successResponse(res, {
      statusCode: account.wasExisting ? 200 : 201,
      message: account.wasExisting
        ? 'Virtual account already exists for this user.'
        : 'Virtual account created successfully.',
      data: {
        userId: account.internalUserId,
        name: account.name,
        email: account.email,
        companyName: account.companyName,
        phoneNumber: account.phoneNumber,
        accountNumber: account.bankAccountNumber,
        accountName: account.bankAccountName,
        bankName: account.bankName,
        accountRef: account.accountRef,
        currency: account.currency,
        wasExisting: account.wasExisting,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getVirtualAccount(
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const account = await nombaVirtualAccountService.getForUser(req.params.userId);

    return successResponse(res, {
      message: 'Virtual account fetched successfully.',
      data: {
        userId: account.internalUserId,
        name: account.name,
        email: account.email,
        companyName: account.companyName,
        phoneNumber: account.phoneNumber,
        accountNumber: account.bankAccountNumber,
        accountName: account.bankAccountName,
        bankName: account.bankName,
        accountRef: account.accountRef,
        currency: account.currency,
      },
    });
  } catch (error) {
    next(error);
  }
}
