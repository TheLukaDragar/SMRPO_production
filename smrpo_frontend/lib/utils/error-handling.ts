export class AppError extends Error {
  public statusCode: number;
  public type: string;
  public validationErrors?: Array<{ field: string | number; message: string }>;

  constructor(
    message: string, 
    statusCode: number = 400, 
    type: string = 'ValidationError',
    validationErrors?: Array<{ field: string | number; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.validationErrors = validationErrors;
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function handleError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('Validation error:')) {
      return new AppError(error.message, 400, 'ValidationError');
    }
    if (error.message.includes('not found')) {
      return new AppError(error.message, 404, 'NotFoundError');
    }
    return new AppError(error.message, 500, 'ServerError');
  }

  return new AppError('An unexpected error occurred', 500, 'UnknownError');
}

export type ErrorResponse = {
  error: {
    message: string;
    type: string;
    statusCode: number;
    validationErrors?: Array<{ field: string | number; message: string }>;
  };
};

export function createErrorResponse(error: unknown): ErrorResponse {
  const appError = handleError(error);
  return {
    error: {
      message: appError.message,
      type: appError.type,
      statusCode: appError.statusCode,
      validationErrors: appError.validationErrors,
    },
  };
} 