import type { AiReference, VerifiedReference } from '@/types';
import { citedSurname, normalizeName, titlesMatch, venuesAgree } from './matching';

const CROSSREF_WORKS_URL = 'https://api.crossref.org/works';
const CROSSREF_ROWS = 5;
const CROSSREF_TIMEOUT_MS = 8000;
const CROSSREF_FIELDS =
  'DOI,title,subtitle,author,issued,container-title,publisher,type,is-referenced-by-count';

/**
 * The anonymous pool allows one request at a time at about one per second, and replies 429
 * beyond that. Requests are therefore serialized per server instance, with the gap taken from
 * Crossref's rate-limit headers (shorter once CROSSREF_MAILTO unlocks the polite pool).
 */
const DEFAULT_REQUEST_GAP_MS = 1000;
/** Past this queueing delay a reference skips Crossref and goes straight to web search. */
const MAX_QUEUE_WAIT_MS = 15000;

/** AI-cited years often differ from the registered one (working paper vs. journal version). */
const MAX_YEAR_DIFFERENCE = 2;

/** Preferred when several registered versions of the same work match equally well. */
const PUBLISHED_TYPES = new Set(['journal-article', 'book', 'monograph', 'report', 'book-chapter']);

export interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
}

export interface CrossrefWork {
  DOI: string;
  title?: string[];
  subtitle?: string[];
  author?: CrossrefAuthor[];
  issued?: { 'date-parts'?: Array<Array<number | null>> };
  'container-title'?: string[];
  publisher?: string;
  type?: string;
  'is-referenced-by-count'?: number;
}

interface CrossrefResponse {
  message?: { items?: CrossrefWork[] };
}

const stripMarkup = (text: string) => text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const workTitle = (work: CrossrefWork) => {
  const title = stripMarkup(work.title?.[0] ?? '');
  const subtitle = stripMarkup(work.subtitle?.[0] ?? '');
  return subtitle ? `${title}: ${subtitle}` : title;
};

const workYear = (work: CrossrefWork): number | null => work.issued?.['date-parts']?.[0]?.[0] ?? null;

const workSurnames = (work: CrossrefWork) =>
  (work.author ?? []).map((a) => normalizeName(a.family ?? a.name ?? '')).filter(Boolean);

/**
 * A matching title is not enough: hallucinated citations often attach a real title to the
 * wrong authors. Institutional authors are absent from Crossref, so the check is skipped
 * when either side has no personal names.
 */
const authorsAgree = (reference: AiReference, work: CrossrefWork) => {
  const registered = workSurnames(work);
  const cited = reference.authors.map(citedSurname).filter(Boolean);

  if (registered.length === 0 || cited.length === 0) return true;

  return cited.some((surname) => registered.includes(surname));
};

const yearDistance = (reference: AiReference, work: CrossrefWork) => {
  const year = workYear(work);
  return year === null ? Number.POSITIVE_INFINITY : Math.abs(year - reference.year);
};

export type CrossrefAssessment =
  | { kind: 'match'; work: CrossrefWork }
  /** The registry holds this title and year under other authors: a misattributed citation. */
  | { kind: 'misattributed' }
  | { kind: 'not_found' };

/** Decides which registered work, if any, is the cited one. */
export const assessCrossrefResults = (
  reference: AiReference,
  works: CrossrefWork[]
): CrossrefAssessment => {
  const sameTitleAndYear = works.filter(
    (work) =>
      titlesMatch(reference.title, workTitle(work)) &&
      yearDistance(reference, work) <= MAX_YEAR_DIFFERENCE
  );

  const candidates = sameTitleAndYear.filter(
    (work) =>
      authorsAgree(reference, work) &&
      venuesAgree(reference.venue, work['container-title']?.[0] ?? '')
  );

  const rank = (work: CrossrefWork) =>
    yearDistance(reference, work) * 2 + (PUBLISHED_TYPES.has(work.type ?? '') ? 0 : 1);

  const bestMatch = [...candidates].sort((a, b) => rank(a) - rank(b))[0];

  if (bestMatch) return { kind: 'match', work: bestMatch };

  const isMisattributed =
    sameTitleAndYear.length > 0 && sameTitleAndYear.every((work) => !authorsAgree(reference, work));

  return isMisattributed ? { kind: 'misattributed' } : { kind: 'not_found' };
};

