import { z } from 'zod';

export const dataSourcesRequestSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  topic: z.string().min(1, 'Topic is required'),
  aiSuggestions: z.array(z.string()),
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

export const referencesRequestSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  topic: z.string().min(1, 'Topic is required'),
  aiSuggestions: z.array(z.string()),
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
