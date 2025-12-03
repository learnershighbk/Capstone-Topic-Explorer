import { success, failure, type HandlerResult } from '@/backend/http/response';
import { SEARCH_ERROR_CODES, type SearchErrorCode } from './error';
import { findTrustedSources } from '@/data/trusted-sources';
import type { VerifiedDataSource, VerifiedReference, SourceType } from '@/types';
import type { DataSourcesResponse, ReferencesResponse } from './schema';

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

async function searchSerper(query: string): Promise<SerperSearchResult[]> {
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
        num: 5,
      }),
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

function inferSourceType(url: string): SourceType {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('.gov') || lowerUrl.includes('.go.kr')) {
    return 'government';
  }

  if (
    lowerUrl.includes('worldbank') ||
    lowerUrl.includes('un.org') ||
    lowerUrl.includes('imf.org') ||
    lowerUrl.includes('oecd.org') ||
    lowerUrl.includes('who.int') ||
    lowerUrl.includes('unesco.org') ||
    lowerUrl.includes('ilo.org') ||
    lowerUrl.includes('fao.org') ||
    lowerUrl.includes('adb.org')
  ) {
    return 'international_org';
  }

  if (
    lowerUrl.includes('.edu') ||
    lowerUrl.includes('scholar.google') ||
    lowerUrl.includes('jstor.org') ||
    lowerUrl.includes('pubmed') ||
    lowerUrl.includes('semanticscholar')
  ) {
    return 'academic';
  }

  if (lowerUrl.includes('.org')) {
    return 'ngo';
  }

  return 'other';
}

export async function verifyDataSources(
  country: string,
  topic: string,
  aiSuggestions: string[]
): Promise<HandlerResult<DataSourcesResponse, SearchErrorCode>> {
  const verifiedSources: VerifiedDataSource[] = [];
  const unverifiedSuggestions: string[] = [];

  // 1. Get matching trusted sources
  const trustedMatches = findTrustedSources(country, topic);

  for (const source of trustedMatches) {
    verifiedSources.push({
      name: source.name,
      url: source.url,
      description: source.description,
      source_type: source.type,
      verified_at: new Date().toISOString(),
    });
  }

  // 2. Verify AI suggestions via web search
  for (const suggestion of aiSuggestions) {
    const alreadyIncluded = verifiedSources.some(
      (v) => v.name.toLowerCase().includes(suggestion.toLowerCase()) ||
             suggestion.toLowerCase().includes(v.name.toLowerCase())
    );

    if (alreadyIncluded) {
      continue;
    }

    const query = `${suggestion} ${country} data statistics official site`;
    const results = await searchSerper(query);

    const relevant = results.find(
      (r) =>
        r.link.includes('.gov') ||
        r.link.includes('.org') ||
        r.link.includes('worldbank') ||
        r.link.includes('un.org') ||
        r.link.includes('oecd') ||
        r.link.includes('data.')
    );

    if (relevant) {
      verifiedSources.push({
        name: suggestion,
        url: relevant.link,
        description: relevant.snippet.substring(0, 200),
        source_type: inferSourceType(relevant.link),
        verified_at: new Date().toISOString(),
      });
    } else {
      unverifiedSuggestions.push(suggestion);
    }
  }

  return success({
    verified_sources: verifiedSources,
    unverified_suggestions: unverifiedSuggestions,
  });
}

function parseReferenceString(
  text: string
): { title: string; authors: string[]; year: number } | null {
  // Pattern: "Author et al. (2023). Title Here"
  const match = text.match(/^(.+?)\s*\((\d{4})\)\.\s*(.+?)(?:\.|$)/);

  if (match) {
    return {
      authors: match[1].split(/,\s*|and\s*/).map((a) => a.trim()),
      year: parseInt(match[2], 10),
      title: match[3].trim(),
    };
  }

  // Pattern: "Title (Year)"
  const altMatch = text.match(/^(.+?)\s*\((\d{4})\)/);

  if (altMatch) {
    return {
      title: altMatch[1].trim(),
      authors: [],
      year: parseInt(altMatch[2], 10),
    };
  }

  return null;
}

export async function verifyReferences(
  country: string,
  topic: string,
  aiSuggestions: string[]
): Promise<HandlerResult<ReferencesResponse, SearchErrorCode>> {
  const verifiedReferences: VerifiedReference[] = [];
  const unverifiedSuggestions: string[] = [];

  for (const suggestion of aiSuggestions) {
    const parsed = parseReferenceString(suggestion);

    if (!parsed) {
      // Try direct search if parsing fails
      const query = `"${suggestion}" academic paper`;
      const results = await searchSerper(query);

      if (results.length > 0) {
        const result = results[0];
        verifiedReferences.push({
          title: suggestion,
          authors: [],
          year: new Date().getFullYear(),
          source: 'Academic Publication',
          url: result.link,
          verified_at: new Date().toISOString(),
        });
      } else {
        unverifiedSuggestions.push(suggestion);
      }
      continue;
    }

    const query = `"${parsed.title}" ${parsed.authors[0] || ''} ${parsed.year} academic`;
    const results = await searchSerper(query);

    const academicResult = results.find(
      (r) =>
        r.link.includes('scholar.google') ||
        r.link.includes('jstor') ||
        r.link.includes('pubmed') ||
        r.link.includes('doi.org') ||
        r.link.includes('researchgate') ||
        r.link.includes('semanticscholar') ||
        r.link.includes('ssrn') ||
        r.link.includes('.edu')
    );

    if (academicResult) {
      verifiedReferences.push({
        title: parsed.title,
        authors: parsed.authors,
        year: parsed.year,
        source: 'Academic Publication',
        url: academicResult.link,
        verified_at: new Date().toISOString(),
      });
    } else if (results.length > 0) {
      // Use first result if no academic source found
      verifiedReferences.push({
        title: parsed.title,
        authors: parsed.authors,
        year: parsed.year,
        source: 'Publication',
        url: results[0].link,
        verified_at: new Date().toISOString(),
      });
    } else {
      unverifiedSuggestions.push(suggestion);
    }
  }

  // Add some verified references for the topic via search
  if (verifiedReferences.length < 5) {
    const topicQuery = `${topic} ${country} policy research academic paper`;
    const additionalResults = await searchSerper(topicQuery);

    for (const result of additionalResults.slice(0, 3)) {
      const alreadyIncluded = verifiedReferences.some(
        (r) => r.url === result.link || r.title.toLowerCase() === result.title.toLowerCase()
      );

      if (!alreadyIncluded) {
        verifiedReferences.push({
          title: result.title,
          authors: [],
          year: new Date().getFullYear(),
          source: 'Search Result',
          url: result.link,
          verified_at: new Date().toISOString(),
        });
      }
    }
  }

  return success({
    verified_references: verifiedReferences,
    unverified_suggestions: unverifiedSuggestions,
  });
}
