'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, ProgressBar } from '@/components/common';
import { Step1Scope, Step2Issues, Step3Topics, Step4Analysis } from '@/components/steps';
import { AnalysisProgressLoader } from '@/components/common/AnalysisProgressLoader';
import { useAuth } from '@/features/capstone-auth';
import { useStepStore } from '@/features/explorer/stores/use-step-store';
import { apiClient, isAxiosError } from '@/lib/remote/api-client';
import { toast } from '@/hooks/use-toast';
import type {
  PolicyIssue,
  Topic,
  AnalysisData,
  VerifiedDataSource,
  VerifiedReference,
} from '@/types';

type AnalysisPhase = 'generating' | 'verifying-sources' | 'done';

function getErrorToast(error: unknown) {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 429) {
      return {
        title: 'Too Many Requests',
        description: 'Please wait a moment and try again.',
        variant: 'destructive' as const,
      };
    }
    if (status && status >= 500) {
      return {
        title: 'Server Error',
        description: 'A server error occurred. Please try again later.',
        variant: 'destructive' as const,
      };
    }
  }
  if (error instanceof Error && error.message === 'Network Error') {
    return {
      title: 'Network Error',
      description: 'Please check your internet connection.',
      variant: 'destructive' as const,
    };
  }
  return {
    title: 'Error',
    description: 'An error occurred. Please try again.',
    variant: 'destructive' as const,
  };
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
        setUnverifiedReferences(data.key_references);
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
      });
    } catch (error) {
      console.error('Failed to save analysis:', error);
      toast(getErrorToast(error));
    } finally {
      setIsSaving(false);
    }
  }, [country, interest, selectedIssue, selectedTopic, analysis, verifiedDataSources, verifiedReferences]);

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
      <div className="min-h-screen bg-white">
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
      <div className="min-h-screen bg-gray-100">
        <Header />
        <AnalysisProgressLoader phase={analysisPhase} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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
