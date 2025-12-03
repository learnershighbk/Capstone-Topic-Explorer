import { z } from 'zod';

export const saveAnalysisRequestSchema = z.object({
  country: z.string().min(1),
  interest: z.string().min(1),
  selected_issue: z.string().min(1),
  issue_importance_score: z.number().nullable().optional(),
  issue_frequency_score: z.number().nullable().optional(),
  topic_title: z.string().min(1),
  analysis_data: z.object({
    rationale: z.object({
      relevance: z.string(),
      feasibility: z.string(),
      impact: z.string(),
    }),
    data_sources: z.array(z.string()),
    key_references: z.array(z.string()),
    methodologies: z.array(
      z.object({
        methodology: z.string(),
        explanation: z.string(),
      })
    ),
    policy_questions: z.array(z.string()),
  }),
  verified_data_sources: z.array(z.any()).nullable().optional(),
  verified_references: z.array(z.any()).nullable().optional(),
});

export const savedAnalysisSummarySchema = z.object({
  id: z.string(),
  country: z.string(),
  interest: z.string(),
  selected_issue: z.string(),
  topic_title: z.string(),
  created_at: z.string(),
});

export const savedAnalysisDetailSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  country: z.string(),
  interest: z.string(),
  selected_issue: z.string(),
  issue_importance_score: z.number().nullable(),
  issue_frequency_score: z.number().nullable(),
  topic_title: z.string(),
  analysis_data: z.any(),
  verified_data_sources: z.any().nullable(),
  verified_references: z.any().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SaveAnalysisRequest = z.infer<typeof saveAnalysisRequestSchema>;
export type SavedAnalysisSummary = z.infer<typeof savedAnalysisSummarySchema>;
export type SavedAnalysisDetail = z.infer<typeof savedAnalysisDetailSchema>;
