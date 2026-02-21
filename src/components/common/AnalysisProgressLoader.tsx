'use client';

type AnalysisPhase = 'generating' | 'verifying-sources' | 'done';

interface AnalysisProgressLoaderProps {
  phase: AnalysisPhase;
}

interface StepItem {
  label: string;
  description: string;
}

const steps: StepItem[] = [
  {
    label: 'Generating AI Analysis',
    description: 'Creating detailed analysis with rationale, methodologies, and references...',
  },
  {
    label: 'Verifying Sources & References',
    description: 'Checking data sources and academic references for accuracy...',
  },
];

function getActiveIndex(phase: AnalysisPhase): number {
  if (phase === 'generating') return 0;
  if (phase === 'verifying-sources') return 1;
  return 2;
}

export function AnalysisProgressLoader({ phase }: AnalysisProgressLoaderProps) {
  const activeIndex = getActiveIndex(phase);

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
          Analyzing Your Topic
        </h3>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isActive = index === activeIndex;

            return (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      isCompleted
                        ? 'text-green-700'
                        : isActive
                          ? 'text-blue-700'
                          : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                    {isCompleted && ' — Done'}
                  </p>
                  {isActive && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          This may take 10-30 seconds. Please do not close this page.
        </p>

        <p className="text-xs text-gray-500 text-center mt-4 italic">
          Use AI to refine your ideas, not replace your thinking. Always verify its accuracy.
        </p>
      </div>
    </div>
  );
}
