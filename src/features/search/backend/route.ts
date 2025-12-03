import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getLogger } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { dataSourcesRequestSchema, referencesRequestSchema } from './schema';
import { SEARCH_ERROR_CODES } from './error';
import { verifyDataSources, verifyReferences } from './service';

export function registerSearchRoutes(app: Hono<AppEnv>) {
  // POST /api/search/data-sources
  app.post('/api/search/data-sources', async (c) => {
    const logger = getLogger(c);

    const body = await c.req.json();
    const parseResult = dataSourcesRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: SEARCH_ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request',
          },
        },
        400
      );
    }

    const { country, topic, aiSuggestions } = parseResult.data;

    logger.info(`Verifying data sources for ${country} - ${topic}`);

    const result = await verifyDataSources(country, topic, aiSuggestions);

    if (result.ok) {
      logger.info(
        `Verified ${result.data.verified_sources.length} sources, ${result.data.unverified_suggestions.length} unverified`
      );
    }

    return respond(c, result);
  });

  // POST /api/search/references
  app.post('/api/search/references', async (c) => {
    const logger = getLogger(c);

    const body = await c.req.json();
    const parseResult = referencesRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: SEARCH_ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request',
          },
        },
        400
      );
    }

    const { country, topic, aiSuggestions } = parseResult.data;

    logger.info(`Verifying references for ${country} - ${topic}`);

    const result = await verifyReferences(country, topic, aiSuggestions);

    if (result.ok) {
      logger.info(
        `Verified ${result.data.verified_references.length} references, ${result.data.unverified_suggestions.length} unverified`
      );
    }

    return respond(c, result);
  });
}
