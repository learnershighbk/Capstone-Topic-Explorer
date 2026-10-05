import { getHostname, isAcademicUrl, isOfficialDataUrl, sourceNameMatches, toTitleWords } from './matching';

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
/** Segments that only mark a language edition ("/imerEng/", "/english/"). */
const LANGUAGE_SEGMENT_PATTERN = /^(en|ko|id)$|(eng|english|kor|korean)$/i;
const LANDING_QUERY_KEYS = new Set(['lang', 'language', 'locale', 'hl']);
const PAGE_EXTENSION_PATTERN = /\.(do|html?|jsp|php|aspx?|es)$/i;
/** Servlet session ids make a link single-use and unreadable. */
const SESSION_ID_PATTERN = /;jsessionid=[^?#]*/i;

/**
 * Pages about the institution rather than its data: a president's greeting, a press-release
 * list, a Q&A board. "About" alone is not listed because "About KLIPS" is the dataset's page.
 */
const SITE_PAGE_WORDS = new Set([
  'president', 'greeting', 'greetings', 'organization', 'organisation', 'history', 'contact',
  'news', 'press', 'notice', 'notices', 'faq', 'qna', 'login', 'sitemap', 'privacy', 'careers', 'events',
  'services',
]);
/** Board software paths ("bulletinBoard/pressReleasesList.do", "boardDownload.es") hold posts and attachments. */
const SITE_PAGE_PATH_PATTERN = /board|bulletin|press|news|notice|qna|faq/i;

/** Path words that mark a data or statistics page. */
const DATA_PATH_PATTERN = /stat|data|survey|indicator|table|catalog|microdata|dataset/i;
const PDF_PATTERN = /\.pdf($|[?#])/i;

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
  'general', 'basic', 'public', 'social', 'development', 'education', 'census', 'longitudinal', 'ageing',
  'aging', 'dataset', 'datasets', 'archive', 'catalog', 'repository', 'annual', 'monthly', 'quarterly',
  'income', 'expenditure', 'poverty', 'insurance', 'statistik', 'nacional', 'instituto', 'ministerio',
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
  /** A press or greeting page ranks below the front page, which at least leads to the data. */
  ownSiteGenericPage: 0,
  titleNamesSource: 2,
  titleRelated: 1,
  titleNamesDataset: 4,
  dataPath: 1,
  /** A PDF is a report about the data, so a page of the same standing wins. */
  pdfPenalty: 1,
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

    return (
      onlyLanguageParams &&
      segments.every(
        (segment) =>
          LANDING_SEGMENTS.has(segment) || hostLabels.has(segment) || LANGUAGE_SEGMENT_PATTERN.test(segment)
      )
    );
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
const acronymsOfPhrase = (phrase: string): string[] => {
  const parenthesized = [...phrase.matchAll(/\(([A-Za-z]+)\)/g)].map((match) => match[1]);
  const withoutParens = phrase.replace(/\([^)]*\)/g, ' ');
  const tokens = withoutParens.split(/[^A-Za-z]+/).filter(Boolean);
  const allCaps = tokens.filter((token) => /^[A-Z]{2,}$/.test(token));
  const contentWords = [...toTitleWords(withoutParens)];

  return [
    ...parenthesized,
    ...allCaps,
    ...leadingInitials(tokens),
    ...leadingInitials(tokens.filter((token) => !CONJUNCTIONS.has(token.toLowerCase()))),
    ...leadingInitials(contentWords),
  ].map((acronym) => acronym.toLowerCase());
};

/**
 * Collected from the whole name and from each comma-separated part, because suggestions read
 * "Dataset (ACR), Organization" and the organization's initials name the host ("Korea Labor
 * Institute" → "kli.re.kr").
 */
export const sourceAcronyms = (name: string): string[] => {
  const phrases = [name, ...name.split(/,\s*/)];
  const candidates = phrases.flatMap(acronymsOfPhrase);
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

const pathSegmentsOf = (url: string): string[] => {
  try {
    return new URL(url).pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.replace(PAGE_EXTENSION_PATTERN, '').toLowerCase());
  } catch {
    return [];
  }
};

/**
 * Whether the hostname looks like the source's own site: its acronym or a distinctive name word
 * in a host label ("kosis.kr", "who.int", "philhealth.gov.ph"). The path is not consulted: a
 * catalog's "/datasets/klips" would otherwise pass for the source.
 */
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

/** Whether the page is about the institution itself (press releases, Q&A, greetings) or a board post. */
const isInstitutionPage = (result: SearchResult): boolean => {
  const segments = pathSegmentsOf(result.link);
  return (
    segments.some((segment) => SITE_PAGE_PATH_PATTERN.test(segment)) ||
    [...segments, ...toTitleWords(result.title)].some((word) => SITE_PAGE_WORDS.has(word))
  );
};

const hasDataPath = (url: string) => pathSegmentsOf(url).some((segment) => DATA_PATH_PATTERN.test(segment));

/** Titles that several pages of one host share are the site's title, not a page's. */
const findSiteTitles = (results: SearchResult[]): Set<string> => {
  const seen = new Map<string, number>();
  results.forEach((result) => {
    const key = `${getHostname(result.link)}|${result.title}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  return new Set(
    [...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key.slice(key.indexOf('|') + 1))
  );
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
 * How well a result stands in for the source's own page; 0 means unusable. The own site's front
 * page and its pages about itself are accepted only when titled by the source and only as a last
 * resort (a portal named as a whole, "KOSIS"); any other host must be an official or academic
 * publisher and name the source in its title. `siteTitles` are titles shared by several pages of
 * one host in this result set, which mark a page as generic.
 */
export const scoreSourcePage = (
  suggestion: string,
  country: string,
  result: SearchResult,
  siteTitles: Set<string> = new Set()
): number => {
  const host = getHostname(result.link);
  if (!host || isNonPublisherHost(host)) return 0;

  const parsed = parseSourceSuggestion(suggestion);
  const ownSite = hostNamesSource(result.link, parsed.name, country);
  // A page carrying the site-wide title is as unspecific as the front page.
  const frontPage = isSiteFrontPage(result.link) || siteTitles.has(result.title);
  const generic = frontPage || isInstitutionPage(result);
  const named = titleNames(parsed.name, result.title) || titleNames(parsed.detail, result.title);
  const datasetBonus = titleIsNamedDataset(parsed.detail, result.title) ? SCORE.titleNamesDataset : 0;
  const pathBonus = (hasDataPath(result.link) ? SCORE.dataPath : 0) - (PDF_PATTERN.test(result.link) ? SCORE.pdfPenalty : 0);

  if (ownSite && generic) {
    if (!named) return 0;
    return (frontPage ? SCORE.ownSiteFrontPage : SCORE.ownSiteGenericPage) + SCORE.titleNamesSource + pathBonus;
  }
  if (ownSite && named) return SCORE.ownSitePage + SCORE.titleNamesSource + datasetBonus + pathBonus;
  if (ownSite && titleIsRelated(suggestion, result.title)) return SCORE.ownSitePage + SCORE.titleRelated + pathBonus;
  if (!ownSite && !generic && named && (isOfficialDataUrl(result.link) || isAcademicUrl(result.link))) {
    return SCORE.otherOfficialPage + SCORE.titleNamesSource + datasetBonus + pathBonus;
  }
  return 0;
};

/** The best-scoring result, earliest search rank breaking ties; undefined when none is usable. */
export const findSourcePage = (
  suggestion: string,
  country: string,
  results: SearchResult[]
): SearchResult | undefined => {
  const siteTitles = findSiteTitles(results);
  const best = results.reduce<{ result: SearchResult; score: number } | undefined>((top, result) => {
    const score = scoreSourcePage(suggestion, country, result, siteTitles);
    return score > (top?.score ?? 0) ? { result, score } : top;
  }, undefined);

  return best ? { ...best.result, link: cleanSourceUrl(best.result.link) } : undefined;
};
