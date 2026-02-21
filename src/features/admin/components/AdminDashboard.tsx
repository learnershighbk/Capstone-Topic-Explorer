'use client';

import { Users, FileText, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminStats, useAdminUsers, useAdminAnalyses } from '../hooks/useAdminData';
import { downloadCsv } from '../lib/csv-download';

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#615EEB]/10">
          <Icon className="h-5 w-5 text-[#615EEB]" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          {isLoading ? (
            <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() ?? 0}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
}

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: analyses, isLoading: analysesLoading } = useAdminAnalyses();

  const handleDownloadUsers = () => {
    if (!users) return;
    const headers = ['Student ID', 'Created At', 'Last Login At', 'Saved Analyses'];
    const rows = users.map((u) => [
      u.studentId,
      formatDateTime(u.createdAt),
      formatDateTime(u.lastLoginAt),
      String(u.savedAnalysesCount),
    ]);
    downloadCsv(headers, rows, `users_${format(new Date(), 'yyyyMMdd')}.csv`);
  };

  const handleDownloadAnalyses = () => {
    if (!analyses) return;
    const headers = ['Student ID', 'Country', 'Interest', 'Topic Title', 'Created At'];
    const rows = analyses.map((a) => [
      a.studentId,
      a.country,
      a.interest,
      a.topicTitle,
      formatDateTime(a.createdAt),
    ]);
    downloadCsv(headers, rows, `analyses_${format(new Date(), 'yyyyMMdd')}.csv`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} isLoading={statsLoading} />
        <StatCard icon={FileText} label="Total Analyses" value={stats?.totalAnalyses} isLoading={statsLoading} />
        <StatCard icon={LogIn} label="Today Logins" value={stats?.todayLoginCount} isLoading={statsLoading} />
      </div>

      {/* Users Table */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <button
            onClick={handleDownloadUsers}
            disabled={!users || users.length === 0}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            CSV Download
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Student ID</th>
                <th className="px-4 py-3 font-medium text-gray-600">Created At</th>
                <th className="px-4 py-3 font-medium text-gray-600">Last Login</th>
                <th className="px-4 py-3 font-medium text-gray-600">Saved Analyses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.studentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.studentId}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(user.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(user.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{user.savedAnalysesCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Analyses Table */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Analyses</h2>
          <button
            onClick={handleDownloadAnalyses}
            disabled={!analyses || analyses.length === 0}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            CSV Download
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Student ID</th>
                <th className="px-4 py-3 font-medium text-gray-600">Country</th>
                <th className="px-4 py-3 font-medium text-gray-600">Interest</th>
                <th className="px-4 py-3 font-medium text-gray-600">Topic Title</th>
                <th className="px-4 py-3 font-medium text-gray-600">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analysesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              ) : analyses && analyses.length > 0 ? (
                analyses.map((analysis, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{analysis.studentId}</td>
                    <td className="px-4 py-3 text-gray-600">{analysis.country}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-600" title={analysis.interest}>
                      {analysis.interest}
                    </td>
                    <td className="max-w-[300px] truncate px-4 py-3 text-gray-600" title={analysis.topicTitle}>
                      {analysis.topicTitle}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(analysis.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No analyses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
