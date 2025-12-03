import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getLogger } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { issuesRequestSchema, topicsRequestSchema, analysisRequestSchema } from './schema';
import { OPENAI_ERROR_CODES } from './error';
import { generatePolicyIssues, generateTopics, generateAnalysis } from './service';

export function registerOpenAIRoutes(app: Hono<AppEnv>) {
  // POST /api/openai/issues
  app.post('/api/openai/issues', async (c) => {
    const logger = getLogger(c);

    const body = await c.req.json();
    const parseResult = issuesRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: OPENAI_ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request: country and interest are required',
          },
        },
        400
      );
    }

    const { country, interest } = parseResult.data;

    logger.info(`Generating policy issues for ${country} - ${interest}`);

    const result = await generatePolicyIssues(country, interest);

    if (result.ok) {
      logger.info(`Generated ${result.data.policy_issues.length} policy issues`);
    }

    return respond(c, result);
  });

  // POST /api/openai/topics
  app.post('/api/openai/topics', async (c) => {
    const logger = getLogger(c);

    const body = await c.req.json();
    const parseResult = topicsRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: OPENAI_ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request: country and issue are required',
          },
        },
        400
      );
    }

    const { country, issue, existingTopics } = parseResult.data;

    logger.info(`Generating topics for ${country} - ${issue}`);

    const result = await generateTopics(country, issue, existingTopics || []);

    if (result.ok) {
      logger.info(`Generated ${result.data.topics.length} topics`);
    }

    return respond(c, result);
  });

  // POST /api/openai/analysis
  app.post('/api/openai/analysis', async (c) => {
    const logger = getLogger(c);

    const body = await c.req.json();
    const parseResult = analysisRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          error: {
            code: OPENAI_ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request: country, issue, and topicTitle are required',
          },
        },
        400
      );
    }

    const { country, issue, topicTitle } = parseResult.data;

    logger.info(`Generating analysis for ${topicTitle}`);

    const result = await generateAnalysis(country, issue, topicTitle);

    if (result.ok) {
      logger.info(`Generated analysis successfully`);
    }

    return respond(c, result);
  });
}
