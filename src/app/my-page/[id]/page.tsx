'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Loader } from '@/components/common/Loader';
import { ImportantNotice } from '@/components/common/ImportantNotice';
import { Button } from '@/components/ui/button';
import { useAuth, LoginModal } from '@/features/capstone-auth';
import { apiClient } from '@/lib/remote/api-client';
import type { SavedAnalysis, VerifiedDataSource, VerifiedReference } from '@/types';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get<SavedAnalysis>(`/api/saved-topics/${id}`);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
      setError('Failed to load analysis. It may not exist or you may not have access.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setIsLoading(false);
      return;
    }

    if (isLoggedIn && id) {
      fetchAnalysis();
    }
  }, [isLoggedIn, authLoading, id, fetchAnalysis]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/saved-topics/${id}`);
      router.push('/my-page');
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      alert('Failed to delete analysis. Please try again.');
    }
  };

  const googleScholarUrl = (query: string) =>
    `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader size="lg" text="Loading analysis..." />
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
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Analysis Detail
            </h1>
            <p className="text-gray-600 mb-6">
              Please login to view this analysis.
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

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <ImportantNotice type="error">
            <p>{error || 'Analysis not found.'}</p>
          </ImportantNotice>
          <Link href="/my-page" className="inline-block mt-4">
            <Button variant="outline">Back to My Page</Button>
          </Link>
        </main>
      </div>
    );
  }

  const verifiedDataSources = (analysis.verified_data_sources || []) as VerifiedDataSource[];
  const verifiedReferences = (analysis.verified_references || []) as VerifiedReference[];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/my-page">
            <Button variant="outline">Back to My Page</Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            Delete Analysis
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* Topic Title */}
          <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
            <h1 className="text-xl font-bold">{analysis.topic_title}</h1>
            <p className="text-blue-100 text-sm mt-1">
              {analysis.country} | {analysis.selected_issue}
            </p>
            <p className="text-blue-200 text-xs mt-2">
              Saved on {format(new Date(analysis.created_at), 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Interest */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-1">Area of Interest</h4>
            <p className="text-gray-600">{analysis.interest}</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Importance Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {analysis.issue_importance_score?.toFixed(1) || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Frequency Score</p>
              <p className="text-2xl font-bold text-green-600">
                {analysis.issue_frequency_score?.toFixed(1) || 'N/A'}
              </p>
            </div>
          </div>

          {/* Rationale */}
          <section className="mb-6">
            <h4 className="text-xl font-semibold border-b pb-2 mb-3">
              Rationale
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-blue-600">Relevance</h5>
                <p className="text-gray-700">
                  {analysis.analysis_data.rationale.relevance}
                </p>
              </div>
              <div>
                <h5 className="font-medium text-green-600">Feasibility</h5>
                <p className="text-gray-700">
                  {analysis.analysis_data.rationale.feasibility}
                </p>
              </div>
              <div>
                <h5 className="font-medium text-purple-600">Impact</h5>
                <p className="text-gray-700">
                  {analysis.analysis_data.rationale.impact}
                </p>
              </div>
            </div>
          </section>

          {/* Key Policy Questions */}
          <section className="mb-6">
            <h4 className="text-xl font-semibold border-b pb-2 mb-3">
              Key Policy Questions
            </h4>
            <ul className="space-y-2">
              {analysis.analysis_data.policy_questions.map((question, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">{i + 1}.</span>
                  <div className="flex-1">
                    <span className="text-gray-700">{question}</span>
                    <a
                      href={googleScholarUrl(question)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-500 hover:underline text-sm"
                    >
                      [Search Scholar]
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Methodologies */}
          <section className="mb-6">
            <h4 className="text-xl font-semibold border-b pb-2 mb-3">
              Recommended Methodologies
            </h4>
            <div className="space-y-3">
              {analysis.analysis_data.methodologies.map((m, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-medium text-gray-800">{m.methodology}</h5>
                  <p className="text-gray-600 text-sm mt-1">{m.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Verified Data Sources */}
          <section className="mb-6">
            <h4 className="text-xl font-semibold border-b pb-2 mb-3">
              Verified Data Sources
            </h4>
            {verifiedDataSources.length > 0 ? (
              <ul className="space-y-3">
                {verifiedDataSources.map((source, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 p-3 bg-green-50 rounded-lg"
                  >
                    <span className="text-green-500 mt-1">&#10003;</span>
                    <div className="flex-1">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {source.name}
                      </a>
                      <p className="text-sm text-gray-600">
                        {source.description}
                      </p>
                      <span className="text-xs text-gray-400">
                        {source.source_type}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                No verified data sources available.
              </p>
            )}
          </section>

          {/* Verified References */}
          <section className="mb-6">
            <h4 className="text-xl font-semibold border-b pb-2 mb-3">
              Verified References
            </h4>
            {verifiedReferences.length > 0 ? (
              <ul className="space-y-3">
                {verifiedReferences.map((ref, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 p-3 bg-green-50 rounded-lg"
                  >
                    <span className="text-green-500 mt-1">&#10003;</span>
                    <div className="flex-1">
                      {ref.url ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {ref.title}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-800">
                          {ref.title}
                        </span>
                      )}
                      {ref.authors && ref.authors.length > 0 && (
                        <p className="text-sm text-gray-600">
                          {ref.authors.join(', ')} ({ref.year})
                        </p>
                      )}
                      <span className="text-xs text-gray-400">{ref.source}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                No verified references available.
              </p>
            )}
          </section>

          {/* External Links */}
          <section className="mb-6">
            <h4 className="text-xl font-semibold border-b pb-2 mb-3">
              External Research Links
            </h4>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://scholar.google.com/scholar?q=${encodeURIComponent(analysis.topic_title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                Google Scholar
              </a>
              <a
                href={`https://www.perplexity.ai/search?q=${encodeURIComponent(analysis.topic_title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
              >
                Perplexity AI
              </a>
              <a
                href={`https://gemini.google.com/app?q=${encodeURIComponent(analysis.topic_title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                Gemini
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
