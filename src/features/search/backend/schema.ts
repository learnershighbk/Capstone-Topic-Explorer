import * as z from 'zod/v4';

/** Bounds each search request; an analysis yields only a handful of suggestions. */
const MAX_COUNTRY_LENGTH = 100;
const MAX_TOPIC_LENGTH = 500;
const MAX_SUGGESTION_LENGTH = 1000;
const MAX_SUGGESTIONS = 20;

export const dataSourcesRequestSchema = z.object({
  country: z.string().min(1, 'Country is required').max(MAX_COUNTRY_LENGTH),
  topic: z.string().min(1, 'Topic is required').max(MAX_TOPIC_LENGTH),
  aiSuggestions: z.array(z.string().max(MAX_SUGGESTION_LENGTH)).max(MAX_SUGGESTIONS),
});

export const verifiedDataSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  description: z.string(),
  source_type: z.enum(['government', 'international_org', 'academic', 'ngo', 'other']),
  verified_at: z.string(),
});

export const dataSourcesResponseSchema = z.object({
  verified_sources: z.array(verifiedDataSourceSchema),
  unverified_suggestions: z.array(z.string()),
});

const MAX_AUTHORS = 30;
const MIN_YEAR = 1800;
const MAX_YEAR = 2100;

export const aiReferenceInputSchema = z.object({
  authors: z.array(z.string().max(MAX_COUNTRY_LENGTH)).max(MAX_AUTHORS),
  year: z.number().int().min(MIN_YEAR).max(MAX_YEAR),
  title: z.string().min(1).max(MAX_SUGGESTION_LENGTH),
  venue: z.string().max(MAX_TOPIC_LENGTH),
});

export const referencesRequestSchema = z.object({
  country: z.string().min(1, 'Country is required').max(MAX_COUNTRY_LENGTH),
  topic: z.string().min(1, 'Topic is required').max(MAX_TOPIC_LENGTH),
  aiSuggestions: z.array(aiReferenceInputSchema).max(MAX_SUGGESTIONS),
});

export const verifiedReferenceSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  year: z.number(),
  source: z.string(),
  url: z.string().optional(),
  doi: z.string().optional(),
  verified_at: z.string(),
});

export const referencesResponseSchema = z.object({
  verified_references: z.array(verifiedReferenceSchema),
  unverified_suggestions: z.array(z.string()),
});

export type DataSourcesRequest = z.infer<typeof dataSourcesRequestSchema>;
export type DataSourcesResponse = z.infer<typeof dataSourcesResponseSchema>;
export type ReferencesRequest = z.infer<typeof referencesRequestSchema>;
export type ReferencesResponse = z.infer<typeof referencesResponseSchema>;
