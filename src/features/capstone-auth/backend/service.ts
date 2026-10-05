import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import { AUTH_ERROR_CODES, type AuthErrorCode } from './error';
import type { LoginResponse } from './schema';

interface StudentRecord {
  id: string;
  student_id: string;
  created_at: string;
  last_login_at: string;
  role: string;
}

export async function loginStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<HandlerResult<LoginResponse, AuthErrorCode>> {
  const { data: existingStudent, error: selectError } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', studentId)
    .single<StudentRecord>();

  if (selectError && selectError.code !== 'PGRST116') {
    return failure(500, AUTH_ERROR_CODES.DATABASE_ERROR, 'Failed to check student record');
  }

  let isNewUser = false;

  if (!existingStudent) {
    const { error: insertError } = await supabase
      .from('students')
      .insert({ student_id: studentId });

    if (insertError) {
      return failure(500, AUTH_ERROR_CODES.DATABASE_ERROR, 'Failed to create student record');
    }

    isNewUser = true;
  } else {
    const { error: updateError } = await supabase
      .from('students')
      .update({ last_login_at: new Date().toISOString() })
      .eq('student_id', studentId);

    if (updateError) {
      return failure(500, AUTH_ERROR_CODES.DATABASE_ERROR, 'Failed to update login time');
    }
  }

  return success({
    studentId,
    isNewUser,
    lastLoginAt: new Date().toISOString(),
    role: existingStudent?.role ?? 'student',
  });
}

/**
 * Looks up a student's role without writing anything, so the admin password
 * can be checked before a login updates the record. Returns null for new IDs.
 */
export async function getStudentRole(
  supabase: SupabaseClient,
  studentId: string
): Promise<HandlerResult<string | null, AuthErrorCode>> {
  const { data, error } = await supabase
    .from('students')
    .select('role')
    .eq('student_id', studentId)
    .maybeSingle<{ role: string | null }>();

  if (error) {
    return failure(500, AUTH_ERROR_CODES.DATABASE_ERROR, 'Failed to check student record');
  }

  return success(data?.role ?? null);
}

/** Reserves one admin login attempt and returns the count in the current 24h window. */
export async function reserveAdminLoginAttempt(
  supabase: SupabaseClient,
  studentId: string
): Promise<HandlerResult<number, AuthErrorCode>> {
  const { data, error } = await supabase.rpc('reserve_admin_login_attempt', {
    p_student_id: studentId,
  });

  if (error || typeof data !== 'number') {
    return failure(500, AUTH_ERROR_CODES.DATABASE_ERROR, 'Failed to record admin login attempt');
  }

  return success(data);
}

/** Clears the attempt counter after a successful admin login. */
export async function resetAdminLoginAttempts(
  supabase: SupabaseClient,
  studentId: string
): Promise<HandlerResult<null, AuthErrorCode>> {
  const { error } = await supabase
    .from('students')
    .update({ admin_failed_attempts: 0, admin_attempt_window_start: null })
    .eq('student_id', studentId);

  if (error) {
    return failure(500, AUTH_ERROR_CODES.DATABASE_ERROR, 'Failed to reset admin login attempts');
  }

  return success(null);
}
