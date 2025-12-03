import type { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase, getLogger } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { getSessionFromCookie } from '@/features/capstone-auth/backend/route';
import { saveAnalysisRequestSchema } from './schema';
import { SAVED_TOPICS_ERROR_CODES } from './error';
import { getSavedAnalyses, getSavedAnalysisById, saveAnalysis, deleteAnalysis } from './service';

const SESSION_COOKIE_NAME = 'capstone_session';

export function registerSavedTopicsRoutes(app: Hono<AppEnv>) {
  // GET /api/saved-topics
  app.get('/api/saved-topics', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
    const session = getSessionFromCookie(sessionCookie);

    if (!session) {
      return respond(
        c,
        failure(401, SAVED_TOPICS_ERROR_CODES.UNAUTHORIZED, 'Authentication required')
      );
    }

    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const country = c.req.query('country');

    logger.info(`Fetching saved analyses for student: ${session.studentId}`);

    const result = await getSavedAnalyses(supabase, session.studentId, page, limit, country);

    return respond(c, result);
  });

  // GET /api/saved-topics/:id
  app.get('/api/saved-topics/:id', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
    const session = getSessionFromCookie(sessionCookie);

    if (!session) {
      return respond(
        c,
        failure(401, SAVED_TOPICS_ERROR_CODES.UNAUTHORIZED, 'Authentication required')
      );
    }

    const id = c.req.param('id');

    logger.info(`Fetching analysis ${id} for student: ${session.studentId}`);

    const result = await getSavedAnalysisById(supabase, session.studentId, id);

    return respond(c, result);
  });

  // POST /api/saved-topics
  app.post('/api/saved-topics', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
    const session = getSessionFromCookie(sessionCookie);

    if (!session) {
      return respond(
        c,
        failure(401, SAVED_TOPICS_ERROR_CODES.UNAUTHORIZED, 'Authentication required')
      );
    }

    const body = await c.req.json();
    const parseResult = saveAnalysisRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: SAVED_TOPICS_ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request body',
          },
        },
        400
      );
    }

    logger.info(`Saving analysis for student: ${session.studentId}`);

    const result = await saveAnalysis(supabase, session.studentId, parseResult.data);

    return respond(c, result);
  });

  // DELETE /api/saved-topics/:id
  app.delete('/api/saved-topics/:id', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
    const session = getSessionFromCookie(sessionCookie);

    if (!session) {
      return respond(
        c,
        failure(401, SAVED_TOPICS_ERROR_CODES.UNAUTHORIZED, 'Authentication required')
      );
    }

    const id = c.req.param('id');

    logger.info(`Deleting analysis ${id} for student: ${session.studentId}`);

    const result = await deleteAnalysis(supabase, session.studentId, id);

    return respond(c, result);
  });
}
