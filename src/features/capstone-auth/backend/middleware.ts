import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import type { AppEnv } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { AUTH_ERROR_CODES } from './error';
import { SESSION_COOKIE_NAME, getSessionFromCookie } from './session';

/**
 * Rejects requests without a valid signed session. Guards the AI and search
 * routes, which spend paid API credits on every call.
 */
export const requireSession = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const session = getSessionFromCookie(getCookie(c, SESSION_COOKIE_NAME));

    if (!session) {
      return respond(
        c,
        failure(401, AUTH_ERROR_CODES.UNAUTHORIZED, 'Please log in to use this feature.')
      );
    }

    await next();
  });
