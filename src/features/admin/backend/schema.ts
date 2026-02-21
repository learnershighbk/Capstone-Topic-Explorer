import { z } from 'zod';

export const adminStatsSchema = z.object({
  totalUsers: z.number(),
  totalAnalyses: z.number(),
  todayLoginCount: z.number(),
});

export const adminUserSchema = z.object({
  studentId: z.string(),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable(),
  savedAnalysesCount: z.number(),
});

export const adminAnalysisSchema = z.object({
  studentId: z.string(),
  country: z.string(),
  interest: z.string(),
  topicTitle: z.string(),
  createdAt: z.string(),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminAnalysis = z.infer<typeof adminAnalysisSchema>;
