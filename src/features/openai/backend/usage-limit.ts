import type { SupabaseClient } from '@supabase/supabase-js';
import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import type { AppEnv } from '@/backend/hono/context';
import { getLogger, getSupabase } from '@/backend/hono/context';
import { failure, respond, success, type HandlerResult } from '@/backend/http/response';
import { SESSION_COOKIE_NAME, getSessionFromCookie } from '@/features/capstone-auth/backend/session';
import { AUTH_ERROR_CODES } from '@/features/capstone-auth/backend/error';
import { DAILY_AI_CALL_LIMITS, type AiEndpoint } from '../constants/limits';
import { OPENAI_ERROR_CODES, type OpenAIErrorCode } from './error';

const ADMIN_ROLE = 'admin';

export type DailyLimitDetails = {
  endpoint: AiEndpoint;
  limit: number;
};

/**
 * Atomically reserves one call for today (KST). Resolves to the new count,
 * or 0 when the daily limit was already reached.
 */
export async function reserveAiCall(
  supabase: SupabaseClient,
  studentId: string,
  endpoint: AiEndpoint,
  limit: number
): Promise<HandlerResult<number, OpenAIErrorCode>> {
  const { data, error } = await supabase.rpc('reserve_ai_call', {
    p_student_id: studentId,
    p_endpoint: endpoint,
    p_limit: limit,
  });

  if (error || typeof data !== 'number') {
    return failure(
      503,
      OPENAI_ERROR_CODES.USAGE_TRACKING_ERROR,
      'Usage tracking is unavailable. Please try again later.'
    );
  }

  return success(data);
}

/** Returns a reserved call so a failed AI request does not count against the student. */
export async function releaseAiCall(
  supabase: SupabaseClient,
  studentId: string,
  endpoint: AiEndpoint
): Promise<boolean> {
  const { error } = await supabase.rpc('release_ai_call', {
    p_student_id: studentId,
    p_endpoint: endpoint,
  });

  return !error;
}

/**
 * Enforces the per-student daily limit for one AI endpoint. Must run after
 * `requireSession()`. Fails closed: if usage cannot be recorded, the AI is not
 * called, because unmetered calls are what exhausted the credits before.
 */
export const enforceDailyLimit = (endpoint: AiEndpoint) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const session = getSessionFromCookie(getCookie(c, SESSION_COOKIE_NAME));

    if (!session) {
      return respond(
        c,
        failure(401, AUTH_ERROR_CODES.UNAUTHORIZED, 'Please log in to use this feature.')
      );
    }

    if (session.role === ADMIN_ROLE) {
      await next();
      return;
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const limit = DAILY_AI_CALL_LIMITS[endpoint];
    const reservation = await reserveAiCall(supabase, session.studentId, endpoint, limit);

    if (!reservation.ok) {
      logger.error(`[UsageLimit] Failed to reserve ${endpoint} call for ${session.studentId}`);
      return respond(c, reservation);
    }

    if (reservation.data === 0) {
      logger.warn(`[UsageLimit] ${session.studentId} reached daily ${endpoint} limit (${limit})`);
      return respond(
        c,
        failure<OpenAIErrorCode, DailyLimitDetails>(
          429,
          OPENAI_ERROR_CODES.DAILY_LIMIT_EXCEEDED,
          `Daily limit reached (${limit} per day). It resets at midnight KST.`,
          { endpoint, limit }
        )
      );
    }

    let succeeded = false;

    try {
      await next();
      succeeded = c.res.status < 400;
    } finally {
      if (!succeeded) {
        const released = await releaseAiCall(supabase, session.studentId, endpoint);

        if (!released) {
          logger.error(`[UsageLimit] Failed to release ${endpoint} call for ${session.studentId}`);
        }
      }
    }
  });
