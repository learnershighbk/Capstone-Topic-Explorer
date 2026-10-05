import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type * as z from 'zod/v4';
import { success, failure, type HandlerResult, type ErrorResult } from '@/backend/http/response';
import { OPENAI_ERROR_CODES as AI_ERROR_CODES, type OpenAIErrorCode } from './error';
import {
  issuesModelOutputSchema,
  topicsResponseSchema,
  analysisResponseSchema,
  type IssuesResponse,
  type TopicsResponse,
  type AnalysisResponse,
} from './schema';
import { ISSUE_COUNT, MAX_SCORE, MIN_SCORE, scorePolicyIssues } from './issue-scoring';
import { recentSinceYear } from '@/features/search/backend/reference-selection';

const SEARCH_QUERY_COUNT = 3;
const MIN_RECENT_REFERENCES = 4;
const MAX_FOUNDATIONAL_REFERENCES = 2;

const MODEL = 'claude-sonnet-5-5';

/**
 * Content generation is a `low`-effort workload. It also keeps the analysis
 * call well inside the 60s Vercel function limit; raise it only together
 * with `maxDuration` in vercel.json.
 */
const EFFORT = 'low' as const;

const MAX_TOKENS = 8000;

const MAX_ATTEMPTS = 3;

/**
 * Wall-clock budget for all attempts, kept below vercel.json `maxDuration` (60s).
 * A single analysis call measured ~24s, so a 30s limit left no room for a retry.
 */
const REQUEST_BUDGET_MS = 55_000;

/** Skip a retry that could not finish anyway. */
const MIN_ATTEMPT_MS = 5_000;

/** Server-side fallback re-runs a declined request on another model inside the same call. */
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

const MESSAGES = {
  QUOTA_EXCEEDED: 'AI service quota has been exhausted. Please contact the administrator.',
  RATE_LIMIT: 'AI service is busy. Please wait a moment and try again.',
  TIMEOUT: 'AI response took too long. Please try again.',
  UNAVAILABLE: 'AI service is temporarily unavailable. Please try again later.',
  CONFIG: 'AI service is not configured correctly. Please contact the administrator.',
  REFUSED: 'The AI could not respond to this request. Please rephrase your input and try again.',
  PARSE: 'The AI returned an incomplete response. Please try again.',
} as const;

type AiResult<T> = HandlerResult<T, OpenAIErrorCode>;
type AiFailure = ErrorResult<OpenAIErrorCode>;
type RetryableCode =
  | typeof AI_ERROR_CODES.RATE_LIMIT
  | typeof AI_ERROR_CODES.TIMEOUT
  | typeof AI_ERROR_CODES.API_ERROR;

export type ErrorDisposition =
  | { kind: 'fatal'; result: AiFailure }
  | { kind: 'retryable'; code: RetryableCode };

export type StructuredRequest<T> = {
  system: string;
  user: string;
  schema: z.ZodType<T>;
};

export type StructuredResponse<T> = {
  stop_reason: string | null;
  parsed_output: T | null;
};

export type ClaudeDeps = {
  parse: <T>(request: StructuredRequest<T>, timeoutMs: number) => Promise<StructuredResponse<T>>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
};

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    // maxRetries: 0 — retry policy is owned solely by callClaudeWithRetry, which
    // also enforces the overall time budget the SDK retries know nothing about.
    anthropicClient = new Anthropic({ maxRetries: 0 });
  }
  return anthropicClient;
}

const defaultDeps: ClaudeDeps = {
  parse: async (request, timeoutMs) =>
    getAnthropicClient().beta.messages.parse(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: request.system,
        messages: [{ role: 'user', content: request.user }],
        output_config: { effort: EFFORT, format: betaZodOutputFormat(request.schema) },
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
      },
      { timeout: timeoutMs }
    ),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
};

/**
 * Credit exhaustion has historically arrived as a 400 `invalid_request_error`
 * whose only distinguishing signal is the message text, so it is matched by
 * message in addition to the typed 402 `billing_error`.
 */
function isBillingError(err: InstanceType<typeof Anthropic.APIError>): boolean {
  if (err.status === 402 || err.type === 'billing_error') {
    return true;
  }

  return err instanceof Anthropic.BadRequestError && /credit balance/i.test(err.message);
}

