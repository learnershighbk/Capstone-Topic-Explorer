'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, ProgressBar } from '@/components/common';
import { Step1Scope, Step2Issues, Step3Topics, Step4Analysis } from '@/components/steps';
import { AnalysisProgressLoader } from '@/components/common/AnalysisProgressLoader';
import { useAuth } from '@/features/capstone-auth';
import { useStepStore } from '@/features/explorer/stores/use-step-store';
import { match, P } from 'ts-pattern';
import { apiClient, isAxiosError, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  OPENAI_ERROR_CODES,
  type AiEndpoint,
  type DailyLimitDetails,
} from '@/features/openai/lib/dto';
import { toast } from '@/hooks/use-toast';
import { formatCitation } from '@/lib/citation';
import type {
  PolicyIssue,
  Topic,
  AnalysisData,
  VerifiedDataSource,
  VerifiedReference,
} from '@/types';

type AnalysisPhase = 'generating' | 'verifying-sources' | 'done';

const DESTRUCTIVE = 'destructive' as const;

const AI_ENDPOINT_LABELS: Record<AiEndpoint, string> = {
  issues: '정책 이슈 생성',
  topics: '연구 주제 생성',
  analysis: '주제 분석',
  search: '자료 검증',
};

type ApiErrorPayload = { error?: { code?: string; details?: unknown } };

const getApiErrorPayload = (error: unknown) =>
  isAxiosError(error) ? (error.response?.data as ApiErrorPayload | undefined)?.error : undefined;

const getApiErrorCode = (error: unknown) => getApiErrorPayload(error)?.code;

const describeDailyLimit = (error: unknown) => {
  const details = getApiErrorPayload(error)?.details as Partial<DailyLimitDetails> | undefined;
  const label = details?.endpoint ? AI_ENDPOINT_LABELS[details.endpoint] : 'AI 기능';
  const limitText = details?.limit ? `(${details.limit}회)` : '';

  return `오늘의 ${label} 사용 한도${limitText}를 모두 사용했습니다. 한국 시간 자정 이후 다시 이용해 주세요.`;
};

function getErrorToast(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const code = getApiErrorCode(error);

  return match({ status, code })
    .with({ code: OPENAI_ERROR_CODES.QUOTA_EXCEEDED }, () => ({
      title: 'Service Unavailable',
      description: 'AI 서비스 사용량이 소진되었습니다. 관리자에게 문의해 주세요.',
      variant: DESTRUCTIVE,
    }))
    .with({ code: OPENAI_ERROR_CODES.DAILY_LIMIT_EXCEEDED }, () => ({
      title: 'Daily Limit Reached',
      description: describeDailyLimit(error),
      variant: DESTRUCTIVE,
    }))
    .with({ code: OPENAI_ERROR_CODES.USAGE_TRACKING_ERROR }, () => ({
      title: 'Service Unavailable',
      description: '일시적으로 사용량을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      variant: DESTRUCTIVE,
    }))
    .with({ status: 401 }, () => ({
      title: 'Session Expired',
      description: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
      variant: DESTRUCTIVE,
    }))
    .with({ code: OPENAI_ERROR_CODES.CONTENT_REFUSED }, () => ({
      title: 'Request Declined',
      description: extractApiErrorMessage(error, 'Please rephrase your input and try again.'),
      variant: DESTRUCTIVE,
    }))
    .with({ status: 429 }, () => ({
      title: 'Too Many Requests',
      description: extractApiErrorMessage(error, 'Please wait a moment and try again.'),
      variant: DESTRUCTIVE,
    }))
    .with({ status: P.number.gte(500) }, () => ({
      title: 'Server Error',
      description: extractApiErrorMessage(
        error,
        'A server error occurred. Please try again later.'
      ),
      variant: DESTRUCTIVE,
    }))
    .when(
      () => error instanceof Error && error.message === 'Network Error',
      () => ({
        title: 'Network Error',
        description: 'Please check your internet connection.',
        variant: DESTRUCTIVE,
      })
    )
    .otherwise(() => ({
      title: 'Error',
      description: 'An error occurred. Please try again.',
      variant: DESTRUCTIVE,
    }));
}

