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

export const usageCountsSchema = z.object({
  issues: z.number(),
  topics: z.number(),
  analysis: z.number(),
  search: z.number(),
});

export const adminUsageSchema = z.object({
  today: z.string(),
  limits: usageCountsSchema,
  daily: z.array(
    z.object({
      date: z.string(),
      activeStudents: z.number(),
      counts: usageCountsSchema,
    })
  ),
  todayByStudent: z.array(
    z.object({
      studentId: z.string(),
      counts: usageCountsSchema,
      limitReached: z.array(usageCountsSchema.keyof()),
    })
  ),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminAnalysis = z.infer<typeof adminAnalysisSchema>;
export type UsageCounts = z.infer<typeof usageCountsSchema>;
export type AdminUsage = z.infer<typeof adminUsageSchema>;
