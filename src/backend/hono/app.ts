import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerCapstoneAuthRoutes } from '@/features/capstone-auth/backend/route';
import { registerOpenAIRoutes } from '@/features/openai/backend/route';
import { registerSearchRoutes } from '@/features/search/backend/route';
import { registerSavedTopicsRoutes } from '@/features/saved-topics/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  // In development, always create a new app for HMR
  if (process.env.NODE_ENV === 'development') {
    singletonApp = null;
  }

  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  // Register all routes
  registerExampleRoutes(app);
  registerCapstoneAuthRoutes(app);
  registerOpenAIRoutes(app);
  registerSearchRoutes(app);
  registerSavedTopicsRoutes(app);

  singletonApp = app;

  return app;
};