/** Decides whether a failed call is worth retrying, and what to tell the client if not. */
export function classifyError(err: unknown): ErrorDisposition {
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return { kind: 'retryable', code: AI_ERROR_CODES.TIMEOUT };
  }

  if (err instanceof Anthropic.APIConnectionError) {
    return { kind: 'retryable', code: AI_ERROR_CODES.API_ERROR };
  }

  if (!(err instanceof Anthropic.APIError)) {
    // Non-HTTP SDK errors here come from parsing the structured output.
    return {
      kind: 'fatal',
      result: failure(502, AI_ERROR_CODES.PARSE_ERROR, MESSAGES.PARSE),
    };
  }

  if (isBillingError(err)) {
    return {
      kind: 'fatal',
      result: failure(503, AI_ERROR_CODES.QUOTA_EXCEEDED, MESSAGES.QUOTA_EXCEEDED),
    };
  }

  if (err.status === 429) {
    return { kind: 'retryable', code: AI_ERROR_CODES.RATE_LIMIT };
  }

  // 500 api_error and 529 overloaded_error are transient on Anthropic's side.
  if (typeof err.status === 'number' && err.status >= 500) {
    return { kind: 'retryable', code: AI_ERROR_CODES.API_ERROR };
  }

  // 400/401/403/404/413: a bad key, unknown model, or malformed request.
  return {
    kind: 'fatal',
    result: failure(502, AI_ERROR_CODES.API_ERROR, MESSAGES.CONFIG),
  };
}

/** Turns a completed (HTTP 200) response into a handler result. */
export function interpretResponse<T>(response: StructuredResponse<T>): AiResult<T> {
  if (response.stop_reason === 'refusal') {
    return failure(422, AI_ERROR_CODES.CONTENT_REFUSED, MESSAGES.REFUSED);
  }

  if (response.stop_reason === 'max_tokens' || response.parsed_output === null) {
    return failure(502, AI_ERROR_CODES.PARSE_ERROR, MESSAGES.PARSE);
  }

  return success(response.parsed_output);
}

function exhaustedFailure(code: RetryableCode): AiFailure {
  if (code === AI_ERROR_CODES.RATE_LIMIT) {
    return failure(429, code, MESSAGES.RATE_LIMIT);
  }

  if (code === AI_ERROR_CODES.TIMEOUT) {
    return failure(504, code, MESSAGES.TIMEOUT);
  }

  return failure(503, code, MESSAGES.UNAVAILABLE);
}

const backoffMs = (attempt: number) => Math.pow(2, attempt) * 1000;

function logError(attempt: number, err: unknown) {
  if (err instanceof Anthropic.APIError) {
    console.error(
      `[Claude] Attempt ${attempt + 1} failed - Status: ${err.status}, Type: ${err.type}, Request ID: ${err.requestID}, Message: ${err.message}`
    );
    return;
  }

  console.error(`[Claude] Attempt ${attempt + 1} failed:`, err);
}

/**
 * Calls Claude with a structured-output schema, retrying transient failures
 * within REQUEST_BUDGET_MS so the route always answers before Vercel times out.
 */
export async function callClaudeWithRetry<T>(
  request: StructuredRequest<T>,
  deps: ClaudeDeps = defaultDeps
): Promise<AiResult<T>> {
  if (deps === defaultDeps && !process.env.ANTHROPIC_API_KEY) {
    console.error('[Claude] ANTHROPIC_API_KEY is not configured');
    return failure(502, AI_ERROR_CODES.API_ERROR, MESSAGES.CONFIG);
  }

  const startedAt = deps.now();
  let lastCode: RetryableCode = AI_ERROR_CODES.TIMEOUT;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remainingMs = REQUEST_BUDGET_MS - (deps.now() - startedAt);

    if (remainingMs < MIN_ATTEMPT_MS) {
      break;
    }

    try {
      const response = await deps.parse(request, remainingMs);
      return interpretResponse(response);
    } catch (err) {
      logError(attempt, err);

      const disposition = classifyError(err);

      if (disposition.kind === 'fatal') {
        return disposition.result;
      }

      lastCode = disposition.code;

      const isLastAttempt = attempt === MAX_ATTEMPTS - 1;
      if (isLastAttempt) {
        break;
      }

      await deps.sleep(backoffMs(attempt));
    }
  }

  return exhaustedFailure(lastCode);
}

