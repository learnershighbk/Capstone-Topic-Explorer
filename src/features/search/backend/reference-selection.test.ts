import { describe, expect, it } from 'vitest';
import { recentSinceYear, selectReferences } from './reference-selection';
import type { VerifiedReference } from '@/types';

const CURRENT_YEAR = 2026;

const reference = (overrides: Partial<VerifiedReference>): VerifiedReference => ({
  title: `Work ${overrides.doi ?? overrides.title ?? 'x'}`,
  authors: ['Kim, J.'],
  year: 2022,
  source: 'Journal',
  verified_at: '2026-10-05T00:00:00.000Z',
  ...overrides,
});

describe('recentSinceYear', () => {
  it('spans seven calendar years including the current one', () => {
    expect(recentSinceYear(2026)).toBe(2020);
  });
});

describe('selectReferences', () => {
  it('keeps at most two older works, preferring the most cited', () => {
    const verified = [
      reference({ doi: 'old-1', year: 2001, cited_by_count: 500 }),
      reference({ doi: 'old-2', year: 2005, cited_by_count: 50 }),
      reference({ doi: 'old-3', year: 2012, cited_by_count: 2000 }),
    ];

    const selected = selectReferences({ verified, discovered: [], currentYear: CURRENT_YEAR });

    expect(selected.map((r) => r.doi)).toEqual(['old-3', 'old-1']);
  });

  it('places recent works first, ordered by citations per year, with foundational works last', () => {
    const verified = [
      reference({ doi: 'old', year: 2001, cited_by_count: 5000 }),
      reference({ doi: 'recent-ai', year: 2020, cited_by_count: 70 }),
    ];
    const discovered = [reference({ doi: 'found', year: 2025, cited_by_count: 40 })];

    const selected = selectReferences({ verified, discovered, currentYear: CURRENT_YEAR });

    expect(selected.map((r) => r.doi)).toEqual(['found', 'recent-ai', 'old']);
  });

  it('does not add a discovered work the AI already cited, matched by DOI or title', () => {
    const verified = [
      reference({ doi: '10.1/a', title: 'Alpha study', year: 2021 }),
      reference({ title: 'Universal health coverage in Vietnam since 2015', year: 2022 }),
    ];
    const discovered = [
      reference({ doi: 'https://doi.org/10.1/A', title: 'Alpha study (journal version)', year: 2021 }),
      reference({ title: 'Universal Health Coverage in Vietnam Since 2015', year: 2022, doi: '10.1/b' }),
      reference({ doi: '10.1/c', title: 'A different work entirely', year: 2024 }),
    ];

    const selected = selectReferences({ verified, discovered, currentYear: CURRENT_YEAR });

    expect(selected.map((r) => r.doi)).toEqual(['10.1/a', undefined, '10.1/c']);
  });

  it('always adds at least three discovered works even when the AI list is full', () => {
    const verified = Array.from({ length: 8 }, (_, i) =>
      reference({ doi: `ai-${i}`, year: 2022, cited_by_count: 100 })
    );
    const discovered = Array.from({ length: 6 }, (_, i) =>
      reference({ doi: `found-${i}`, year: 2023, cited_by_count: 1 })
    );

    const selected = selectReferences({ verified, discovered, currentYear: CURRENT_YEAR });

    expect(selected.filter((r) => r.doi?.startsWith('found-'))).toHaveLength(3);
  });

  it('fills up to six discovered works when the AI list is empty', () => {
    const discovered = Array.from({ length: 10 }, (_, i) => reference({ doi: `found-${i}`, year: 2023 }));

    const selected = selectReferences({ verified: [], discovered, currentYear: CURRENT_YEAR });

    expect(selected).toHaveLength(6);
  });
});
