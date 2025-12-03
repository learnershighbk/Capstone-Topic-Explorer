import { z } from 'zod';

// Issues API
export const issuesRequestSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  interest: z.string().min(1, 'Interest is required'),
});

export const policyIssueSchema = z.object({
  issue: z.string(),
  importance_score: z.number(),
  frequency_score: z.number(),
  total_score: z.number(),
});

export const issuesResponseSchema = z.object({
  policy_issues: z.array(policyIssueSchema),
});

// Topics API
export const topicsRequestSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  issue: z.string().min(1, 'Issue is required'),
  existingTopics: z.array(z.string()).optional(),
});

export const topicSchema = z.object({
  title: z.string(),
});

export const topicsResponseSchema = z.object({
  topics: z.array(topicSchema),
});

// Analysis API
export const analysisRequestSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  issue: z.string().min(1, 'Issue is required'),
  topicTitle: z.string().min(1, 'Topic title is required'),
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

export const analysisResponseSchema = z.object({
  rationale: rationaleSchema,
  data_sources: z.array(z.string()),
  key_references: z.array(z.string()),
  methodologies: z.array(methodologySchema),
  policy_questions: z.array(z.string()),
});

export type IssuesRequest = z.infer<typeof issuesRequestSchema>;
export type IssuesResponse = z.infer<typeof issuesResponseSchema>;
export type TopicsRequest = z.infer<typeof topicsRequestSchema>;
export type TopicsResponse = z.infer<typeof topicsResponseSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
