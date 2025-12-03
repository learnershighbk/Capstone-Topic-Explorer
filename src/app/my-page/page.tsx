'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Loader } from '@/components/common/Loader';
import { ImportantNotice } from '@/components/common/ImportantNotice';
import { Button } from '@/components/ui/button';
import { useAuth, LoginModal } from '@/features/capstone-auth';
import { apiClient } from '@/lib/remote/api-client';
import type { SavedAnalysisSummary } from '@/types';
import { format } from 'date-fns';

interface SavedAnalysesResponse {
  items: SavedAnalysisSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MyPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [analyses, setAnalyses] = useState<SavedAnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setIsLoading(false);
      return;
    }

    if (isLoggedIn) {
      fetchAnalyses();
    }
  }, [isLoggedIn, authLoading]);

  const fetchAnalyses = async (page = 1) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<SavedAnalysesResponse>(
        `/api/saved-topics?page=${page}&limit=10`
      );
      setAnalyses(data.items);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/saved-topics/${id}`);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      alert('Failed to delete analysis. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader size="lg" text="Loading..." />
          </div>
        </main>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">My Page</h1>
            <p className="text-gray-600 mb-6">
              Please login to view your saved analyses.
            </p>
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Login
            </Button>
          </div>
        </main>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Page</h1>
          <Link href="/">
            <Button variant="outline">New Research</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" text="Loading saved analyses..." />
          </div>
        ) : analyses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ImportantNotice type="info">
              <p>
                You don&apos;t have any saved analyses yet. Start a new research to
                save your first analysis.
              </p>
            </ImportantNotice>
            <Link href="/" className="inline-block mt-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Start New Research
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {analysis.topic_title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {analysis.country}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          {analysis.selected_issue}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Interest: {analysis.interest}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Saved on{' '}
                        {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/my-page/${analysis.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(analysis.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => fetchAnalyses(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchAnalyses(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