const formatAuthor = (author: CrossrefAuthor) => {
  if (author.family) {
    const initials = (author.given ?? '')
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((part) => `${part[0]}.`)
      .join(' ');
    return initials ? `${author.family}, ${initials}` : author.family;
  }
  return author.name ?? '';
};

/** Builds the displayed reference from registry metadata, which is more accurate than the AI's. */
export const toVerifiedReference = (
  reference: AiReference,
  work: CrossrefWork,
  verifiedAt: string
): VerifiedReference => {
  const registeredAuthors = (work.author ?? []).map(formatAuthor).filter(Boolean);

  return {
    title: workTitle(work) || reference.title,
    authors: registeredAuthors.length > 0 ? registeredAuthors : reference.authors,
    year: workYear(work) ?? reference.year,
    source: work['container-title']?.[0] || work.publisher || reference.venue || 'Crossref',
    url: `https://doi.org/${work.DOI}`,
    doi: work.DOI,
    cited_by_count: work['is-referenced-by-count'],
    verified_at: verifiedAt,
  };
};

const firstSurname = (reference: AiReference) => reference.authors[0]?.split(',')[0]?.trim() ?? '';

let queueTail: Promise<unknown> = Promise.resolve();
let requestGapMs = DEFAULT_REQUEST_GAP_MS;
let lastRequestAt = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs tasks one at a time, at least requestGapMs apart. */
const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queueTail.then(async () => {
    const waitMs = lastRequestAt + requestGapMs - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    lastRequestAt = Date.now();
    return task();
  });
  queueTail = run.catch(() => undefined);
  return run;
};

/** Reads "x-rate-limit-limit: 1" / "x-rate-limit-interval: 1s" into a per-request gap. */
const adoptRateLimit = (headers: Headers) => {
  const limit = Number(headers.get('x-rate-limit-limit'));
  const intervalSeconds = Number.parseFloat(headers.get('x-rate-limit-interval') ?? '');

  if (limit > 0 && intervalSeconds > 0) {
    requestGapMs = Math.ceil((intervalSeconds * 1000) / limit);
  }
};

/** Searches Crossref; returns [] on any failure so callers fall back to web search. */
export async function searchCrossref(reference: AiReference): Promise<CrossrefWork[]> {
  const enqueuedAt = Date.now();

  return enqueue(() =>
    Date.now() - enqueuedAt > MAX_QUEUE_WAIT_MS ? Promise.resolve([]) : fetchCrossref(reference)
  );
}

async function fetchCrossref(reference: AiReference): Promise<CrossrefWork[]> {
  const params = new URLSearchParams({
    'query.bibliographic': reference.title,
    rows: String(CROSSREF_ROWS),
    select: CROSSREF_FIELDS,
  });

  const surname = firstSurname(reference);
  if (surname) params.set('query.author', surname);

  // Crossref routes requests that identify a contact to its faster "polite" pool.
  const mailto = process.env.CROSSREF_MAILTO;
  if (mailto) params.set('mailto', mailto);

  try {
    const response = await fetch(`${CROSSREF_WORKS_URL}?${params}`, {
      headers: { 'User-Agent': 'CapstoneTopicExplorer/1.0' },
      signal: AbortSignal.timeout(CROSSREF_TIMEOUT_MS),
    });

    adoptRateLimit(response.headers);

    if (response.status === 429) {
      requestGapMs = Math.max(requestGapMs, DEFAULT_REQUEST_GAP_MS) * 2;
      return [];
    }

    if (!response.ok) return [];

    const data: CrossrefResponse = await response.json();
    return data.message?.items ?? [];
  } catch {
    return [];
  }
}
