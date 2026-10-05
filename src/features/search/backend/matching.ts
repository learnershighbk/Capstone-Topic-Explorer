import type { SourceType } from '@/types';

const INTERNATIONAL_ORG_DOMAINS = [
  'worldbank.org',
  'un.org',
  'imf.org',
  'oecd.org',
  'who.int',
  'unesco.org',
  'ilo.org',
  'fao.org',
  'adb.org',
];

const ACADEMIC_DOMAINS = [
  'scholar.google.com',
  'jstor.org',
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'doi.org',
  'researchgate.net',
  'semanticscholar.org',
  'ssrn.com',
  'papers.ssrn.com',
  'sciencedirect.com',
  'springer.com',
  'wiley.com',
  'tandfonline.com',
  'sagepub.com',
  'oup.com',
  'cambridge.org',
  'nber.org',
  'repec.org',
  'dbpia.co.kr',
  'kci.go.kr',
  'riss.kr',
];

const ACADEMIC_SUFFIXES = ['.edu', '.ac.kr', '.ac.uk', '.ac.jp', '.edu.au'];

const GOVERNMENT_SUFFIXES = ['.gov', '.go.kr', '.gov.uk', '.gov.au', '.go.jp'];

/** Words too common in titles to count as evidence that two titles name the same work. */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'in', 'on', 'for', 'to', 'by', 'with', 'from', 'at', 'as', 'its', 'or', 'pdf',
]);

/** Share of the shorter title's words that must appear in the other title. */
const TITLE_OVERLAP_THRESHOLD = 0.8;
const MIN_SHARED_TITLE_WORDS = 3;

export const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
};

const hostIsOrUnder = (host: string, domain: string) =>
  host === domain || host.endsWith(`.${domain}`);

const matchesAnyDomain = (host: string, domains: string[]) =>
  domains.some((domain) => hostIsOrUnder(host, domain));

const matchesAnySuffix = (host: string, suffixes: string[]) =>
  suffixes.some((suffix) => host.endsWith(suffix));

export const isAcademicUrl = (url: string): boolean => {
  const host = getHostname(url);
  if (!host) return false;
  return matchesAnyDomain(host, ACADEMIC_DOMAINS) || matchesAnySuffix(host, ACADEMIC_SUFFIXES);
};

/** Whether a URL looks like an official data publisher (government, IO, NGO, or data portal). */
export const isOfficialDataUrl = (url: string): boolean => {
  const host = getHostname(url);
  if (!host) return false;
  return (
    matchesAnySuffix(host, GOVERNMENT_SUFFIXES) ||
    matchesAnyDomain(host, INTERNATIONAL_ORG_DOMAINS) ||
    host.endsWith('.org') ||
    host.startsWith('data.')
  );
};

export const inferSourceType = (url: string): SourceType => {
  const host = getHostname(url);
  if (!host) return 'other';
  if (matchesAnySuffix(host, GOVERNMENT_SUFFIXES)) return 'government';
  if (matchesAnyDomain(host, INTERNATIONAL_ORG_DOMAINS)) return 'international_org';
  if (isAcademicUrl(url)) return 'academic';
  if (host.endsWith('.org')) return 'ngo';
  return 'other';
};

const toTitleWords = (title: string): Set<string> =>
  new Set(
    title
      .toLowerCase()
      .replace(/\.{3}|…/g, ' ')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
  );

/**
 * Decides whether a search-result title refers to the cited work.
 * Compares against the shorter of the two because search engines truncate long titles
 * and append site names.
 */
export const titlesMatch = (citedTitle: string, resultTitle: string): boolean => {
  const citedWords = toTitleWords(citedTitle);
  const resultWords = toTitleWords(resultTitle);

  if (citedWords.size === 0 || resultWords.size === 0) return false;

  const sharedCount = [...citedWords].filter((word) => resultWords.has(word)).length;
  const shorterSize = Math.min(citedWords.size, resultWords.size);
  const requiredShared = Math.min(MIN_SHARED_TITLE_WORDS, citedWords.size);

  return sharedCount >= requiredShared && sharedCount / shorterSize >= TITLE_OVERLAP_THRESHOLD;
};

/** Words shared by too many journal names to show that two venues are the same. */
const GENERIC_VENUE_WORDS = new Set([
  'journal', 'review', 'studies', 'international', 'quarterly', 'bulletin', 'research', 'papers', 'press',
  'publishing', 'publications', 'university',
]);

export const normalizeName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();

/** "Acemoglu, D." → "acemoglu"; "OECD" → "oecd". */
export const citedSurname = (author: string) => normalizeName(author.split(',')[0] ?? '');

const toVenueWords = (venue: string) =>
  [...toTitleWords(normalizeName(venue))].filter((word) => !GENERIC_VENUE_WORDS.has(word));

const initialsOf = (venue: string) =>
  [...toTitleWords(venue)].map((word) => word[0]).join('');

/**
 * Whether the cited venue plausibly names the registered one. Lenient on purpose (abbreviations
 * like "AER" pass) because it only has to reject clear mismatches, such as a book review in an
 * unrelated journal standing in for the book itself.
 */
export const venuesAgree = (citedVenue: string, registeredVenue: string): boolean => {
  if (!citedVenue.trim() || !registeredVenue.trim()) return true;

  const citedWords = toVenueWords(citedVenue);
  const registeredWords = new Set(toVenueWords(registeredVenue));

  if (citedWords.some((word) => registeredWords.has(word))) return true;

  const compactCited = citedVenue.replace(/[^\p{L}]/gu, '').toLowerCase();
  const compactRegistered = registeredVenue.replace(/[^\p{L}]/gu, '').toLowerCase();

  return compactCited === initialsOf(registeredVenue) || compactRegistered === initialsOf(citedVenue);
};

/**
 * Whether any cited author's surname appears as a whole word in the text; vacuously true with
 * no authors. Weak evidence on its own (a surname can also be a place name), so it only backs
 * up web-search matches for works Crossref does not know.
 */
export const mentionsAnyAuthor = (text: string, authors: string[]): boolean => {
  const surnames = authors.map(citedSurname).filter(Boolean);
  if (surnames.length === 0) return true;

  const words = new Set(normalizeName(text).split(/[^\p{L}\p{N}]+/u));
  return surnames.some((surname) => surname.split(/\s+/).every((part) => words.has(part)));
};
