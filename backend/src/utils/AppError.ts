export type ErrorDetails = Record<string, unknown>;

export class AppError extends Error {
    statusCode: number;

    errors: ErrorDetails | null;

    constructor(message: string, statusCode = 400, errors: ErrorDetails | null = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
    }
}
