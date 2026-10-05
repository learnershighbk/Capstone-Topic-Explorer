import type { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase, getLogger } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { loginRequestSchema } from './schema';
import { AUTH_ERROR_CODES } from './error';
import { loginStudent } from './service';
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_SECONDS,
  getSessionFromCookie,
  getSessionSecret,
  signSession,
  type SessionData,
} from './session';

const LOGGED_OUT = { isLoggedIn: false, studentId: null, role: null } as const;

export function registerCapstoneAuthRoutes(app: Hono<AppEnv>) {
  // POST /api/auth/login
  app.post('/api/auth/login', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const body = await c.req.json();
    const parseResult = loginRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: AUTH_ERROR_CODES.INVALID_STUDENT_ID,
            message: 'Invalid student ID format. Must be 9 digits.',
          },
        },
        400
      );
    }

    const secret = getSessionSecret();

    if (!secret) {
      logger.error('SESSION_SECRET is missing or shorter than 32 characters');
      return respond(
        c,
        failure(500, AUTH_ERROR_CODES.CONFIG_ERROR, 'Login is temporarily unavailable.')
      );
    }

    const { studentId } = parseResult.data;

    logger.info(`Login attempt for student: ${studentId}`);

    const result = await loginStudent(supabase, studentId);

    if (result.ok) {
      const now = Date.now();
      const sessionData: SessionData = {
        studentId,
        role: result.data.role,
        createdAt: now,
        expiresAt: now + SESSION_EXPIRY_SECONDS * 1000,
      };

      setCookie(c, SESSION_COOKIE_NAME, signSession(sessionData, secret), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: SESSION_EXPIRY_SECONDS,
        path: '/',
      });

      logger.info(`Login successful for student: ${studentId}`);
    }

    return respond(c, result);
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', async (c) => {
    const logger = getLogger(c);

    deleteCookie(c, SESSION_COOKIE_NAME, {
      path: '/',
    });

    logger.info('User logged out');

    return respond(c, success({ message: 'Logged out successfully' }));
  });

  // GET /api/auth/session
  app.get('/api/auth/session', async (c) => {
    const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return c.json(LOGGED_OUT);
    }

    const session = getSessionFromCookie(sessionCookie);

    if (!session) {
      deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
      return c.json(LOGGED_OUT);
    }

    return c.json({ isLoggedIn: true, studentId: session.studentId, role: session.role });
  });
}
