import type { Response } from 'express';

import type { ErrorDetails } from './AppError.js';

type SuccessResponseOptions<TData, TMeta> = {
  statusCode?: number;
  message: string;
  data?: TData;
  meta?: TMeta;
};

type ErrorResponseOptions = {
  statusCode?: number;
  message: string;
  errors?: ErrorDetails | null;
};

export function successResponse<TData = null, TMeta = null>(
    res: Response,
    { statusCode = 200, message, data = null as TData, meta = null as TMeta }: SuccessResponseOptions<TData, TMeta>,
) {
    const body: {
    success: true;
    message: string;
    data: TData;
    meta?: TMeta;
  } = {
      success: true,
      message,
      data,
  };

    if (meta) {
        body.meta = meta;
    }

    return res.status(statusCode).json(body);
}

export function errorResponse(
    res: Response,
    { statusCode = 500, message, errors = null }: ErrorResponseOptions,
) {
    const body: {
    success: false;
    message: string;
    errors?: ErrorDetails;
  } = {
      success: false,
      message,
  };

    if (errors) {
        body.errors = errors;
    }

    return res.status(statusCode).json(body);
}
