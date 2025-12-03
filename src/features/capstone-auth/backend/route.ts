import type { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase, getLogger } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';
import { loginRequestSchema } from './schema';
import { AUTH_ERROR_CODES } from './error';
import { loginStudent } from './service';

const SESSION_COOKIE_NAME = 'capstone_session';
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface SessionData {
  studentId: string;
  createdAt: number;
  expiresAt: number;
}

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

    const { studentId } = parseResult.data;

    logger.info(`Login attempt for student: ${studentId}`);

    const result = await loginStudent(supabase, studentId);

    if (result.ok) {
      const sessionData: SessionData = {
        studentId,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY_SECONDS * 1000,
      };

      setCookie(c, SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
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
      return c.json({ isLoggedIn: false, studentId: null });
    }

    try {
      const session: SessionData = JSON.parse(sessionCookie);

      if (session.expiresAt < Date.now()) {
        deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
        return c.json({ isLoggedIn: false, studentId: null });
      }

      return c.json({ isLoggedIn: true, studentId: session.studentId });
    } catch {
      deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
      return c.json({ isLoggedIn: false, studentId: null });
    }
  });
}

export function getSessionFromCookie(cookieValue: string | undefined): SessionData | null {
  if (!cookieValue) return null;

  try {
    const session: SessionData = JSON.parse(cookieValue);

    if (session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
