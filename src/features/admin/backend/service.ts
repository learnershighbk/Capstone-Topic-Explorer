import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import { ADMIN_ERROR_CODES, type AdminErrorCode } from './error';
import type { AdminStats, AdminUser, AdminAnalysis } from './schema';

export async function getAdminStats(
  supabase: SupabaseClient
): Promise<HandlerResult<AdminStats, AdminErrorCode>> {
  const { count: totalUsers, error: usersError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  if (usersError) {
    return failure(500, ADMIN_ERROR_CODES.DATABASE_ERROR, 'Failed to count users');
  }

  const { count: totalAnalyses, error: analysesError } = await supabase
    .from('saved_analyses')
    .select('*', { count: 'exact', head: true });

  if (analysesError) {
    return failure(500, ADMIN_ERROR_CODES.DATABASE_ERROR, 'Failed to count analyses');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayLoginCount, error: loginError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .gte('last_login_at', todayStart.toISOString());

  if (loginError) {
    return failure(500, ADMIN_ERROR_CODES.DATABASE_ERROR, 'Failed to count today logins');
  }

  return success({
    totalUsers: totalUsers ?? 0,
    totalAnalyses: totalAnalyses ?? 0,
    todayLoginCount: todayLoginCount ?? 0,
  });
}

export async function getAdminUsers(
  supabase: SupabaseClient
): Promise<HandlerResult<AdminUser[], AdminErrorCode>> {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('student_id, created_at, last_login_at')
    .order('created_at', { ascending: false });

  if (studentsError) {
    return failure(500, ADMIN_ERROR_CODES.DATABASE_ERROR, 'Failed to fetch users');
  }

  const { data: analysesCounts, error: countsError } = await supabase
    .from('saved_analyses')
    .select('student_id');

  if (countsError) {
    return failure(500, ADMIN_ERROR_CODES.DATABASE_ERROR, 'Failed to fetch analyses counts');
  }

  const countMap = new Map<string, number>();
  for (const row of analysesCounts ?? []) {
    countMap.set(row.student_id, (countMap.get(row.student_id) ?? 0) + 1);
  }

  const users: AdminUser[] = (students ?? []).map((s) => ({
    studentId: s.student_id,
    createdAt: s.created_at,
    lastLoginAt: s.last_login_at,
    savedAnalysesCount: countMap.get(s.student_id) ?? 0,
  }));

  return success(users);
}

export async function getAdminAnalyses(
  supabase: SupabaseClient
): Promise<HandlerResult<AdminAnalysis[], AdminErrorCode>> {
  const { data, error } = await supabase
    .from('saved_analyses')
    .select('student_id, country, interest, topic_title, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return failure(500, ADMIN_ERROR_CODES.DATABASE_ERROR, 'Failed to fetch analyses');
  }

  const analyses: AdminAnalysis[] = (data ?? []).map((row) => ({
    studentId: row.student_id,
    country: row.country,
    interest: row.interest,
    topicTitle: row.topic_title,
    createdAt: row.created_at,
  }));

  return success(analyses);
}
