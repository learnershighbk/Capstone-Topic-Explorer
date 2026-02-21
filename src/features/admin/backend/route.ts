import type { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase, getLogger } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { getSessionFromCookie } from '@/features/capstone-auth/backend/route';
import { ADMIN_ERROR_CODES } from './error';
import { getAdminStats, getAdminUsers, getAdminAnalyses } from './service';

const SESSION_COOKIE_NAME = 'capstone_session';

function requireAdmin(cookieValue: string | undefined) {
  const session = getSessionFromCookie(cookieValue);

  if (!session) {
    return { ok: false as const, error: failure(401, ADMIN_ERROR_CODES.UNAUTHORIZED, 'Authentication required') };
  }

  if (session.role !== 'admin') {
    return { ok: false as const, error: failure(403, ADMIN_ERROR_CODES.FORBIDDEN, 'Admin access required') };
  }

  return { ok: true as const, session };
}

export function registerAdminRoutes(app: Hono<AppEnv>) {
  // GET /api/admin/stats
  app.get('/api/admin/stats', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const auth = requireAdmin(getCookie(c, SESSION_COOKIE_NAME));
    if (!auth.ok) return respond(c, auth.error);

    logger.info(`Admin stats requested by: ${auth.session.studentId}`);

    const result = await getAdminStats(supabase);
    return respond(c, result);
  });

  // GET /api/admin/users
  app.get('/api/admin/users', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const auth = requireAdmin(getCookie(c, SESSION_COOKIE_NAME));
    if (!auth.ok) return respond(c, auth.error);

    logger.info(`Admin users list requested by: ${auth.session.studentId}`);

    const result = await getAdminUsers(supabase);
    return respond(c, result);
  });

  // GET /api/admin/analyses
  app.get('/api/admin/analyses', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const auth = requireAdmin(getCookie(c, SESSION_COOKIE_NAME));
    if (!auth.ok) return respond(c, auth.error);

    logger.info(`Admin analyses list requested by: ${auth.session.studentId}`);

    const result = await getAdminAnalyses(supabase);
    return respond(c, result);
  });
}
