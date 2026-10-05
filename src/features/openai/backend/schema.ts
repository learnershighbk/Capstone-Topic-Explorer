import * as z from 'zod/v4';
import { AI_INPUT_MAX_LENGTH as MAX } from '../constants/limits';

// Issues API
export const issuesRequestSchema = z.object({
  country: z.string().min(1, 'Country is required').max(MAX.country),
  interest: z.string().min(1, 'Interest is required').max(MAX.interest),
});

export const policyIssueSchema = z.object({
  issue: z.string(),
  description: z.string(),
  importance_score: z.number(),
  frequency_score: z.number(),
  total_score: z.number(),
});

export const issuesResponseSchema = z.object({
  policy_issues: z.array(policyIssueSchema),
});

// Topics API
export const topicsRequestSchema = z.object({
  country: z.string().min(1, 'Country is required').max(MAX.country),
  issue: z.string().min(1, 'Issue is required').max(MAX.issue),
  existingTopics: z
    .array(z.string().max(MAX.topicTitle))
    .max(MAX.existingTopicsCount)
    .optional(),
});

export const topicSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const topicsResponseSchema = z.object({
  topics: z.array(topicSchema),
});

// Analysis API
export const analysisRequestSchema = z.object({
  country: z.string().min(1, 'Country is required').max(MAX.country),
  issue: z.string().min(1, 'Issue is required').max(MAX.issue),
  topicTitle: z.string().min(1, 'Topic title is required').max(MAX.topicTitle),
});

export const rationaleSchema = z.object({
  relevance: z.string(),
  feasibility: z.string(),
  impact: z.string(),
});

export const methodologySchema = z.object({
  methodology: z.string(),
  explanation: z.string(),
});

export const aiReferenceSchema = z.object({
  authors: z.array(z.string()),
  year: z.number().int(),
  title: z.string(),
  venue: z.string(),
});

export const analysisResponseSchema = z.object({
  rationale: rationaleSchema,
  data_sources: z.array(z.string()),
  key_references: z.array(aiReferenceSchema),
  methodologies: z.array(methodologySchema),
  policy_questions: z.array(z.string()),
});

export type IssuesRequest = z.infer<typeof issuesRequestSchema>;
export type IssuesResponse = z.infer<typeof issuesResponseSchema>;
export type TopicsRequest = z.infer<typeof topicsRequestSchema>;
export type TopicsResponse = z.infer<typeof topicsResponseSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
