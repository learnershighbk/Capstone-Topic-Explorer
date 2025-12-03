'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = [
  'Define Your Scope',
  'Identify Key Policy Issues',
  'Explore Capstone Topics',
  'Detailed Topic Analysis',
];

export function ProgressBar({ currentStep, totalSteps = 4 }: ProgressBarProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div
                    className={`h-1 flex-1 ${
                      isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : isCompleted
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`h-1 flex-1 ${
                      isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-2 text-xs sm:text-sm text-center ${
                  isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'
                }`}
              >
                {STEP_LABELS[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
