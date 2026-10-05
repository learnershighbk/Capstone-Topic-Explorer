import { getHostname, isOfficialDataUrl, sourceNameMatches, toTitleWords } from './matching';

/**
 * Picks the page that publishes an AI-suggested data source out of web-search results.
 *
 * Checked against real searches (2026-10): the earlier rule "first official host whose title
 * names the source" linked ministry front pages, third-party directories (.org partner pages,
 * data registries) and news posts. Ranking now prefers the source's own site, identified by its
 * acronym or a distinctive name word in the hostname, and demotes front pages to a last resort
 * that only the source's own site may fill.
 */

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

/** Social, open-edit, aggregator and directory sites that describe a source without publishing it. */
const NON_PUBLISHER_DOMAINS = [
  'wikipedia.org', 'wikimedia.org', 'wikidata.org', 'reddit.com', 'linkedin.com', 'facebook.com',
  'instagram.com', 'youtube.com', 'twitter.com', 'x.com', 'researchgate.net', 'github.com',
  'scribd.com', 'academia.edu', 're3data.org', 'landportal.org', 'dateno.io', 'govdirectory.org',
  'ceicdata.com', 'alphacast.io', 'apify.com', 'statista.com', 'tradingeconomics.com', 'knoema.com',
];

/** Path segments that only pick a language or landing page, so the URL is still a front page. */
const LANDING_SEGMENTS = new Set([
  'en', 'eng', 'english', 'ko', 'kor', 'korean', 'id', 'home', 'homepage', 'main', 'index', 'default',
  'portal', 'web', 'site', 'front', 'intro',
]);
/** A last segment like "main.do" marks a landing page whatever section precedes it ("/imerEng/main/main.do"). */
const LANDING_LAST_SEGMENTS = new Set(['main', 'index', 'home', 'homepage', 'default']);
const LANDING_QUERY_KEYS = new Set(['lang', 'language', 'locale', 'hl']);
const PAGE_EXTENSION_PATTERN = /\.(do|html?|jsp|php|aspx?|es)$/i;
/** Servlet session ids make a link single-use and unreadable. */
const SESSION_ID_PATTERN = /;jsessionid=[^?#]*/i;

/**
 * Name words too common to show that a hostname belongs to the source: "statistics" appears in
 * "bps-statistics", "korea" in "korea.net".
 */
const GENERIC_NAME_WORDS = new Set([
  'data', 'database', 'databank', 'statistics', 'statistical', 'stats', 'survey', 'surveys', 'national',
  'ministry', 'department', 'bureau', 'office', 'agency', 'institute', 'institution', 'system', 'service',
  'services', 'indicators', 'indicator', 'world', 'global', 'international', 'center', 'centre', 'program',
  'programme', 'portal', 'open', 'information', 'report', 'reports', 'research', 'council', 'commission',
  'authority', 'federal', 'central', 'bank', 'government', 'economic', 'health', 'labor', 'labour',
  'employment', 'study', 'panel', 'family', 'life', 'household', 'living', 'standards', 'population',
  'general', 'basic', 'public', 'social', 'development', 'education', 'census',
]);
const MIN_DISTINCTIVE_WORD_LENGTH = 5;
const MIN_ACRONYM_LENGTH = 3;
/** A 3-letter acronym must be a whole host label ("who.int"); longer ones may be part of one ("ecos.bok.or.kr"). */
const MIN_ACRONYM_SUBSTRING_LENGTH = 4;

/** Share of a result title's own words (before any " - site name") that the suggestion must contain. */
const TITLE_COVERAGE_THRESHOLD = 0.8;
const MIN_COVERED_TITLE_WORDS = 2;
/** Words a page on the source's own site must share with the suggestion to count as about it. */
const MIN_RELATED_TITLE_WORDS = 2;

/**
 * Ranking weights. A page titled by the specific dataset the suggestion names wins wherever it
 * is hosted (a statistics office's survey page beats the portal's press-release list). Below
 * that, the source's own site outranks another official host, a title naming the source
 * outranks one merely about it, and the own site's front page is the last resort.
 */
const SCORE = {
  ownSitePage: 5,
  otherOfficialPage: 2,
  ownSiteFrontPage: 1,
  titleNamesSource: 2,
  titleRelated: 1,
  titleNamesDataset: 4,
} as const;

/**
 * A detail that names a dataset rather than describing one: "Economically Active Population
 * Survey", "Youth Panel Survey", "(SUSENAS)" — as opposed to "macroeconomic indicators".
 */
const DATASET_NAME_PATTERN = /(\b[A-Z][a-z]+\s+[A-Z][a-z]+)|\b[A-Z]{3,}\b/;
const TITLE_SEGMENT_SEPARATOR = /\s[-–—|:>»]+\s|\s*>\s*|\s\|\s/;

export interface SourceSuggestion {
  /** The organization or dataset the AI named, e.g. "KOSIS (Korean Statistical Information Service)". */
  name: string;
  /** The rest of the suggestion: what the source offers, often naming a specific dataset. */
  detail: string;
}

/** Splits "KOSIS (…): Economically Active Population Survey data" at the first ": " or " - ". */
export const parseSourceSuggestion = (suggestion: string): SourceSuggestion => {
  const [name = suggestion, ...rest] = suggestion.split(/:\s|\s[-–—]\s/);
  return { name: name.trim(), detail: rest.join(' ').trim() };
};

const isNonPublisherHost = (host: string) =>
  NON_PUBLISHER_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));

