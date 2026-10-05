import { describe, expect, it } from 'vitest';
import { clampScore, scorePolicyIssues } from './issue-scoring';
import type { PolicyIssueDraft } from './schema';

const draft = (issue: string, importance_score: number, frequency_score: number): PolicyIssueDraft => ({
  issue,
  description: `${issue} description`,
  importance_score,
  frequency_score,
});

describe('clampScore', () => {
  it('rounds and clamps into 1-10', () => {
    expect(clampScore(7.6)).toBe(8);
    expect(clampScore(0)).toBe(1);
    expect(clampScore(12)).toBe(10);
    expect(clampScore(Number.NaN)).toBe(1);
  });
});

describe('scorePolicyIssues', () => {
  it('computes the total on the server instead of trusting the model', () => {
    const [issue] = scorePolicyIssues([draft('A', 7, 6)]).policy_issues;

    expect(issue.total_score).toBe(13);
  });

  it('sorts by total, breaking ties by importance', () => {
    const { policy_issues } = scorePolicyIssues([
      draft('Low', 3, 4),
      draft('TieFrequent', 5, 9),
      draft('TieImportant', 9, 5),
      draft('High', 10, 10),
    ]);

    expect(policy_issues.map((issue) => issue.issue)).toEqual([
      'High',
      'TieImportant',
      'TieFrequent',
      'Low',
    ]);
  });

  it('keeps at most 10 issues, dropping the lowest totals', () => {
    const drafts = Array.from({ length: 12 }, (_, index) => draft(`Issue ${index}`, index % 10 + 1, 5));
    const { policy_issues } = scorePolicyIssues(drafts);

    expect(policy_issues).toHaveLength(10);
    expect(policy_issues.at(-1)?.total_score).toBeGreaterThanOrEqual(7);
  });

  it('drops issues without a title and clamps out-of-range scores', () => {
    const { policy_issues } = scorePolicyIssues([draft('  ', 8, 8), draft('Valid', 15, -2)]);

    expect(policy_issues).toEqual([
      { issue: 'Valid', description: 'Valid description', importance_score: 10, frequency_score: 1, total_score: 11 },
    ]);
  });
});
