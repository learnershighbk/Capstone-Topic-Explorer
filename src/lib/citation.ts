import type { AiReference } from '@/types';

/** Renders a reference as an APA-like one-line citation for display and copying. */
export const formatCitation = (reference: AiReference | string): string => {
  if (typeof reference === 'string') {
    return reference;
  }

  const authors = reference.authors.length > 0 ? reference.authors.join(', ') : 'Unknown author';
  const venue = reference.venue ? ` ${reference.venue}.` : '';

  const title = /[.?!]$/.test(reference.title) ? reference.title : `${reference.title}.`;

  return `${authors} (${reference.year}). ${title}${venue}`;
};