/** Whether a URL is only a site's front page rather than a page for a specific dataset or report. */
export const isSiteFrontPage = (url: string): boolean => {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    const hostLabels = new Set(hostname.toLowerCase().split('.'));
    const segments = pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.replace(PAGE_EXTENSION_PATTERN, '').toLowerCase());
    const onlyLanguageParams = [...searchParams.keys()].every((key) => LANDING_QUERY_KEYS.has(key.toLowerCase()));
    const lastSegment = segments[segments.length - 1];

    if (!onlyLanguageParams) return false;
    if (lastSegment !== undefined && LANDING_LAST_SEGMENTS.has(lastSegment)) return true;
    return segments.every((segment) => LANDING_SEGMENTS.has(segment) || hostLabels.has(segment));
  } catch {
    return false;
  }
};

/**
 * Initials of every leading run of words, from three words up: "Bank of Korea Economic Statistics
 * System" → "bok", "boke", … so the organization that opens a longer name is found too.
 */
const leadingInitials = (words: string[]): string[] =>
  words
    .map((_, index) => words.slice(0, index + 1))
    .filter((prefix) => prefix.length >= MIN_ACRONYM_LENGTH)
    .map((prefix) => prefix.map((word) => word[0]).join(''));

/** Conjunctions that acronyms usually drop while keeping "of": MOEL, not MOEAL. */
const CONJUNCTIONS = new Set(['and', 'the']);

/**
 * Short names a source's own site is likely to use in its hostname: a parenthesized or all-caps
 * acronym ("KOSIS", "WHO") and initials in their common forms ("Bank of Korea" → "bok", "Ministry
 * of Employment and Labor" → "moel", "Korea Labor Institute" → "kli").
 */
export const sourceAcronyms = (name: string): string[] => {
  const parenthesized = [...name.matchAll(/\(([A-Za-z]+)\)/g)].map((match) => match[1]);
  const withoutParens = name.replace(/\([^)]*\)/g, ' ');
  const tokens = withoutParens.split(/[^A-Za-z]+/).filter(Boolean);
  const allCaps = tokens.filter((token) => /^[A-Z]{2,}$/.test(token));
  const contentWords = [...toTitleWords(withoutParens)];
  const candidates = [
    ...parenthesized,
    ...allCaps,
    ...leadingInitials(tokens),
    ...leadingInitials(tokens.filter((token) => !CONJUNCTIONS.has(token.toLowerCase()))),
    ...leadingInitials(contentWords),
  ].map((acronym) => acronym.toLowerCase());

  return [...new Set(candidates.filter((acronym) => acronym.length >= MIN_ACRONYM_LENGTH))];
};

const distinctiveNameWords = (name: string, country: string): string[] => {
  const countryLower = country.toLowerCase();
  return [...toTitleWords(name.replace(/\([^)]*\)/g, ' '))].filter(
    (word) =>
      word.length >= MIN_DISTINCTIVE_WORD_LENGTH &&
      !GENERIC_NAME_WORDS.has(word) &&
      !countryLower.includes(word.slice(0, MIN_DISTINCTIVE_WORD_LENGTH))
  );
};

