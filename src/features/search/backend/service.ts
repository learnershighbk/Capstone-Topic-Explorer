import { success, type HandlerResult } from '@/backend/http/response';
import type { SearchErrorCode } from './error';
import { formatCitation } from '@/lib/citation';
import type { AiReference, VerifiedDataSource, VerifiedReference } from '@/types';
import type { DataSourcesResponse, ReferencesResponse } from './schema';
import { getHostname, inferSourceType, isAcademicUrl, mentionsAnyAuthor, titlesMatch } from './matching';
import { findSourcePage, parseSourceSuggestion } from './source-page';
import { assessCrossrefResults, searchCrossref, toVerifiedReference } from './crossref';

const SERPER_TIMEOUT_MS = 8000;
const DEFAULT_RESULT_COUNT = 5;
/** Serper bills per query up to 10 results; more candidates raise the odds of a specific page. */
const DATA_SOURCE_RESULT_COUNT = 10;

interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerperResponse {
  organic?: SerperSearchResult[];
  searchParameters?: {
    q: string;
  };
}

async function searchSerper(
  query: string,
  resultCount: number = DEFAULT_RESULT_COUNT
): Promise<SerperSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: resultCount,
      }),
      signal: AbortSignal.timeout(SERPER_TIMEOUT_MS),
    });

    if (!response.ok) {
      return [];
    }

    const data: SerperResponse = await response.json();
    return data.organic || [];
  } catch {
    return [];
  }
}

/**
 * Confirms each AI-suggested data source by web search and links the page that publishes it.
 * The query carries the whole suggestion because the dataset is often named only in the detail
 * ("Ministry of Employment and Labor: Employment Insurance statistics"); the organization alone
 * returned its front page and third-party directories. Suggestions without a usable page stay
 * unverified rather than linking an unrelated site.
 */
export async function verifyDataSources(
  country: string,
  aiSuggestions: string[]
): Promise<HandlerResult<DataSourcesResponse, SearchErrorCode>> {
  const verifiedAt = new Date().toISOString();

  const searchOutcomes = await Promise.all(
    aiSuggestions.map(async (suggestion) => {
      const { name, detail } = parseSourceSuggestion(suggestion);
      const results = await searchSerper(`${name} ${detail} ${country}`, DATA_SOURCE_RESULT_COUNT);
      return { suggestion, sourcePage: findSourcePage(suggestion, country, results) };
    })
  );

  return success({
    verified_sources: searchOutcomes.flatMap(({ suggestion, sourcePage }) =>
      sourcePage
        ? [
            {
              name: suggestion,
              url: sourcePage.link,
              description: sourcePage.snippet.substring(0, 200),
              source_type: inferSourceType(sourcePage.link),
              verified_at: verifiedAt,
            },
          ]
        : []
    ),
    unverified_suggestions: searchOutcomes
      .filter(({ sourcePage }) => !sourcePage)
      .map(({ suggestion }) => suggestion),
  });
}

const firstAuthorSurname = (reference: AiReference) =>
  reference.authors[0]?.split(',')[0]?.trim() ?? '';

/**
 * Looks a reference up by its exact title on the web and accepts it only when a search result's
 * title names the same work, preferring scholarly hosts. Covers books and institutional reports
 * that have no DOI.
 */
async function verifyReferenceByWebSearch(
  reference: AiReference,
  verifiedAt: string
): Promise<VerifiedReference | null> {
  const query = `"${reference.title}" ${firstAuthorSurname(reference)} ${reference.year}`;
  const results = await searchSerper(query);

  const matchingResults = results.filter(
    (r) =>
      titlesMatch(reference.title, r.title) &&
      mentionsAnyAuthor(`${r.title} ${r.snippet} ${r.link}`, reference.authors)
  );
  const bestMatch = matchingResults.find((r) => isAcademicUrl(r.link)) ?? matchingResults[0];

  if (!bestMatch) {
    return null;
  }

  return {
    title: reference.title,
    authors: reference.authors,
    year: reference.year,
    source: reference.venue || getHostname(bestMatch.link) || 'Web',
    url: bestMatch.link,
    verified_at: verifiedAt,
  };
}

/**
 * Verifies against the Crossref DOI registry first, then falls back to web search for works
 * without a DOI. Returns null when the work is unconfirmed or Crossref shows it under other
 * authors, so it is shown as unverified rather than linked to an unrelated page.
 */
async function verifyReference(
  reference: AiReference,
  verifiedAt: string
): Promise<VerifiedReference | null> {
  const assessment = assessCrossrefResults(reference, await searchCrossref(reference));

  if (assessment.kind === 'match') {
    return toVerifiedReference(reference, assessment.work, verifiedAt);
  }

  if (assessment.kind === 'misattributed') {
    return null;
  }

  return verifyReferenceByWebSearch(reference, verifiedAt);
}

export async function verifyReferences(
  references: AiReference[]
): Promise<HandlerResult<ReferencesResponse, SearchErrorCode>> {
  const verifiedAt = new Date().toISOString();

  const outcomes = await Promise.all(
    references.map(async (reference) => ({
      reference,
      verified: await verifyReference(reference, verifiedAt),
    }))
  );

  return success({
    verified_references: outcomes.flatMap(({ verified }) => (verified ? [verified] : [])),
    unverified_suggestions: outcomes
      .filter(({ verified }) => !verified)
      .map(({ reference }) => formatCitation(reference)),
  });
}
