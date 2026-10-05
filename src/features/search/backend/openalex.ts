import type { VerifiedReference } from '@/types';
import { citationsPerYear } from './reference-selection';

const OPENALEX_WORKS_URL = 'https://api.openalex.org/works';
const OPENALEX_TIMEOUT_MS = 8000;
const RESULTS_PER_QUERY = 25;
const OPENALEX_FIELDS =
  'id,doi,title,publication_year,cited_by_count,authorships,primary_location,relevance_score,type';

/** Scholarly outputs a student can cite; excludes datasets, paratext, dissertations and preprints. */
const WORK_TYPES = ['article', 'review', 'book', 'book-chapter', 'report'];

/**
 * Sorting OpenAlex by citations alone surfaces famous works that merely share a word with the
 * query, so results are fetched by relevance and only those close to the query's best match are
 * kept before re-ranking by citations.
 */
const MIN_RELATIVE_RELEVANCE = 0.5;

export interface OpenAlexWork {
  id: string;
  doi?: string | null;
  title?: string | null;
  publication_year?: number | null;
  cited_by_count?: number;
  relevance_score?: number;
  type?: string;
  authorships?: Array<{ author?: { display_name?: string | null } }>;
  primary_location?: {
    landing_page_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
}

interface OpenAlexResponse {
  results?: OpenAlexWork[];
}

const topRelevanceOf = (works: OpenAlexWork[]) =>
  Math.max(0, ...works.map((work) => work.relevance_score ?? 0));

/** Keeps the works whose relevance is comparable to the query's best match. */
export const filterRelevant = (works: OpenAlexWork[]): OpenAlexWork[] => {
  const topRelevance = topRelevanceOf(works);
  if (topRelevance === 0) return works;

  return works.filter((work) => (work.relevance_score ?? 0) >= topRelevance * MIN_RELATIVE_RELEVANCE);
};

/**
 * Ranking score within one query's results. Citations per year are log-damped and weighted by
 * squared relative relevance, so a famous paper that only brushes the topic ("Diabetes in
 * Vietnam" for a health-insurance query) ranks below an on-topic, moderately cited one.
 */
export const discoveryScore = (work: OpenAlexWork, topRelevance: number, currentYear: number): number => {
  const perYear = citationsPerYear(work.publication_year ?? currentYear, work.cited_by_count ?? 0, currentYear);
  const relativeRelevance = topRelevance > 0 ? (work.relevance_score ?? 0) / topRelevance : 1;
  return Math.log1p(perYear) * relativeRelevance ** 2;
};

/**
 * Merges the relevant results of several queries, de-duplicated, best score first. A work
 * returned by several queries keeps its highest score.
 */
export const rankDiscoveredWorks = (
  queryResults: OpenAlexWork[][],
  currentYear: number
): OpenAlexWork[] => {
  const bestScores = new Map<string, { work: OpenAlexWork; score: number }>();

  queryResults.forEach((results) => {
    const topRelevance = topRelevanceOf(results);

    filterRelevant(results)
      .filter((work) => work.title)
      .forEach((work) => {
        const score = discoveryScore(work, topRelevance, currentYear);
        const known = bestScores.get(work.id);
        if (!known || score > known.score) bestScores.set(work.id, { work, score });
      });
  });

  return [...bestScores.values()].sort((a, b) => b.score - a.score).map(({ work }) => work);
};

/** "Md Abdullah Omar" → "Omar, M. A."; a single name is kept as is. */
export const formatOpenAlexAuthor = (displayName: string): string => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return displayName.trim();

  const family = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((part) => `${part[0]}.`)
    .join(' ');
  return `${family}, ${initials}`;
};

export const toDiscoveredReference = (work: OpenAlexWork, verifiedAt: string): VerifiedReference => {
  const doi = work.doi?.replace(/^https?:\/\/doi\.org\//i, '');

  return {
    title: work.title ?? '',
    authors: (work.authorships ?? [])
      .map((authorship) => authorship.author?.display_name ?? '')
      .filter(Boolean)
      .map(formatOpenAlexAuthor),
    year: work.publication_year ?? 0,
    source: work.primary_location?.source?.display_name || 'OpenAlex',
    url: doi ? `https://doi.org/${doi}` : work.primary_location?.landing_page_url || work.id,
    doi: doi || undefined,
    cited_by_count: work.cited_by_count ?? 0,
    verified_at: verifiedAt,
  };
};

/** Commas and pipes separate and combine OpenAlex filters, so they cannot appear in a value. */
const toFilterValue = (text: string) => text.replace(/[,|:]/g, ' ').replace(/\s+/g, ' ').trim();

export interface OpenAlexSearch {
  query: string;
  sinceYear: number;
  /** Required in the title or abstract, so a capstone on one country gets that country's evidence. */
  country?: string;
}

/** Relevance-ranked works published since the given year; [] on any failure. */
export async function searchOpenAlex({ query, sinceYear, country }: OpenAlexSearch): Promise<OpenAlexWork[]> {
  const countryFilter = toFilterValue(country ?? '');
  const params = new URLSearchParams({
    search: query,
    filter: [
      `from_publication_date:${sinceYear}-01-01`,
      `type:${WORK_TYPES.join('|')}`,
      'is_paratext:false',
      ...(countryFilter ? [`title_and_abstract.search:${countryFilter}`] : []),
    ].join(','),
    'per-page': String(RESULTS_PER_QUERY),
    select: OPENALEX_FIELDS,
  });

  // OpenAlex, like Crossref, serves requests that identify a contact from its faster polite pool.
  const mailto = process.env.OPENALEX_MAILTO ?? process.env.CROSSREF_MAILTO;
  if (mailto) params.set('mailto', mailto);

  try {
    const response = await fetch(`${OPENALEX_WORKS_URL}?${params}`, {
      headers: { 'User-Agent': 'CapstoneTopicExplorer/1.0' },
      signal: AbortSignal.timeout(OPENALEX_TIMEOUT_MS),
    });

    if (!response.ok) return [];

    const data: OpenAlexResponse = await response.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}
