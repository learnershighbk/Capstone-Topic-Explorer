/**
 * Per-student paid API calls allowed per KST calendar day. Admin accounts are exempt.
 * Keys double as the `endpoint` values stored in `ai_usage_daily`.
 * `search` covers both Serper routes; each analysis makes 2 search calls.
 */
export const DAILY_AI_CALL_LIMITS = {
  issues: 20,
  topics: 20,
  analysis: 10,
  search: 30,
} as const;

export type AiEndpoint = keyof typeof DAILY_AI_CALL_LIMITS;

/** Upper bounds on request fields so a single call cannot send an oversized prompt. */
export const AI_INPUT_MAX_LENGTH = {
  country: 100,
  interest: 300,
  issue: 500,
  topicTitle: 500,
  existingTopicsCount: 100,
} as const;
