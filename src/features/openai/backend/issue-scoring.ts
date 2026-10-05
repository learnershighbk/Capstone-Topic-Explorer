import type { PolicyIssueDraft, IssuesResponse } from './schema';

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;
export const ISSUE_COUNT = 10;

/** Rounds to an integer and clamps into the rubric's 1-10 range. */
export const clampScore = (score: number) =>
  Number.isFinite(score) ? Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(score))) : MIN_SCORE;

/**
 * Turns the model's per-issue scores into the response the UI shows. The
 * model only judges importance and frequency; the arithmetic (range, total,
 * order, count) is done here because LLMs are unreliable at it.
 */
export function scorePolicyIssues(drafts: PolicyIssueDraft[]): IssuesResponse {
  const policy_issues = drafts
    .filter((draft) => draft.issue.trim().length > 0)
    .map((draft) => {
      const importance_score = clampScore(draft.importance_score);
      const frequency_score = clampScore(draft.frequency_score);

      return {
        ...draft,
        importance_score,
        frequency_score,
        total_score: importance_score + frequency_score,
      };
    })
    .sort((a, b) => b.total_score - a.total_score || b.importance_score - a.importance_score)
    .slice(0, ISSUE_COUNT);

  return { policy_issues };
}
