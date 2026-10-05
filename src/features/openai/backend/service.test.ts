import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod/v4';
import {
  callClaudeWithRetry,
  classifyError,
  interpretResponse,
  type ClaudeDeps,
  type StructuredRequest,
} from './service';

type ApiErrorConstructor = new (
  status: number,
  error: object,
  message: string,
  headers: Headers,
  type?: never
) => InstanceType<typeof Anthropic.APIError>;

const apiError = (ErrorClass: unknown, status: number, type: string, message = 'error') =>
  new (ErrorClass as ApiErrorConstructor)(
    status,
    { type: 'error', error: { type, message } },
    message,
    new Headers(),
    type as never
  );

const request: StructuredRequest<{ value: string }> = {
  system: 'system',
  user: 'user',
  schema: z.object({ value: z.string() }),
};

const okResponse = { stop_reason: 'end_turn', parsed_output: { value: 'ok' } };

const makeDeps = (outcomes: Array<unknown>) => {
  let clock = 0;
  const parse = vi.fn(async () => {
    const next = outcomes.shift();
    if (next instanceof Error) {
      throw next;
    }
    return next;
  });

  const deps: ClaudeDeps = {
    parse: parse as unknown as ClaudeDeps['parse'],
    sleep: vi.fn(async (ms: number) => {
      clock += ms;
    }),
    now: () => clock,
  };

  return { deps, parse, advance: (ms: number) => (clock += ms) };
};

describe('classifyError', () => {
  it('treats a 402 billing_error as non-retryable quota exhaustion', () => {
    const result = classifyError(apiError(Anthropic.APIError, 402, 'billing_error'));
    expect(result).toMatchObject({ kind: 'fatal', result: { status: 503, error: { code: 'QUOTA_EXCEEDED' } } });
  });

  it('treats a 400 low-credit-balance error as quota exhaustion', () => {
    const err = apiError(
      Anthropic.BadRequestError,
      400,
      'invalid_request_error',
      'Your credit balance is too low to access the Anthropic API.'
    );
    expect(classifyError(err)).toMatchObject({ kind: 'fatal', result: { error: { code: 'QUOTA_EXCEEDED' } } });
  });

  it('retries 429 rate limits', () => {
    const err = apiError(Anthropic.RateLimitError, 429, 'rate_limit_error');
    expect(classifyError(err)).toEqual({ kind: 'retryable', code: 'RATE_LIMIT' });
  });

  it('retries 529 overloaded errors', () => {
    const err = apiError(Anthropic.InternalServerError, 529, 'overloaded_error');
    expect(classifyError(err)).toEqual({ kind: 'retryable', code: 'API_ERROR' });
  });

  it('retries connection timeouts', () => {
    expect(classifyError(new Anthropic.APIConnectionTimeoutError())).toEqual({
      kind: 'retryable',
      code: 'TIMEOUT',
    });
  });

  it('does not retry an invalid API key', () => {
    const err = apiError(Anthropic.AuthenticationError, 401, 'authentication_error');
    expect(classifyError(err)).toMatchObject({ kind: 'fatal', result: { status: 502, error: { code: 'API_ERROR' } } });
  });

  it('maps non-HTTP errors to a parse error', () => {
    expect(classifyError(new SyntaxError('Unexpected end of JSON'))).toMatchObject({
      kind: 'fatal',
      result: { error: { code: 'PARSE_ERROR' } },
    });
  });
});

describe('interpretResponse', () => {
  it('returns parsed output on success', () => {
    expect(interpretResponse(okResponse)).toEqual({ ok: true, status: 200, data: { value: 'ok' } });
  });

  it('maps a refusal to CONTENT_REFUSED', () => {
    expect(interpretResponse({ stop_reason: 'refusal', parsed_output: null })).toMatchObject({
      ok: false,
      status: 422,
      error: { code: 'CONTENT_REFUSED' },
    });
  });

  it('maps a truncated response to PARSE_ERROR', () => {
    expect(interpretResponse({ stop_reason: 'max_tokens', parsed_output: null })).toMatchObject({
      ok: false,
      error: { code: 'PARSE_ERROR' },
    });
  });
});

describe('callClaudeWithRetry', () => {
  it('returns the first successful response', async () => {
    const { deps, parse } = makeDeps([okResponse]);
    await expect(callClaudeWithRetry(request, deps)).resolves.toMatchObject({ ok: true });
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('retries a rate limit and then succeeds', async () => {
    const { deps, parse } = makeDeps([
      apiError(Anthropic.RateLimitError, 429, 'rate_limit_error'),
      okResponse,
    ]);
    await expect(callClaudeWithRetry(request, deps)).resolves.toMatchObject({ ok: true });
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it('stops immediately on billing errors', async () => {
    const { deps, parse } = makeDeps([apiError(Anthropic.APIError, 402, 'billing_error')]);
    await expect(callClaudeWithRetry(request, deps)).resolves.toMatchObject({
      ok: false,
      error: { code: 'QUOTA_EXCEEDED' },
    });
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('returns 429 after exhausting retries on rate limits', async () => {
    const rateLimited = () => apiError(Anthropic.RateLimitError, 429, 'rate_limit_error');
    const { deps, parse } = makeDeps([rateLimited(), rateLimited(), rateLimited()]);
    await expect(callClaudeWithRetry(request, deps)).resolves.toMatchObject({
      ok: false,
      status: 429,
      error: { code: 'RATE_LIMIT' },
    });
    expect(parse).toHaveBeenCalledTimes(3);
  });

  it('skips a retry when the time budget is nearly spent', async () => {
    const { deps, parse, advance } = makeDeps([]);
    parse.mockImplementationOnce(async () => {
      advance(52_000);
      throw new Anthropic.APIConnectionTimeoutError();
    });
    await expect(callClaudeWithRetry(request, deps)).resolves.toMatchObject({
      ok: false,
      status: 504,
      error: { code: 'TIMEOUT' },
    });
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('passes the remaining budget as the per-attempt timeout', async () => {
    const { deps, parse } = makeDeps([okResponse]);
    await callClaudeWithRetry(request, deps);
    expect(parse).toHaveBeenCalledWith(request, 55_000);
  });
});
