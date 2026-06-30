import type { ErrorRequestHandler } from 'express';

import { AppError } from '../utils/AppError.js';
import { errorResponse } from '../utils/apiResponse.js';

type BodyParserSyntaxError = SyntaxError & {
  status?: number;
  body?: unknown;
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const isMalformedJson =
    error instanceof SyntaxError
    && (error as BodyParserSyntaxError).status === 400
    && 'body' in error;
  const statusCode = error instanceof AppError
    ? error.statusCode
    : isMalformedJson
      ? 400
      : 500;
  const message = error instanceof AppError
    ? error.message
    : statusCode >= 500
      ? 'Something went wrong while processing your request.'
      : isMalformedJson
        ? 'Malformed JSON request body.'
      : error instanceof Error
        ? error.message
        : 'Request failed.';

  if (statusCode >= 500) {
    console.error(error);
  }

  return errorResponse(res, {
    statusCode,
    message,
    errors: error instanceof AppError
      ? error.errors
      : isMalformedJson
        ? { body: 'Request body must be valid JSON.' }
        : null,
  });
};