export default function ExplorePage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isAuthLoading, isLoggedIn, router]);

  const {
    currentStep,
    setCurrentStep,
    country,
    setCountry,
    interest,
    setInterest,
    issues,
    setIssues,
    selectedIssue,
    setSelectedIssue,
    topics,
    setTopics,
    addTopics,
    selectedTopic,
    setSelectedTopic,
    analysis,
    setAnalysis,
    verifiedDataSources,
    setVerifiedDataSources,
    verifiedReferences,
    setVerifiedReferences,
    unverifiedDataSources,
    setUnverifiedDataSources,
    unverifiedReferences,
    setUnverifiedReferences,
    resetAll,
    cacheAnalysis,
    getCachedAnalysis,
  } = useStepStore();

  // Transient loading states (not persisted)
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('done');

  // Step 1 -> Step 2: Generate issues
  const handleGenerateIssues = useCallback(async () => {
    setIsLoadingIssues(true);
    try {
      const { data } = await apiClient.post<{ policy_issues: PolicyIssue[] }>(
        '/api/openai/issues',
        { country, interest }
      );
      setIssues(data.policy_issues);
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to generate issues:', error);
      toast(getErrorToast(error));
    } finally {
      setIsLoadingIssues(false);
    }
  }, [country, interest, setIssues, setCurrentStep]);

  // Step 2 -> Step 3: Generate topics
  const handleGenerateTopics = useCallback(async () => {
    if (!selectedIssue) return;

    setIsLoadingTopics(true);
    try {
      const { data } = await apiClient.post<{ topics: Topic[] }>(
        '/api/openai/topics',
        { country, issue: selectedIssue.issue }
      );
      setTopics(data.topics);
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to generate topics:', error);
      toast(getErrorToast(error));
    } finally {
      setIsLoadingTopics(false);
    }
  }, [country, selectedIssue, setTopics, setCurrentStep]);

  // Generate more topics
  const handleGenerateMoreTopics = useCallback(async () => {
    if (!selectedIssue) return;

    setIsGeneratingMore(true);
    try {
      const existingTopics = topics.map((t) => t.title);
      const { data } = await apiClient.post<{ topics: Topic[] }>(
        '/api/openai/topics',
        { country, issue: selectedIssue.issue, existingTopics }
      );
      addTopics(data.topics);
    } catch (error) {
      console.error('Failed to generate more topics:', error);
      toast(getErrorToast(error));
    } finally {
      setIsGeneratingMore(false);
    }
  }, [country, selectedIssue, topics, addTopics]);

  // Step 3 -> Step 4: Generate analysis
  const handleGenerateAnalysis = useCallback(async () => {
    if (!selectedIssue || !selectedTopic) return;

    // Check cache first
    const cached = getCachedAnalysis(selectedTopic.title);
    if (cached) {
      setAnalysis(cached.analysis);
      setVerifiedDataSources(cached.verifiedDataSources);
      setVerifiedReferences(cached.verifiedReferences);
      setUnverifiedDataSources(cached.unverifiedDataSources);
      setUnverifiedReferences(cached.unverifiedReferences);
      setCurrentStep(4);
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysisPhase('generating');
    try {
      const { data } = await apiClient.post<AnalysisData>('/api/openai/analysis', {
        country,
        issue: selectedIssue.issue,
        topicTitle: selectedTopic.title,
      });
      setAnalysis(data);
      setCurrentStep(4);

      // Start verification after analysis is loaded
      setAnalysisPhase('verifying-sources');
      setIsVerifying(true);
      try {
        const [dataSourcesRes, referencesRes] = await Promise.all([
          apiClient.post<{
            verified_sources: VerifiedDataSource[];
            unverified_suggestions: string[];
          }>('/api/search/data-sources', {
            country,
            topic: selectedTopic.title,
            aiSuggestions: data.data_sources,
          }),
          apiClient.post<{
            verified_references: VerifiedReference[];
            unverified_suggestions: string[];
          }>('/api/search/references', {
            country,
            topic: selectedTopic.title,
            aiSuggestions: data.key_references,
          }),
        ]);

        setVerifiedDataSources(dataSourcesRes.data.verified_sources);
        setUnverifiedDataSources(dataSourcesRes.data.unverified_suggestions);
        setVerifiedReferences(referencesRes.data.verified_references);
        setUnverifiedReferences(referencesRes.data.unverified_suggestions);
      } catch {
        setUnverifiedDataSources(data.data_sources);
        setUnverifiedReferences(data.key_references.map(formatCitation));
      } finally {
        setIsVerifying(false);
        setAnalysisPhase('done');
      }
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      toast(getErrorToast(error));
      setAnalysisPhase('done');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [
    country,
    selectedIssue,
    selectedTopic,
    getCachedAnalysis,
    setAnalysis,
    setCurrentStep,
    setVerifiedDataSources,
    setUnverifiedDataSources,
    setVerifiedReferences,
    setUnverifiedReferences,
  ]);

  // Save to My Page
  const handleSave = useCallback(async () => {
    if (!selectedIssue || !selectedTopic || !analysis) return;

    setIsSaving(true);
    try {
      await apiClient.post('/api/saved-topics', {
        country,
        interest,
        selected_issue: selectedIssue.issue,
        issue_importance_score: selectedIssue.importance_score,
        issue_frequency_score: selectedIssue.frequency_score,
        topic_title: selectedTopic.title,
        analysis_data: analysis,
        verified_data_sources: verifiedDataSources,
        verified_references: verifiedReferences,
        unverified_data_sources: unverifiedDataSources,
        unverified_references: unverifiedReferences,
      });
    } catch (error) {
      console.error('Failed to save analysis:', error);
      toast(getErrorToast(error));
    } finally {
      setIsSaving(false);
    }
  }, [
    country,
    interest,
    selectedIssue,
    selectedTopic,
    analysis,
    verifiedDataSources,
    verifiedReferences,
    unverifiedDataSources,
    unverifiedReferences,
  ]);

  // Reset all state
  const handleReset = useCallback(() => {
    resetAll();
  }, [resetAll]);

  // Go back handlers
  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setSelectedIssue(null);
  };

  const handleBackToStep2 = () => {
    setCurrentStep(2);
    setSelectedTopic(null);
  };

  const handleBackToStep3 = () => {
    if (selectedTopic && analysis) {
      cacheAnalysis(selectedTopic.title);
    }
    setCurrentStep(3);
    setAnalysis(null);
    setVerifiedDataSources([]);
    setVerifiedReferences([]);
    setUnverifiedDataSources([]);
    setUnverifiedReferences([]);
  };

  // ProgressBar step click handler
  const handleStepClick = useCallback((step: number) => {
    if (step >= currentStep) return;

    if (currentStep === 4 && selectedTopic && analysis) {
      cacheAnalysis(selectedTopic.title);
    }

    if (step === 1) {
      setCurrentStep(1);
      setSelectedIssue(null);
      setSelectedTopic(null);
      setAnalysis(null);
      setVerifiedDataSources([]);
      setVerifiedReferences([]);
      setUnverifiedDataSources([]);
      setUnverifiedReferences([]);
    } else if (step === 2) {
      setCurrentStep(2);
      setSelectedTopic(null);
      setAnalysis(null);
      setVerifiedDataSources([]);
      setVerifiedReferences([]);
      setUnverifiedDataSources([]);
      setUnverifiedReferences([]);
    } else if (step === 3) {
      setCurrentStep(3);
      setAnalysis(null);
      setVerifiedDataSources([]);
      setVerifiedReferences([]);
      setUnverifiedDataSources([]);
      setUnverifiedReferences([]);
    }
  }, [
    currentStep,
    selectedTopic,
    analysis,
    cacheAnalysis,
    setCurrentStep,
    setSelectedIssue,
    setSelectedTopic,
    setAnalysis,
    setVerifiedDataSources,
    setVerifiedReferences,
    setUnverifiedDataSources,
    setUnverifiedReferences,
  ]);

  // Show nothing while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <Header />
      </div>
    );
  }

  // Don't render content for unauthenticated users (redirect in progress)
  if (!isLoggedIn) {
    return null;
  }

  // Loading overlay with phase progress
  if (isLoadingAnalysis) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-background">
        <Header />
        <AnalysisProgressLoader phase={analysisPhase} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentStep === 1 && 'Define Your Project Scope'}
            {currentStep === 2 && 'Identify Key Policy Issues'}
            {currentStep === 3 && 'Choose Your Research Topic'}
            {currentStep === 4 && 'Analysis Results'}
          </h2>
          {currentStep === 1 && (
            <p className="text-gray-600">
              Select a country and describe your area of interest to get started
            </p>
          )}
        </div>

        <ProgressBar
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        {currentStep === 1 && (
          <Step1Scope
            country={country}
            interest={interest}
            onCountryChange={setCountry}
            onInterestChange={setInterest}
            onNext={handleGenerateIssues}
            isLoading={isLoadingIssues}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentStep === 2 && (
          <Step2Issues
            country={country}
            interest={interest}
            issues={issues}
            selectedIssue={selectedIssue}
            onSelectIssue={setSelectedIssue}
            onNext={handleGenerateTopics}
            onBack={handleBackToStep1}
            isLoading={isLoadingTopics}
          />
        )}

        {currentStep === 3 && selectedIssue && (
          <Step3Topics
            country={country}
            selectedIssue={selectedIssue}
            topics={topics}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            onGenerateMore={handleGenerateMoreTopics}
            onNext={handleGenerateAnalysis}
            onBack={handleBackToStep2}
            isLoading={isLoadingAnalysis}
            isGeneratingMore={isGeneratingMore}
          />
        )}

        {currentStep === 4 && selectedIssue && selectedTopic && analysis && (
          <Step4Analysis
            country={country}
            interest={interest}
            selectedIssue={selectedIssue}
            selectedTopic={selectedTopic}
            analysis={analysis}
            verifiedDataSources={verifiedDataSources}
            verifiedReferences={verifiedReferences}
            unverifiedDataSources={unverifiedDataSources}
            unverifiedReferences={unverifiedReferences}
            isVerifying={isVerifying}
            onSave={handleSave}
            onBack={handleBackToStep3}
            onReset={handleReset}
            isSaving={isSaving}
          />
        )}
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">Capstone Topic Explorer</p>
          <p className="mt-4">Contact: bklee@kdischool.ac.kr</p>
          <p className="mt-1">Designed by Learning Innovation Division at KDI School of Public Policy and Management</p>
        </div>
      </footer>
    </div>
  );
}
