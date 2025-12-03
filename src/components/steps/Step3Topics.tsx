'use client';

import { Button } from '@/components/ui/button';
import type { PolicyIssue, Topic } from '@/types';

interface Step3TopicsProps {
  country: string;
  selectedIssue: PolicyIssue;
  topics: Topic[];
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic) => void;
  onGenerateMore: () => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  isGeneratingMore: boolean;
}

export function Step3Topics({
  country,
  selectedIssue,
  topics,
  selectedTopic,
  onSelectTopic,
  onGenerateMore,
  onNext,
  onBack,
  isLoading,
  isGeneratingMore,
}: Step3TopicsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Step 3: Explore Capstone Topics
      </h2>
      <p className="text-gray-600 mb-6">
        Topics for <span className="font-semibold">{selectedIssue.issue}</span>{' '}
        in <span className="font-semibold">{country}</span>
      </p>

      <div className="mb-4 text-sm text-gray-500">
        Select a topic to get detailed analysis and recommendations.
      </div>

      <div className="space-y-3 mb-6">
        {topics.map((topic, index) => (
          <div
            key={index}
            onClick={() => onSelectTopic(topic)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTopic?.title === topic.title
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  selectedTopic?.title === topic.title
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </span>
              <h3 className="font-medium text-gray-800">{topic.title}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-6">
        <Button
          variant="outline"
          onClick={onGenerateMore}
          disabled={isGeneratingMore}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          {isGeneratingMore ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            '+ Generate More Topics'
          )}
        </Button>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedTopic || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            'Get Detailed Analysis'
          )}
        </Button>
      </div>
    </div>
  );
}
