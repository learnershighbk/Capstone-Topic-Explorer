'use client';

import { cn } from '@/lib/utils';
import { useAdminUsage } from '../hooks/useAdminData';
import type { UsageCounts } from '../backend/schema';

const USAGE_COLUMNS: { key: keyof UsageCounts; label: string }[] = [
  { key: 'issues', label: 'Issues' },
  { key: 'topics', label: 'Topics' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'search', label: 'Search' },
];

const TH_CLASS = 'px-4 py-3 font-medium text-gray-600';
const TD_CLASS = 'px-4 py-3 text-gray-600';

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={columns} className="px-4 py-3">
            <div className="h-5 animate-pulse rounded bg-gray-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyRow({ columns, message }: { columns: number; message: string }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-center text-gray-400">
        {message}
      </td>
    </tr>
  );
}

/**
 * Daily paid-API usage (KST) so the operator can see overall load and which
 * students are hitting their limits. Admin calls are exempt and not counted.
 */
export function AdminUsageSection() {
  const { data: usage, isLoading, isError } = useAdminUsage();
  const dailyColumns = USAGE_COLUMNS.length + 2;
  const studentColumns = USAGE_COLUMNS.length + 1;

  if (isError) {
    return (
      <section className="mb-10 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        사용량을 불러오지 못했습니다. migration 0006·0007이 적용되었는지 확인해 주세요.
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">AI Usage (KST)</h2>
        {usage && (
          <p className="mt-1 text-sm text-gray-500">
            Daily limits per student:{' '}
            {USAGE_COLUMNS.map(({ key, label }) => `${label} ${usage.limits[key]}`).join(' · ')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <caption className="border-b border-gray-200 bg-white px-4 py-2 text-left font-medium text-gray-900">
              Last 7 Days
            </caption>
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={TH_CLASS}>Date</th>
                <th className={TH_CLASS}>Students</th>
                {USAGE_COLUMNS.map(({ key, label }) => (
                  <th key={key} className={TH_CLASS}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading || !usage ? (
                <SkeletonRows columns={dailyColumns} />
              ) : (
                usage.daily.map((day) => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{day.date}</td>
                    <td className={TD_CLASS}>{day.activeStudents}</td>
                    {USAGE_COLUMNS.map(({ key }) => (
                      <td key={key} className={TD_CLASS}>
                        {day.counts[key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <caption className="border-b border-gray-200 bg-white px-4 py-2 text-left font-medium text-gray-900">
              Today by Student
            </caption>
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={TH_CLASS}>Student ID</th>
                {USAGE_COLUMNS.map(({ key, label }) => (
                  <th key={key} className={TH_CLASS}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading || !usage ? (
                <SkeletonRows columns={studentColumns} />
              ) : usage.todayByStudent.length === 0 ? (
                <EmptyRow columns={studentColumns} message="No usage today" />
              ) : (
                usage.todayByStudent.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{student.studentId}</td>
                    {USAGE_COLUMNS.map(({ key }) => {
                      const isAtLimit = student.limitReached.includes(key);

                      return (
                        <td
                          key={key}
                          className={cn(TD_CLASS, isAtLimit && 'font-semibold text-red-600')}
                          title={isAtLimit ? 'Daily limit reached' : undefined}
                        >
                          {student.counts[key]}/{usage.limits[key]}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
