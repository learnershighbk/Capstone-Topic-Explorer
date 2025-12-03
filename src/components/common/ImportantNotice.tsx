'use client';

interface ImportantNoticeProps {
  children: React.ReactNode;
  type?: 'warning' | 'info' | 'success' | 'error';
}

export function ImportantNotice({
  children,
  type = 'warning',
}: ImportantNoticeProps) {
  const styles = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      icon: 'text-yellow-500',
      text: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      icon: 'text-blue-500',
      text: 'text-blue-800',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      icon: 'text-green-500',
      text: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      icon: 'text-red-500',
      text: 'text-red-800',
    },
  };

  const style = styles[type];

  const icons = {
    warning: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
    info: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    success: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    error: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  };

  return (
    <div
      className={`${style.bg} ${style.border} border-l-4 p-4 rounded-r-lg`}
    >
      <div className="flex items-start">
        <svg
          className={`w-5 h-5 ${style.icon} mr-3 mt-0.5 shrink-0`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icons[type]}
        </svg>
        <div className={`${style.text} text-sm`}>{children}</div>
      </div>
    </div>
  );
}