/** Whether the hostname looks like the source's own site ("kosis.kr", "who.int", "data.bps.go.id"). */
export const hostNamesSource = (url: string, name: string, country: string): boolean => {
  const host = getHostname(url);
  if (!host) return false;

  const labels = host.split('.');
  const acronymInHost = sourceAcronyms(name).some((acronym) =>
    labels.some(
      (label) => label === acronym || (acronym.length >= MIN_ACRONYM_SUBSTRING_LENGTH && label.includes(acronym))
    )
  );

  return acronymInHost || distinctiveNameWords(name, country).some((word) => host.includes(word));
};

/**
 * Whether a result's own title (before the " - Site Name" suffix) is made of words from the
 * given text, so "Economically Active Population Survey - Statistics Korea" counts for a
 * suggestion detail that mentions that survey inside a longer description.
 */
export const titleIsFromSuggestion = (text: string, resultTitle: string): boolean => {
  const titleWords = [...toTitleWords(resultTitle.split(TITLE_SEGMENT_SEPARATOR)[0] ?? '')];
  const suggestionWords = toTitleWords(text);
  const acronyms = new Set(sourceAcronyms(text));
  const covered = titleWords.filter((word) => suggestionWords.has(word));

  if (titleWords.length === 1) return acronyms.has(titleWords[0]);
  return covered.length >= MIN_COVERED_TITLE_WORDS && covered.length / titleWords.length >= TITLE_COVERAGE_THRESHOLD;
};

const titleNames = (text: string, title: string) =>
  text.length > 0 && (sourceNameMatches(text, title) || titleIsFromSuggestion(text, title));

const everyWordInTitle = (text: string, title: string) => {
  const titleWords = toTitleWords(title);
  const words = [...toTitleWords(text)];
  return words.length > 0 && words.every((word) => titleWords.has(word));
};

/**
 * Whether the title is the dataset the detail names: the detail reads like a name and the title
 * either consists of the detail's words or contains all of them. Looser overlap is not enough
 * here, or "Cohort Panel Project … Youth" would pass for "Youth Panel Survey".
 */
const titleIsNamedDataset = (detail: string, title: string) =>
  DATASET_NAME_PATTERN.test(detail) && (titleIsFromSuggestion(detail, title) || everyWordInTitle(detail, title));

/** Whether a title shares enough words with the suggestion to be about it ("Indonesia - WHO Data"). */
const titleIsRelated = (suggestion: string, title: string) => {
  const suggestionWords = toTitleWords(suggestion);
  return [...toTitleWords(title)].filter((word) => suggestionWords.has(word)).length >= MIN_RELATED_TITLE_WORDS;
};

/** Removes a servlet session id so the stored link stays usable. */
export const cleanSourceUrl = (url: string): string => url.replace(SESSION_ID_PATTERN, '');

/**
 * How well a result stands in for the source's own page; 0 means unusable. A front page is
 * accepted only on the source's own site and only when titled by the source (a portal named
 * as a whole, "KOSIS"); any other host must be official and name the source in its title.
 */
export const scoreSourcePage = (suggestion: string, country: string, result: SearchResult): number => {
  const host = getHostname(result.link);
  if (!host || isNonPublisherHost(host)) return 0;

  const parsed = parseSourceSuggestion(suggestion);
  const ownSite = hostNamesSource(result.link, parsed.name, country);
  const frontPage = isSiteFrontPage(result.link);
  const named = titleNames(parsed.name, result.title) || titleNames(parsed.detail, result.title);
  const datasetBonus = titleIsNamedDataset(parsed.detail, result.title) ? SCORE.titleNamesDataset : 0;

  if (ownSite && frontPage) return named ? SCORE.ownSiteFrontPage + SCORE.titleNamesSource : 0;
  if (ownSite && named) return SCORE.ownSitePage + SCORE.titleNamesSource + datasetBonus;
  if (ownSite && titleIsRelated(suggestion, result.title)) return SCORE.ownSitePage + SCORE.titleRelated;
  if (!ownSite && !frontPage && named && isOfficialDataUrl(result.link)) {
    return SCORE.otherOfficialPage + SCORE.titleNamesSource + datasetBonus;
  }
  return 0;
};

/** The best-scoring result, earliest search rank breaking ties; undefined when none is usable. */
export const findSourcePage = (
  suggestion: string,
  country: string,
  results: SearchResult[]
): SearchResult | undefined => {
  const best = results.reduce<{ result: SearchResult; score: number } | undefined>((top, result) => {
    const score = scoreSourcePage(suggestion, country, result);
    return score > (top?.score ?? 0) ? { result, score } : top;
  }, undefined);

  return best ? { ...best.result, link: cleanSourceUrl(best.result.link) } : undefined;
};
