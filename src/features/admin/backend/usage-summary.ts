import { groupBy } from 'es-toolkit';
import { DAILY_AI_CALL_LIMITS, type AiEndpoint } from '@/features/openai/constants/limits';
import type { AdminUsage, UsageCounts } from './schema';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const AI_ENDPOINTS = Object.keys(DAILY_AI_CALL_LIMITS) as AiEndpoint[];

export type UsageRow = {
  student_id: string;
  usage_date: string;
  endpoint: string;
  call_count: number;
};

/** KST calendar date (YYYY-MM-DD). KST has no daylight saving, so a fixed offset is exact. */
export const toKstDate = (date: Date) =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);

/** ISO timestamp of midnight KST at the start of the given KST date. */
export const kstMidnightIso = (kstDate: string) => `${kstDate}T00:00:00+09:00`;

/** The `days` KST dates ending at `today`, newest first. */
export const recentKstDates = (today: string, days: number) =>
  Array.from({ length: days }, (_, index) =>
    new Date(Date.parse(`${today}T00:00:00Z`) - index * DAY_MS).toISOString().slice(0, 10)
  );

const emptyCounts = (): UsageCounts => ({ issues: 0, topics: 0, analysis: 0, search: 0 });

const isAiEndpoint = (endpoint: string): endpoint is AiEndpoint =>
  (AI_ENDPOINTS as string[]).includes(endpoint);

const sumCounts = (rows: UsageRow[]) =>
  rows.reduce<UsageCounts>(
    (counts, row) =>
      isAiEndpoint(row.endpoint)
        ? { ...counts, [row.endpoint]: counts[row.endpoint] + row.call_count }
        : counts,
    emptyCounts()
  );

const totalOf = (counts: UsageCounts) =>
  AI_ENDPOINTS.reduce((total, endpoint) => total + counts[endpoint], 0);

/**
 * Builds the admin usage view: per-day totals for the recent window (days with
 * no usage included as zeros) and today's per-student counts, heaviest first.
 */
export function summarizeUsage(rows: UsageRow[], today: string, days: number): AdminUsage {
  const rowsByDate = groupBy(rows, (row) => row.usage_date);

  const daily = recentKstDates(today, days).map((date) => {
    const dayRows = rowsByDate[date] ?? [];

    return {
      date,
      activeStudents: new Set(dayRows.map((row) => row.student_id)).size,
      counts: sumCounts(dayRows),
    };
  });

  const todayByStudent = Object.entries(groupBy(rowsByDate[today] ?? [], (row) => row.student_id))
    .map(([studentId, studentRows]) => {
      const counts = sumCounts(studentRows);

      return {
        studentId,
        counts,
        limitReached: AI_ENDPOINTS.filter(
          (endpoint) => counts[endpoint] >= DAILY_AI_CALL_LIMITS[endpoint]
        ),
      };
    })
    .sort((a, b) => totalOf(b.counts) - totalOf(a.counts));

  return { today, limits: { ...DAILY_AI_CALL_LIMITS }, daily, todayByStudent };
}
