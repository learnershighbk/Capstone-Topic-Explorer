import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import { AUTH_ERROR_CODES, type AuthErrorCode } from './error';
import type { LoginResponse } from './schema';

interface StudentRecord {
  id: string;
  student_id: string;
  created_at: string;
  last_login_at: string;
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
  });
}
