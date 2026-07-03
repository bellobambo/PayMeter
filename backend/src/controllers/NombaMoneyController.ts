import type { NextFunction, Request, Response } from 'express';

import { NombaMoneyService } from '../services/NombaMoneyService.js';
import { successResponse } from '../utils/apiResponse.js';

const nombaMoneyService = new NombaMoneyService();

export async function getNombaBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const balance = await nombaMoneyService.getBalance(req.query.subAccountId as string | undefined);

    return successResponse(res, {
      message: 'Nomba account balance fetched successfully.',
      data: balance,
    });
  } catch (error) {
    next(error);
  }
}

export async function listNombaBanks(_req: Request, res: Response, next: NextFunction) {
  try {
    const banks = await nombaMoneyService.listBanks();

    return successResponse(res, {
      message: 'Nomba banks fetched successfully.',
      data: banks,
    });
  } catch (error) {
    next(error);
  }
}

export async function lookupNombaBankAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await nombaMoneyService.lookupBankAccount({
      accountNumber: req.body.accountNumber,
      bankCode: req.body.bankCode,
    });

    return successResponse(res, {
      message: 'Recipient bank account verified successfully.',
      data: account,
    });
  } catch (error) {
    next(error);
  }
}

export async function initiateNombaBankTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const transfer = await nombaMoneyService.initiateBankTransfer({
      amount: req.body.amount,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
      bankCode: req.body.bankCode,
      merchantTxRef: req.body.merchantTxRef,
      senderName: req.body.senderName,
      narration: req.body.narration,
      subAccountId: req.body.subAccountId,
    });

    return successResponse(res, {
      statusCode: transfer.status === 'PENDING_BILLING' ? 202 : 201,
      message: 'Nomba bank transfer initiated successfully.',
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
}

export async function initiateNombaWalletTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const transfer = await nombaMoneyService.initiateWalletTransfer({
      amount: req.body.amount,
      receiverAccountId: req.body.receiverAccountId,
      merchantTxRef: req.body.merchantTxRef,
      senderName: req.body.senderName,
      narration: req.body.narration,
      subAccountId: req.body.subAccountId,
    });

    return successResponse(res, {
      statusCode: transfer.status === 'PENDING_BILLING' ? 202 : 201,
      message: 'Nomba wallet transfer initiated successfully.',
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
}
