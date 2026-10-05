import { describe, expect, it } from 'vitest';
import { kstMidnightIso, recentKstDates, summarizeUsage, toKstDate, type UsageRow } from './usage-summary';

const row = (student_id: string, usage_date: string, endpoint: string, call_count: number): UsageRow => ({
  student_id,
  usage_date,
  endpoint,
  call_count,
});

describe('KST date helpers', () => {
  it('rolls over to the next date at midnight KST, not UTC', () => {
    expect(toKstDate(new Date('2026-10-05T14:59:59Z'))).toBe('2026-10-05');
    expect(toKstDate(new Date('2026-10-05T15:00:00Z'))).toBe('2026-10-06');
  });

  it('builds midnight KST for a date', () => {
    expect(new Date(kstMidnightIso('2026-10-06')).toISOString()).toBe('2026-10-05T15:00:00.000Z');
  });

  it('lists recent dates newest first across a month boundary', () => {
    expect(recentKstDates('2026-10-02', 3)).toEqual(['2026-10-02', '2026-10-01', '2026-09-30']);
  });
});

describe('summarizeUsage', () => {
  const rows = [
    row('111111111', '2026-10-05', 'issues', 3),
    row('111111111', '2026-10-05', 'analysis', 10),
    row('222222222', '2026-10-05', 'topics', 2),
    row('222222222', '2026-10-04', 'search', 4),
    row('333333333', '2026-10-04', 'unknown', 99),
  ];

  const usage = summarizeUsage(rows, '2026-10-05', 3);

  it('totals each day and fills days without usage with zeros', () => {
    expect(usage.daily).toEqual([
      { date: '2026-10-05', activeStudents: 2, counts: { issues: 3, topics: 2, analysis: 10, search: 0 } },
      { date: '2026-10-04', activeStudents: 2, counts: { issues: 0, topics: 0, analysis: 0, search: 4 } },
      { date: '2026-10-03', activeStudents: 0, counts: { issues: 0, topics: 0, analysis: 0, search: 0 } },
    ]);
  });

  it('lists only today per student, heaviest first, and flags reached limits', () => {
    expect(usage.todayByStudent).toEqual([
      {
        studentId: '111111111',
        counts: { issues: 3, topics: 0, analysis: 10, search: 0 },
        limitReached: ['analysis'],
      },
      {
        studentId: '222222222',
        counts: { issues: 0, topics: 2, analysis: 0, search: 0 },
        limitReached: [],
      },
    ]);
  });
});
