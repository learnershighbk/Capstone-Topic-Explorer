'use client';

import { Button } from '@/components/ui/button';
import type { PolicyIssue } from '@/types';

interface Step2IssuesProps {
  country: string;
  interest: string;
  issues: PolicyIssue[];
  selectedIssue: PolicyIssue | null;
  onSelectIssue: (issue: PolicyIssue) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function Step2Issues({
  country,
  interest,
  issues,
  selectedIssue,
  onSelectIssue,
  onNext,
  onBack,
  isLoading,
}: Step2IssuesProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <p className="text-gray-600 mb-4">
        Based on <span className="font-semibold">{country}</span> and your
        interest in <span className="font-semibold">{interest}</span>
      </p>

      <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-base text-gray-700">
        Select one policy issue to explore further. Each issue is scored on a 1-10 scale for{' '}
        <strong>Importance</strong> (policy significance) and{' '}
        <strong>Frequency</strong> (current discourse prevalence).
      </div>

      <div className="space-y-3 mb-6">
        {issues.map((issue, index) => (
          <div
            key={index}
            onClick={() => onSelectIssue(issue)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedIssue?.issue === issue.issue
                ? 'border-[#615EEB] bg-[#615EEB]/5'
                : 'border-gray-200 hover:border-[#615EEB]/40 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      selectedIssue?.issue === issue.issue
                        ? 'bg-[#615EEB] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <h3 className="font-medium text-gray-800">{issue.issue}</h3>
                </div>
                {issue.description && (
                  <p className="text-sm text-gray-500 mt-1 ml-8">{issue.description}</p>
                )}
              </div>
              <div className="flex gap-4 text-sm shrink-0 ml-8 md:ml-0 pt-1 md:pt-0 border-t md:border-t-0 border-gray-100">
                <div className="text-center">
                  <div className="text-gray-500 text-sm">Importance</div>
                  <div className="font-bold text-[#615EEB]">
                    {issue.importance_score.toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-sm">Frequency</div>
                  <div className="font-bold text-green-600">
                    {issue.frequency_score.toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-sm">Total</div>
                  <div className="font-bold text-purple-600">
                    {issue.total_score.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedIssue || isLoading}
          className="bg-[#615EEB] hover:bg-[#5250d9] text-white px-8"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Topics...
            </span>
          ) : (
            'Generate Topics'
          )}
        </Button>
      </div>
    </div>
  );
}
