import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import { SAVED_TOPICS_ERROR_CODES, type SavedTopicsErrorCode } from './error';
import type { SaveAnalysisRequest, SavedAnalysisSummary, SavedAnalysisDetail } from './schema';

export async function getSavedAnalyses(
  supabase: SupabaseClient,
  studentId: string,
  page: number = 1,
  limit: number = 10,
  countryFilter?: string
): Promise<
  HandlerResult<
    { items: SavedAnalysisSummary[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
    SavedTopicsErrorCode
  >
> {
  let query = supabase
    .from('saved_analyses')
    .select('id, country, interest, selected_issue, topic_title, created_at', { count: 'exact' })
    .eq('student_id', studentId);

  if (countryFilter) {
    query = query.eq('country', countryFilter);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return failure(500, SAVED_TOPICS_ERROR_CODES.DATABASE_ERROR, 'Failed to fetch saved analyses');
  }

  const total = count || 0;

  return success({
    items: data as SavedAnalysisSummary[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getSavedAnalysisById(
  supabase: SupabaseClient,
  studentId: string,
  id: string
): Promise<HandlerResult<SavedAnalysisDetail, SavedTopicsErrorCode>> {
  const { data, error } = await supabase
    .from('saved_analyses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, SAVED_TOPICS_ERROR_CODES.NOT_FOUND, 'Analysis not found');
    }
    return failure(500, SAVED_TOPICS_ERROR_CODES.DATABASE_ERROR, 'Failed to fetch analysis');
  }

  if (data.student_id !== studentId) {
    return failure(403, SAVED_TOPICS_ERROR_CODES.FORBIDDEN, 'You do not have access to this analysis');
  }

  return success(data as SavedAnalysisDetail);
}

export async function saveAnalysis(
  supabase: SupabaseClient,
  studentId: string,
  request: SaveAnalysisRequest
): Promise<HandlerResult<{ id: string; message: string }, SavedTopicsErrorCode>> {
  const { data, error } = await supabase
    .from('saved_analyses')
    .insert({
      student_id: studentId,
      country: request.country,
      interest: request.interest,
      selected_issue: request.selected_issue,
      issue_importance_score: request.issue_importance_score || null,
      issue_frequency_score: request.issue_frequency_score || null,
      topic_title: request.topic_title,
      analysis_data: request.analysis_data,
      verified_data_sources: request.verified_data_sources || null,
      verified_references: request.verified_references || null,
    })
    .select('id')
    .single();

  if (error) {
    return failure(500, SAVED_TOPICS_ERROR_CODES.DATABASE_ERROR, 'Failed to save analysis');
  }

  return success({
    id: data.id,
    message: 'Analysis saved successfully',
  }, 201);
}

export async function deleteAnalysis(
  supabase: SupabaseClient,
  studentId: string,
  id: string
): Promise<HandlerResult<{ message: string }, SavedTopicsErrorCode>> {
  // First check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('saved_analyses')
    .select('student_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return failure(404, SAVED_TOPICS_ERROR_CODES.NOT_FOUND, 'Analysis not found');
    }
    return failure(500, SAVED_TOPICS_ERROR_CODES.DATABASE_ERROR, 'Failed to fetch analysis');
  }

  if (existing.student_id !== studentId) {
    return failure(403, SAVED_TOPICS_ERROR_CODES.FORBIDDEN, 'You do not have access to delete this analysis');
  }

  const { error } = await supabase.from('saved_analyses').delete().eq('id', id);

  if (error) {
    return failure(500, SAVED_TOPICS_ERROR_CODES.DATABASE_ERROR, 'Failed to delete analysis');
  }

  return success({ message: 'Analysis deleted successfully' });
}
