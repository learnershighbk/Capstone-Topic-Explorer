'use client';

import { useState, useCallback } from 'react';
import { Header, ProgressBar, FullPageLoader } from '@/components/common';
import { Step1Scope, Step2Issues, Step3Topics, Step4Analysis } from '@/components/steps';
import { useAuth } from '@/features/capstone-auth';
import { apiClient } from '@/lib/remote/api-client';
import type {
  PolicyIssue,
  Topic,
  AnalysisData,
  VerifiedDataSource,
  VerifiedReference,
} from '@/types';

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [country, setCountry] = useState('');
  const [interest, setInterest] = useState('');
  const [issues, setIssues] = useState<PolicyIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<PolicyIssue | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  // Verified data
  const [verifiedDataSources, setVerifiedDataSources] = useState<VerifiedDataSource[]>([]);
  const [verifiedReferences, setVerifiedReferences] = useState<VerifiedReference[]>([]);
  const [unverifiedDataSources, setUnverifiedDataSources] = useState<string[]>([]);
  const [unverifiedReferences, setUnverifiedReferences] = useState<string[]>([]);

  // Loading states
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      alert('Failed to generate policy issues. Please try again.');
    } finally {
      setIsLoadingIssues(false);
    }
  }, [country, interest]);

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
      alert('Failed to generate topics. Please try again.');
    } finally {
      setIsLoadingTopics(false);
    }
  }, [country, selectedIssue]);

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
      setTopics((prev) => [...prev, ...data.topics]);
    } catch (error) {
      console.error('Failed to generate more topics:', error);
      alert('Failed to generate more topics. Please try again.');
    } finally {
      setIsGeneratingMore(false);
    }
  }, [country, selectedIssue, topics]);

  // Step 3 -> Step 4: Generate analysis
  const handleGenerateAnalysis = useCallback(async () => {
    if (!selectedIssue || !selectedTopic) return;

    setIsLoadingAnalysis(true);
    try {
      const { data } = await apiClient.post<AnalysisData>('/api/openai/analysis', {
        country,
        issue: selectedIssue.issue,
        topicTitle: selectedTopic.title,
      });
      setAnalysis(data);
      setCurrentStep(4);

      // Start verification after analysis is loaded
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
        // If verification fails, show AI suggestions as unverified
        setUnverifiedDataSources(data.data_sources);
        setUnverifiedReferences(data.key_references);
      } finally {
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      alert('Failed to generate analysis. Please try again.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [country, selectedIssue, selectedTopic]);

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
      alert('Failed to save analysis. Please try again.');
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
  ]);

  // Reset all state
  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setCountry('');
    setInterest('');
    setIssues([]);
    setSelectedIssue(null);
    setTopics([]);
    setSelectedTopic(null);
    setAnalysis(null);
    setVerifiedDataSources([]);
    setVerifiedReferences([]);
    setUnverifiedDataSources([]);
    setUnverifiedReferences([]);
  }, []);

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
    setCurrentStep(3);
    setAnalysis(null);
  };

  // Loading overlay
  if (isLoadingAnalysis) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <FullPageLoader text="Generating detailed analysis..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Capstone Project Topic Explorer
          </h1>
          <p className="text-gray-600">
            AI-powered research topic discovery for GKS scholars
          </p>
        </div>

        <ProgressBar currentStep={currentStep} />

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

      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Capstone Topic Explorer - Powered by OpenAI GPT-4o</p>
        <p className="mt-1">Designed for GKS Scholars</p>
      </footer>
    </div>
  );
}