export async function generatePolicyIssues(
  country: string,
  interest: string
): Promise<AiResult<IssuesResponse>> {
  const system = `You are an expert policy analyst helping graduate students choose capstone project topics. Identify key policy issues for the student's country of interest and area of interest.

For each policy issue, provide:
1. issue: a clear, concise issue title
2. description: 1-2 sentences explaining the issue and why it matters
3. importance_score: an integer from ${MIN_SCORE} to ${MAX_SCORE} using the importance rubric
4. frequency_score: an integer from ${MIN_SCORE} to ${MAX_SCORE} using the frequency rubric

Importance rubric (policy significance in this country):
- 9-10: top national priority; on the current government agenda or national development plan, affects a large share of the population, or is urgent
- 7-8: major sectoral issue with active reforms, legislation, or significant public spending
- 5-6: notable issue limited to a sector, region, or specific group
- 3-4: niche issue with limited reach or low urgency
- 1-2: marginal issue with little policy consequence

Frequency rubric (prominence in academic and policy discussion over roughly the last five years):
- 9-10: extensively studied; appears regularly in international organization reports (e.g. World Bank, OECD, UN, ADB) and in domestic policy debate
- 7-8: discussed regularly in research and policy reports
- 5-6: moderate attention; some studies and reports
- 3-4: occasional mentions; little dedicated research
- 1-2: rarely discussed

Score each issue against the rubric independently and use the full range where warranted, so the scores differentiate the issues rather than clustering. If you are unsure about evidence for this country, score conservatively.

Generate exactly ${ISSUE_COUNT} policy issues.`;

  const user = `Country: ${country}
Area of Interest: ${interest}

Generate ${ISSUE_COUNT} policy issues a graduate student could research for a capstone project. The issues should be:
1. Specific to the country mentioned
2. Related to the area of interest
3. Feasible for academic research
4. Relevant to current policy discussions`;

  const result = await callClaudeWithRetry({ system, user, schema: issuesModelOutputSchema });

  if (!result.ok) {
    return result as AiFailure;
  }

  return success(scorePolicyIssues(result.data.policy_issues));
}

export async function generateTopics(
  country: string,
  issue: string,
  existingTopics: string[] = []
): Promise<AiResult<TopicsResponse>> {
  const system = `You are an expert academic advisor helping graduate students choose capstone project topics. Generate specific, researchable topics based on a policy issue.

For each topic, provide a title and a 1-2 sentence description of the topic and its research angle.

Generate exactly 5 unique topics. Each topic should be:
1. Specific and focused enough for a capstone project
2. Researchable with available data and methods
3. Relevant to policy discussions in the specified country
4. Original and not a duplicate of existing topics`;

  const avoidList =
    existingTopics.length > 0
      ? `\n\nAvoid these topics, which have already been suggested:\n${existingTopics.map((t) => `- ${t}`).join('\n')}`
      : '';

  const user = `Country: ${country}
Policy Issue: ${issue}

Generate 5 specific capstone project topics a graduate student could research.${avoidList}`;

  return callClaudeWithRetry({ system, user, schema: topicsResponseSchema });
}

export async function generateAnalysis(
  country: string,
  issue: string,
  topicTitle: string
): Promise<AiResult<AnalysisResponse>> {
  const sinceYear = recentSinceYear(new Date().getFullYear());

  const system = `You are an expert academic advisor providing detailed analysis of a capstone project topic for a graduate student.

Provide:
- rationale: the topic's relevance to current policy discussions, its research feasibility (data availability and methodology), and its potential impact on policy and practice
- data_sources: 5-8 potential data sources, each with a short description. Prefer real, verifiable sources.
- key_references: 6-8 key references. For each, give authors (one entry per author, e.g. "Acemoglu, D."; use the organization name for institutional reports), year of publication, the exact full title, and venue (journal or publisher). At least ${MIN_RECENT_REFERENCES} must be published in ${sinceYear} or later; choose well-cited, peer-reviewed empirical studies or major international organization reports on this topic or country. Include at most ${MAX_FOUNDATIONAL_REFERENCES} older foundational works that define the theory or concept. Cite only works you are confident exist, with their exact published titles; each one is checked against the Crossref registry and web search, and unverifiable ones are flagged to the student.
- methodologies: 3-5 recommended methodologies, each with an explanation of how it applies to this research
- policy_questions: 5 key policy research questions
- search_queries: exactly ${SEARCH_QUERY_COUNT} queries for a scholarly search engine (OpenAlex) to find recent empirical studies on this topic. Each is 4-8 English words, no quotes or boolean operators, and names the country. Vary them: one on the policy instrument and its outcome, one on the wider policy issue in the country, one on the main method or data applied to this topic.`;

  const user = `Country: ${country}
Policy Issue: ${issue}
Capstone Topic: ${topicTitle}

Provide a detailed analysis of this capstone project topic.`;

  return callClaudeWithRetry({ system, user, schema: analysisResponseSchema });
}
