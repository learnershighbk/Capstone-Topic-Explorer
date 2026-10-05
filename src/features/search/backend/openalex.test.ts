import { describe, expect, it } from 'vitest';
import {
  filterRelevant,
  formatOpenAlexAuthor,
  rankDiscoveredWorks,
  toDiscoveredReference,
  type OpenAlexWork,
} from './openalex';

const CURRENT_YEAR = 2026;

const work = (overrides: Partial<OpenAlexWork>): OpenAlexWork => ({
  id: 'https://openalex.org/W1',
  title: 'Cash transfers and school enrollment',
  publication_year: 2020,
  cited_by_count: 10,
  relevance_score: 60,
  ...overrides,
});

describe('filterRelevant', () => {
  it('drops results far less relevant than the best match', () => {
    const loose = work({ id: 'W2', relevance_score: 20 });
    expect(filterRelevant([work({}), loose])).toEqual([work({})]);
  });

  it('keeps everything when no relevance scores are present', () => {
    const works = [work({ relevance_score: undefined }), work({ id: 'W2', relevance_score: undefined })];
    expect(filterRelevant(works)).toEqual(works);
  });
});

describe('rankDiscoveredWorks', () => {
  it('ranks by citations per year so a new paper can outrank an older one with more citations', () => {
    const older = work({ id: 'W-old', publication_year: 2020, cited_by_count: 70 });
    const newer = work({ id: 'W-new', publication_year: 2025, cited_by_count: 40 });

    expect(rankDiscoveredWorks([[older, newer]], CURRENT_YEAR).map((w) => w.id)).toEqual(['W-new', 'W-old']);
  });

  it('ranks an on-topic work above a more cited one that only brushes the topic', () => {
    const onTopic = work({ id: 'W-topic', cited_by_count: 59, relevance_score: 117 });
    const tangential = work({ id: 'W-tangent', cited_by_count: 135, relevance_score: 84 });

    expect(rankDiscoveredWorks([[tangential, onTopic]], CURRENT_YEAR).map((w) => w.id)).toEqual([
      'W-topic',
      'W-tangent',
    ]);
  });

  it('de-duplicates a work returned by several queries, keeping its best score', () => {
    const strong = work({ relevance_score: 100 });
    const weak = work({ relevance_score: 60 });
    const other = work({ id: 'W2', cited_by_count: 30, relevance_score: 100 });

    const ranked = rankDiscoveredWorks([[weak, other], [strong]], CURRENT_YEAR);

    expect(ranked).toHaveLength(2);
    expect(ranked[0].id).toBe('W2');
    expect(ranked[1]).toBe(strong);
  });

  it('skips works without a title', () => {
    expect(rankDiscoveredWorks([[work({ title: null })]], CURRENT_YEAR)).toEqual([]);
  });
});

describe('formatOpenAlexAuthor', () => {
  it('turns a display name into surname and initials', () => {
    expect(formatOpenAlexAuthor('Md Abdullah Omar')).toBe('Omar, M. A.');
  });

  it('keeps a single-word name', () => {
    expect(formatOpenAlexAuthor('OECD')).toBe('OECD');
  });
});

describe('toDiscoveredReference', () => {
  it('links the DOI and strips its URL prefix', () => {
    const reference = toDiscoveredReference(
      work({
        doi: 'https://doi.org/10.1257/pol.20190245',
        authorships: [{ author: { display_name: 'Esther Duflo' } }],
        primary_location: { source: { display_name: 'AEJ: Economic Policy' } },
      }),
      '2026-10-05T00:00:00.000Z'
    );

    expect(reference).toMatchObject({
      doi: '10.1257/pol.20190245',
      url: 'https://doi.org/10.1257/pol.20190245',
      authors: ['Duflo, E.'],
      source: 'AEJ: Economic Policy',
      cited_by_count: 10,
    });
  });

  it('falls back to the landing page when there is no DOI', () => {
    const reference = toDiscoveredReference(
      work({ doi: null, primary_location: { landing_page_url: 'https://example.org/report' } }),
      '2026-10-05T00:00:00.000Z'
    );

    expect(reference.url).toBe('https://example.org/report');
    expect(reference.doi).toBeUndefined();
    expect(reference.source).toBe('OpenAlex');
  });
});
