'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/common/Loader';
import { ImportantNotice } from '@/components/common/ImportantNotice';
import { useAuth, LoginModal } from '@/features/capstone-auth';
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

  const handleSave = async () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    await onSave();
    setSaveSuccess(true);
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
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Step 4: Detailed Topic Analysis
      </h2>

      {/* Topic Title */}
      <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold">{selectedTopic.title}</h3>
        <p className="text-blue-100 text-sm mt-1">
          {country} | {selectedIssue.issue}
        </p>
      </div>

      {/* Rationale */}
      <section className="mb-6">
        <h4 className="text-xl font-semibold border-b pb-2 mb-3">Rationale</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-blue-600">Relevance</h5>
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

      {/* Key Policy Questions */}
      <section className="mb-6">
        <h4 className="text-xl font-semibold border-b pb-2 mb-3">
          Key Policy Questions
        </h4>
        <ul className="space-y-2">
          {analysis.policy_questions.map((question, i) => (
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

      {/* Recommended Methodologies */}
      <section className="mb-6">
        <h4 className="text-xl font-semibold border-b pb-2 mb-3">
          Recommended Methodologies
        </h4>
        <div className="space-y-3">
          {analysis.methodologies.map((m, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-medium text-gray-800">{m.methodology}</h5>
              <p className="text-gray-600 text-sm mt-1">{m.explanation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Potential Data Sources */}
      <section className="mb-6">
        <h4 className="text-xl font-semibold border-b pb-2 mb-3 flex items-center gap-2">
          Potential Data Sources
          {isVerifying && (
            <span className="text-sm font-normal text-gray-500">
              (Verifying...)
            </span>
          )}
        </h4>

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
                        className="font-medium text-blue-600 hover:underline"
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

            {unverifiedDataSources.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700 font-medium mb-2">
                  AI Suggestions (Not Verified - Use with Caution)
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {unverifiedDataSources.map((s, i) => (
                    <li key={i}>&#8226; {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* Key References */}
      <section className="mb-6">
        <h4 className="text-xl font-semibold border-b pb-2 mb-3 flex items-center gap-2">
          Key References
          {isVerifying && (
            <span className="text-sm font-normal text-gray-500">
              (Verifying...)
            </span>
          )}
        </h4>

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
                          className="font-medium text-blue-600 hover:underline"
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

            {unverifiedReferences.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700 font-medium mb-2">
                  AI Suggestions (Not Verified - Use with Caution)
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {unverifiedReferences.map((r, i) => (
                    <li key={i}>&#8226; {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* External Links */}
      <section className="mb-6">
        <h4 className="text-xl font-semibold border-b pb-2 mb-3">
          External Research Links
        </h4>
        <div className="flex flex-wrap gap-3">
          <a
            href={googleScholarUrl(researchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
          >
            Google Scholar
          </a>
          <a
            href={perplexityUrl(researchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          >
            Perplexity AI
          </a>
          <a
            href={geminiUrl(researchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
          >
            Gemini
          </a>
          <a
            href={chatgptUrl(researchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition"
          >
            ChatGPT
          </a>
          <a
            href={claudeUrl(researchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
          >
            Claude
          </a>
        </div>
      </section>

      {/* Save Button */}
      {saveSuccess ? (
        <ImportantNotice type="success">
          <p>
            <strong>Success!</strong> Your analysis has been saved to My Page.
          </p>
        </ImportantNotice>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-gray-600 mb-3">
            {isLoggedIn
              ? 'Save this analysis to your My Page for future reference.'
              : 'Login to save this analysis to your My Page.'}
          </p>
          <Button
            onClick={handleSave}
            disabled={isSaving || isVerifying}
            className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : isLoggedIn ? (
              'Save to My Page'
            ) : (
              'Login to Save'
            )}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Topics
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          Start New Research
        </Button>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
