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
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Step 2: Identify Key Policy Issues
      </h2>
      <p className="text-gray-600 mb-6">
        Based on <span className="font-semibold">{country}</span> and your
        interest in <span className="font-semibold">{interest}</span>
      </p>

      <div className="mb-4 text-sm text-gray-500">
        Select one policy issue to explore further. Issues are ranked by
        importance and frequency scores.
      </div>

      <div className="space-y-3 mb-6">
        {issues.map((issue, index) => (
          <div
            key={index}
            onClick={() => onSelectIssue(issue)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedIssue?.issue === issue.issue
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedIssue?.issue === issue.issue
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <h3 className="font-medium text-gray-800">{issue.issue}</h3>
                </div>
              </div>
              <div className="flex gap-4 text-sm shrink-0">
                <div className="text-center">
                  <div className="text-gray-500">Importance</div>
                  <div className="font-bold text-blue-600">
                    {issue.importance_score.toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Frequency</div>
                  <div className="font-bold text-green-600">
                    {issue.frequency_score.toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Total</div>
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
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
