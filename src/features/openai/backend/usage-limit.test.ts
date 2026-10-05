import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '@/backend/hono/context';
import {
  SESSION_COOKIE_NAME,
  signSession,
} from '@/features/capstone-auth/backend/session';
import { OPENAI_ERROR_CODES } from './error';
import { enforceDailyLimit } from './usage-limit';

const SECRET = 'x'.repeat(32);
const STUDENT_ID = '123456789';

type RpcResult = { data: unknown; error: unknown };

const cookieFor = (role: string) => {
  const now = Date.now();
  const token = signSession(
    { studentId: STUDENT_ID, role, createdAt: now, expiresAt: now + 60_000 },
    SECRET
  );

  return `${SESSION_COOKIE_NAME}=${token}`;
};

const buildApp = (rpc: ReturnType<typeof vi.fn>, handlerStatus: 200 | 500 = 200) => {
  const app = new Hono<AppEnv>();
  const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };

  app.use('*', async (c, next) => {
    c.set('supabase', { rpc } as unknown as SupabaseClient);
    c.set('logger', logger);
    await next();
  });
  app.post('/api/openai/issues', enforceDailyLimit('issues'), (c) =>
    c.json({ ok: handlerStatus === 200 }, handlerStatus)
  );

  return app;
};

const callIssues = (app: Hono<AppEnv>, role = 'student') =>
  app.request('/api/openai/issues', { method: 'POST', headers: { Cookie: cookieFor(role) } });

const rpcReturning = (reserve: RpcResult) =>
  vi.fn((name: string) =>
    Promise.resolve(name === 'reserve_ai_call' ? reserve : { data: null, error: null })
  );

describe('enforceDailyLimit', () => {
  beforeEach(() => {
    vi.stubEnv('SESSION_SECRET', SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('lets the call through while under the limit and keeps the reservation', async () => {
    const rpc = rpcReturning({ data: 3, error: null });
    const res = await callIssues(buildApp(rpc));

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('reserve_ai_call', {
      p_student_id: STUDENT_ID,
      p_endpoint: 'issues',
      p_limit: 20,
    });
    expect(rpc).not.toHaveBeenCalledWith('release_ai_call', expect.anything());
  });

  it('rejects with 429 once the daily limit is reached', async () => {
    const res = await callIssues(buildApp(rpcReturning({ data: 0, error: null })));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe(OPENAI_ERROR_CODES.DAILY_LIMIT_EXCEEDED);
    expect(body.error.details).toEqual({ endpoint: 'issues', limit: 20 });
  });

  it('releases the reservation when the AI call fails', async () => {
    const rpc = rpcReturning({ data: 1, error: null });
    const res = await callIssues(buildApp(rpc, 500));

    expect(res.status).toBe(500);
    expect(rpc).toHaveBeenCalledWith('release_ai_call', {
      p_student_id: STUDENT_ID,
      p_endpoint: 'issues',
    });
  });

  it('fails closed when usage cannot be recorded', async () => {
    const res = await callIssues(buildApp(rpcReturning({ data: null, error: { message: 'down' } })));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error.code).toBe(OPENAI_ERROR_CODES.USAGE_TRACKING_ERROR);
  });

  it('exempts admin accounts without touching the database', async () => {
    const rpc = rpcReturning({ data: 0, error: null });
    const res = await callIssues(buildApp(rpc), 'admin');

    expect(res.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });
});
