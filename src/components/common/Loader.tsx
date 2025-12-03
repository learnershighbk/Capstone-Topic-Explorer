'use client';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loader({ size = 'md', text }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );
}

interface FullPageLoaderProps {
  text?: string;
}

export function FullPageLoader({ text = 'Loading...' }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-700 font-medium">{text}</p>
      </div>
    </div>
  );
}
