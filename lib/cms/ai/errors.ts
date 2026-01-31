/**
 * AI Chat Error Handling
 */

export type ChatErrorCode =
  | 'bad_request:api'
  | 'bad_request:missing_api_key'
  | 'bad_request:ai_disabled'
  | 'unauthorized:chat'
  | 'forbidden:chat'
  | 'rate_limit:chat'
  | 'offline:chat'
  | 'not_found:chat'
  | 'internal:chat'
  | 'internal:database';

const ERROR_MESSAGES: Record<ChatErrorCode, { message: string; status: number }> = {
  'bad_request:api': { message: 'Invalid request format', status: 400 },
  'bad_request:missing_api_key': { message: 'AI API key not configured', status: 400 },
  'bad_request:ai_disabled': { message: 'AI chat is not enabled', status: 400 },
  'unauthorized:chat': { message: 'Authentication required', status: 401 },
  'forbidden:chat': { message: 'You do not have access to this chat', status: 403 },
  'rate_limit:chat': { message: 'Daily message limit reached. Please try again tomorrow.', status: 429 },
  'offline:chat': { message: 'Chat service is temporarily unavailable', status: 503 },
  'not_found:chat': { message: 'Chat not found', status: 404 },
  'internal:chat': { message: 'An error occurred while processing your message', status: 500 },
  'internal:database': { message: 'Database error occurred', status: 500 },
};

export class ChatSDKError extends Error {
  public code: ChatErrorCode;
  public statusCode: number;

  constructor(code: ChatErrorCode, customMessage?: string) {
    const errorInfo = ERROR_MESSAGES[code];
    super(customMessage || errorInfo.message);
    this.name = 'ChatSDKError';
    this.code = code;
    this.statusCode = errorInfo.status;
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: this.code,
        message: this.message,
      }),
      {
        status: this.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Static factory methods for common errors
  static badRequest(message?: string) {
    return new ChatSDKError('bad_request:api', message);
  }

  static missingApiKey(message?: string) {
    return new ChatSDKError('bad_request:missing_api_key', message);
  }

  static aiDisabled(message?: string) {
    return new ChatSDKError('bad_request:ai_disabled', message);
  }

  static unauthorized(message?: string) {
    return new ChatSDKError('unauthorized:chat', message);
  }

  static forbidden(message?: string) {
    return new ChatSDKError('forbidden:chat', message);
  }

  static rateLimit(message?: string) {
    return new ChatSDKError('rate_limit:chat', message);
  }

  static notFound(message?: string) {
    return new ChatSDKError('not_found:chat', message);
  }

  static internal(message?: string) {
    return new ChatSDKError('internal:chat', message);
  }

  static database(message?: string) {
    return new ChatSDKError('internal:database', message);
  }
}
