import type { NextFunction, Request, Response } from 'express';

import { supabase } from '../config/supabase.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { retry } from '../utils/retry.js';

export async function meterCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, featureName, founderId } = req.body;

    // Call the check_and_deduct_meter stored procedure with retry for network resilience
    const { data, error } = await retry(
      async () => {
        const res = await supabase.rpc('check_and_deduct_meter', {
          p_internal_user_id: userId,
          p_feature_name: featureName,
          p_founder_id: founderId || null,
        });
        return res;
      },
      { retries: 3, delayMs: 200 },
    );

    if (error) {
      throw new AppError(
        `Database error performing meter check: ${error.message}`,
        500,
      );
    }

    const result = data as {
      allowed: boolean;
      reason?: string;
      deductedAmount?: number;
      remainingBalance?: number;
      currentBalance?: number;
      featurePrice?: number;
    };

    if (!result.allowed) {
      throw new AppError(result.reason ?? 'Usage denied due to insufficient balance or inactive status.', 402, {
        userId,
        featureName,
        reason: result.reason,
        currentBalance: result.currentBalance !== undefined ? Number(result.currentBalance) : undefined,
        featurePrice: result.featurePrice !== undefined ? Number(result.featurePrice) : undefined,
      });
    }

    return successResponse(res, {
      message: 'Meter check allowed and balance deducted.',
      data: {
        allowed: true,
        deductedAmount: Number(result.deductedAmount),
        remainingBalance: Number(result.remainingBalance),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserBalanceAndHistory(req: Request<{ userId: string }>, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    // 1. Fetch user's basic record and virtual account details
    const { data: virtualAccount, error: vaError } = await supabase
      .from('virtual_accounts')
      .select('bank_name, bank_account_number, account_name, users!inner(name, email)')
      .eq('internal_user_id', userId)
      .maybeSingle();

    if (vaError) {
      throw new AppError(`Database error fetching user account: ${vaError.message}`, 500);
    }

    // 2. Fetch user's current balance
    const { data: balanceRow, error: balanceError } = await supabase
      .from('balances')
      .select('amount')
      .eq('internal_user_id', userId)
      .maybeSingle();

    if (balanceError) {
      throw new AppError(`Database error fetching user balance: ${balanceError.message}`, 500);
    }

    // 3. Fetch user's usage logs (joined with features to get feature name)
    const { data: usageLogs, error: usageError } = await supabase
      .from('usage_logs')
      .select('id, amount, created_at, features(name)')
      .eq('internal_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (usageError) {
      throw new AppError(`Database error fetching usage logs: ${usageError.message}`, 500);
    }

    // 4. Fetch user's funding history
    const { data: fundingHistory, error: fundingError } = await supabase
      .from('funding_history')
      .select('id, amount, created_at')
      .eq('internal_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (fundingError) {
      throw new AppError(`Database error fetching funding history: ${fundingError.message}`, 500);
    }

    // Format response data
    const currentBalance = balanceRow ? Number(balanceRow.amount) : 0;
    const accountInfo = virtualAccount
      ? {
          bankName: virtualAccount.bank_name,
          accountNumber: virtualAccount.bank_account_number,
          accountName: virtualAccount.account_name,
          name: (virtualAccount.users as any)?.name ?? '',
          email: (virtualAccount.users as any)?.email ?? '',
        }
      : null;

    const formattedUsage = usageLogs.map((log: any) => ({
      id: log.id,
      amount: Number(log.amount),
      createdAt: log.created_at,
      featureName: log.features?.name ?? 'Unknown Feature',
    }));

    const formattedFunding = fundingHistory.map((fund: any) => ({
      id: fund.id,
      amount: Number(fund.amount),
      createdAt: fund.created_at,
    }));

    return successResponse(res, {
      message: 'User balance and history fetched successfully.',
      data: {
        userId,
        balance: currentBalance,
        accountInfo,
        usageHistory: formattedUsage,
        fundingHistory: formattedFunding,
      },
    });
  } catch (error) {
    next(error);
  }
}
