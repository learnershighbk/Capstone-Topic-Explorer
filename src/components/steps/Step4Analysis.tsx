'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Copy, Check, Search, ArrowLeft, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader } from '@/components/common/Loader';
import { ImportantNotice } from '@/components/common/ImportantNotice';
import { useAuth, LoginModal } from '@/features/capstone-auth';
import { formatAnalysisAsText } from '@/features/explorer/lib/format-analysis-text';
import type {
  PolicyIssue,
  Topic,
  AnalysisData,
  VerifiedDataSource,
  VerifiedReference,
} from '@/types';

interface Step4AnalysisProps {
  country: string;
  interest: string;
  selectedIssue: PolicyIssue;
  selectedTopic: Topic;
  analysis: AnalysisData;
  verifiedDataSources: VerifiedDataSource[];
  verifiedReferences: VerifiedReference[];
  unverifiedDataSources: string[];
  unverifiedReferences: string[];
  isVerifying: boolean;
  onSave: () => Promise<void>;
  onBack: () => void;
  onReset: () => void;
  isSaving: boolean;
}

export function Step4Analysis({
  country,
  interest,
  selectedIssue,
  selectedTopic,
  analysis,
  verifiedDataSources,
  verifiedReferences,
  unverifiedDataSources,
  unverifiedReferences,
  isVerifying,
  onSave,
  onBack,
  onReset,
  isSaving,
}: Step4AnalysisProps) {
  const { isLoggedIn } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSavingRef = useRef(false);

  const handleCopyToClipboard = useCallback(async () => {
    const text = formatAnalysisAsText({
      topicTitle: selectedTopic.title,
      country,
      issue: selectedIssue.issue,
      interest,
      analysis,
      verifiedDataSources,
      verifiedReferences,
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [country, interest, selectedIssue, selectedTopic, analysis, verifiedDataSources, verifiedReferences]);

  const handleSave = async () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isSavingRef.current || saveSuccess) return;
    isSavingRef.current = true;
    try {
      await onSave();
      setSaveSuccess(true);
    } finally {
      isSavingRef.current = false;
    }
  };

  const googleScholarUrl = (query: string) =>
    `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
  const perplexityUrl = (query: string) =>
    `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`;
  const geminiUrl = (query: string) =>
    `https://gemini.google.com/app?q=${encodeURIComponent(query)}`;
  const chatgptUrl = (query: string) =>
    `https://chat.openai.com/?q=${encodeURIComponent(query)}`;
  const claudeUrl = (query: string) =>
    `https://claude.ai/new?q=${encodeURIComponent(query)}`;

  const researchQuery = `${selectedTopic.title} ${country} research`;

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8 pb-28">
        {/* Topic Banner */}
        <div className="bg-[#615EEB] text-white p-4 rounded-lg mb-6">
          <h3 className="text-xl font-bold">{selectedTopic.title}</h3>
          <p className="text-white/80 text-sm mt-1">
            {country} | {selectedIssue.issue}
          </p>
        </div>

        {/* Rationale (always visible) */}
        <section className="mb-6">
          <h4 className="text-xl font-semibold border-b pb-2 mb-3">Rationale</h4>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-[#615EEB]">Relevance</h5>
              <p className="text-gray-700">{analysis.rationale.relevance}</p>
            </div>
            <div>
              <h5 className="font-medium text-green-600">Feasibility</h5>
              <p className="text-gray-700">{analysis.rationale.feasibility}</p>
            </div>
            <div>
              <h5 className="font-medium text-purple-600">Impact</h5>
              <p className="text-gray-700">{analysis.rationale.impact}</p>
            </div>
          </div>
        </section>

        {/* Save Success Notice */}
        {saveSuccess && (
          <div className="mb-6">
            <ImportantNotice type="success">
              <p>
                <strong>Success!</strong> Your analysis has been saved.{' '}
                <Link
                  href="/my-page"
                  className="underline font-semibold hover:opacity-80"
                >
                  View on My Page
                </Link>
              </p>
            </ImportantNotice>
          </div>
        )}

        {/* Accordion Sections */}
        <Accordion
          type="multiple"
          defaultValue={['policy-questions', 'data-sources', 'references']}
          className="w-full"
        >
          {/* Key Policy Questions */}
          <AccordionItem value="policy-questions">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Key Policy Questions
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {analysis.policy_questions.map((question, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#615EEB] font-bold">{i + 1}.</span>
                    <div className="flex-1">
                      <span className="text-gray-700">{question}</span>
                      <a
                        href={googleScholarUrl(question)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-[#615EEB] hover:underline text-sm"
                      >
                        [Search Scholar]
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Recommended Methodologies */}
          <AccordionItem value="methodologies">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              Recommended Methodologies
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {analysis.methodologies.map((m, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-gray-800">{m.methodology}</h5>
                    <p className="text-gray-600 text-sm mt-1">{m.explanation}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Potential Data Sources */}
          <AccordionItem value="data-sources">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <span className="flex items-center gap-2">
                Potential Data Sources
                {isVerifying && (
                  <span className="text-sm font-normal text-gray-500">
                    (Verifying...)
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {isVerifying ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader size="sm" />
                  <span className="text-gray-500">Verifying data sources...</span>
                </div>
              ) : (
                <>
                  {verifiedDataSources.length > 0 && (
                    <ul className="space-y-3 mb-4">
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
                              className="font-medium text-[#615EEB] hover:underline"
                            >
                              {source.name}
                            </a>
                            <p className="text-sm text-gray-600">
                              {source.description}
                            </p>
                            <span className="text-xs text-gray-400">
                              {source.source_type} | Verified
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Key References */}
          <AccordionItem value="references">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <span className="flex items-center gap-2">
                Key References
                {isVerifying && (
                  <span className="text-sm font-normal text-gray-500">
                    (Verifying...)
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {isVerifying ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader size="sm" />
                  <span className="text-gray-500">Verifying references...</span>
                </div>
              ) : (
                <>
                  {verifiedReferences.length > 0 && (
                    <ul className="space-y-3 mb-4">
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
                                className="font-medium text-[#615EEB] hover:underline"
                              >
                                {ref.title}
                              </a>
                            ) : (
                              <span className="font-medium text-gray-800">
                                {ref.title}
                              </span>
                            )}
                            {ref.authors.length > 0 && (
                              <p className="text-sm text-gray-600">
                                {ref.authors.join(', ')} ({ref.year})
                              </p>
                            )}
                            <span className="text-xs text-gray-400">
                              {ref.source} | Verified
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* External Research Links */}
          <AccordionItem value="external-links">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              External Research Links
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
                <a
                  href={googleScholarUrl(researchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-center text-base bg-[#615EEB]/10 text-[#615EEB] rounded-lg hover:bg-[#615EEB]/20 transition"
                >
                  Google Scholar
                </a>
                <a
                  href={perplexityUrl(researchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-center text-base bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                >
                  Perplexity AI
                </a>
                <a
                  href={geminiUrl(researchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-center text-base bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                >
                  Gemini
                </a>
                <a
                  href={chatgptUrl(researchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-center text-base bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition"
                >
                  ChatGPT
                </a>
                <a
                  href={claudeUrl(researchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-center text-base bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                >
                  Claude
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex items-center gap-1.5 text-[#615EEB] border-[#615EEB] hover:bg-[#615EEB]/5"
            >
              <RotateCcw className="h-4 w-4" />
              New Research
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              className="flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            {!saveSuccess && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || isVerifying}
                className="flex items-center gap-1.5 bg-[#615EEB] hover:bg-[#5250d9] text-white"
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isLoggedIn ? 'Save' : 'Login to Save'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
