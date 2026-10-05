'use client';

import { AlertTriangle } from 'lucide-react';

interface UnverifiedListProps {
  items: string[];
  emptyMessage: string;
  hasVerifiedItems: boolean;
}

/** Lists AI suggestions that web search could not confirm, so students check them before citing. */
export function UnverifiedList({ items, emptyMessage, hasVerifiedItems }: UnverifiedListProps) {
  if (items.length === 0) {
    return hasVerifiedItems ? null : <p className="text-gray-500 italic">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-1 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-gray-700">{item}</p>
            <a
              href={`https://scholar.google.com/scholar?q=${encodeURIComponent(item)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-700 hover:underline"
            >
              Not verified — check before citing (Search Scholar)
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
