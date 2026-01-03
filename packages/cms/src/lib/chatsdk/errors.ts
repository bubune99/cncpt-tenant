/**
 * Error Types for ChatSDK
 *
 * Custom error classes for chat operations.
 * Adapted from ChatSDK for Prisma/Stack Auth.
 */

/**
 * Error codes for ChatSDK errors
 */
export type ErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'rate_limit'
  | 'validation_error'
  | 'internal_error'
  | 'offline:chat'
  | 'unknown';

export class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

/**
 * ChatSDK-compatible error class
 * Used by the ChatSDK utilities
 */
export class ChatSDKError extends Error {
  constructor(
    public code: ErrorCode,
    public cause?: string
  ) {
    super(cause || code);
    this.name = 'ChatSDKError';
  }
}

export class UnauthorizedError extends ChatError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends ChatError {
  constructor(message = 'Not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ChatError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends ChatError {
  constructor(message = 'Validation error') {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Type guard to check if an error is a ChatError
 */
export function isChatError(error: unknown): error is ChatError {
  return error instanceof ChatError;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: string;
  code: string;
  statusCode: number;
} {
  if (isChatError(error)) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }

  return {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}
