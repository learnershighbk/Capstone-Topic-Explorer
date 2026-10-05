export const OPENAI_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  /** Transient throttling. Retrying later can succeed. */
  RATE_LIMIT: 'RATE_LIMIT',
  /** Billing/credit exhausted. Retrying can never succeed. */
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  /** The model declined the request under its safety policy. */
  CONTENT_REFUSED: 'CONTENT_REFUSED',
  PARSE_ERROR: 'PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export type OpenAIErrorCode = (typeof OPENAI_ERROR_CODES)[keyof typeof OPENAI_ERROR_CODES];
