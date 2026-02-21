'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  PolicyIssue,
  Topic,
  AnalysisData,
  VerifiedDataSource,
  VerifiedReference,
} from '@/types';

interface CachedAnalysis {
  analysis: AnalysisData;
  verifiedDataSources: VerifiedDataSource[];
  verifiedReferences: VerifiedReference[];
  unverifiedDataSources: string[];
  unverifiedReferences: string[];
}

interface StepStoreState {
  currentStep: number;
  showHero: boolean;
  country: string;
  interest: string;
  issues: PolicyIssue[];
  selectedIssue: PolicyIssue | null;
  topics: Topic[];
  selectedTopic: Topic | null;
  analysis: AnalysisData | null;
  verifiedDataSources: VerifiedDataSource[];
  verifiedReferences: VerifiedReference[];
  unverifiedDataSources: string[];
  unverifiedReferences: string[];
  analysisCache: Record<string, CachedAnalysis>;
}

interface StepStoreActions {
  setCurrentStep: (step: number) => void;
  setShowHero: (show: boolean) => void;
  setCountry: (country: string) => void;
  setInterest: (interest: string) => void;
  setIssues: (issues: PolicyIssue[]) => void;
  setSelectedIssue: (issue: PolicyIssue | null) => void;
  setTopics: (topics: Topic[]) => void;
  addTopics: (newTopics: Topic[]) => void;
  setSelectedTopic: (topic: Topic | null) => void;
  setAnalysis: (analysis: AnalysisData | null) => void;
  setVerifiedDataSources: (sources: VerifiedDataSource[]) => void;
  setVerifiedReferences: (refs: VerifiedReference[]) => void;
  setUnverifiedDataSources: (sources: string[]) => void;
  setUnverifiedReferences: (refs: string[]) => void;
  cacheAnalysis: (topicTitle: string) => void;
  getCachedAnalysis: (topicTitle: string) => CachedAnalysis | null;
  resetAll: () => void;
}

type StepStore = StepStoreState & StepStoreActions;

const initialState: StepStoreState = {
  currentStep: 1,
  showHero: true,
  country: '',
  interest: '',
  issues: [],
  selectedIssue: null,
  topics: [],
  selectedTopic: null,
  analysis: null,
  verifiedDataSources: [],
  verifiedReferences: [],
  unverifiedDataSources: [],
  unverifiedReferences: [],
  analysisCache: {},
};

export const useStepStore = create<StepStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),
      setShowHero: (show) => set({ showHero: show }),
      setCountry: (country) => set({ country }),
      setInterest: (interest) => set({ interest }),
      setIssues: (issues) => set({ issues }),
      setSelectedIssue: (issue) => set({ selectedIssue: issue }),
      setTopics: (topics) => set({ topics }),
      addTopics: (newTopics) =>
        set((state) => ({ topics: [...state.topics, ...newTopics] })),
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      setAnalysis: (analysis) => set({ analysis }),
      setVerifiedDataSources: (sources) => set({ verifiedDataSources: sources }),
      setVerifiedReferences: (refs) => set({ verifiedReferences: refs }),
      setUnverifiedDataSources: (sources) => set({ unverifiedDataSources: sources }),
      setUnverifiedReferences: (refs) => set({ unverifiedReferences: refs }),
      cacheAnalysis: (topicTitle) => {
        const state = get();
        if (!state.analysis) return;
        set((s) => ({
          analysisCache: {
            ...s.analysisCache,
            [topicTitle]: {
              analysis: state.analysis!,
              verifiedDataSources: state.verifiedDataSources,
              verifiedReferences: state.verifiedReferences,
              unverifiedDataSources: state.unverifiedDataSources,
              unverifiedReferences: state.unverifiedReferences,
            },
          },
        }));
      },
      getCachedAnalysis: (topicTitle) => {
        return get().analysisCache[topicTitle] ?? null;
      },
      resetAll: () => set(initialState),
    }),
    {
      name: 'capstone-step-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
