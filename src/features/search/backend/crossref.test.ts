import { describe, expect, it } from 'vitest';
import { assessCrossrefResults, toVerifiedReference, type CrossrefWork } from './crossref';
import type { AiReference } from '@/types';

const DUFLO_TITLE =
  'Schooling and Labor Market Consequences of School Construction in Indonesia: Evidence from an Unusual Policy Experiment';

const duflo: AiReference = {
  authors: ['Duflo, E.'],
  year: 2001,
  title: DUFLO_TITLE,
  venue: 'American Economic Review',
};

const work = (overrides: Partial<CrossrefWork>): CrossrefWork => ({
  DOI: '10.0000/x',
  title: [DUFLO_TITLE],
  author: [{ given: 'Esther', family: 'Duflo' }],
  issued: { 'date-parts': [[2001]] },
  type: 'journal-article',
  ...overrides,
});

const pickCrossrefMatch = (reference: AiReference, works: CrossrefWork[]) => {
  const assessment = assessCrossrefResults(reference, works);
  return assessment.kind === 'match' ? assessment.work : null;
};

describe('assessCrossrefResults', () => {
  it('prefers the published version closest to the cited year over preprints', () => {
    const nber = work({ DOI: '10.3386/w7860', issued: { 'date-parts': [[2000]] }, type: 'report' });
    const ssrn = work({ DOI: '10.2139/ssrn.229794', issued: { 'date-parts': [[2000]] }, type: 'posted-content' });
    const aer = work({ DOI: '10.1257/aer.91.4.795', 'container-title': ['American Economic Review'] });

    expect(pickCrossrefMatch(duflo, [nber, ssrn, aer])?.DOI).toBe('10.1257/aer.91.4.795');
  });

  it('flags a real title attributed to the wrong author', () => {
    const misattributed: AiReference = { ...duflo, authors: ['Kim, J.'] };
    expect(assessCrossrefResults(misattributed, [work({})])).toEqual({ kind: 'misattributed' });
  });

  it('reports not_found when only the venue disagrees, so web search can still confirm it', () => {
    const book: AiReference = { ...duflo, venue: 'Crown' };
    const inOtherJournal = work({ 'container-title': ['ASEAN Economic Bulletin'] });
    expect(assessCrossrefResults(book, [inOtherJournal])).toEqual({ kind: 'not_found' });
  });

  it('rejects a match whose year is far from the cited one', () => {
    expect(pickCrossrefMatch({ ...duflo, year: 2015 }, [work({})])).toBeNull();
  });

  it('rejects works with unrelated titles', () => {
    expect(pickCrossrefMatch(duflo, [work({ title: ['Education and growth in Asia'] })])).toBeNull();
  });

  it('rejects a book review standing in for the book', () => {
    const book: AiReference = { authors: ['Acemoglu, D.'], year: 2012, title: 'Why Nations Fail', venue: 'Crown' };
    const review = work({
      title: ['Why Nations Fail'],
      author: [{ given: 'Daron', family: 'Acemoglu' }],
      issued: { 'date-parts': [[2012]] },
      'container-title': ['ASEAN Economic Bulletin'],
    });
    expect(pickCrossrefMatch(book, [review])).toBeNull();
  });

  it('skips the author check for institutional authors', () => {
    const oecd: AiReference = { authors: ['OECD'], year: 2022, title: 'Education at a Glance 2022', venue: '' };
    const report = work({ title: ['Education at a Glance 2022'], author: undefined, issued: { 'date-parts': [[2022]] } });
    expect(pickCrossrefMatch(oecd, [report])).not.toBeNull();
  });

  it('matches accented surnames', () => {
    const cited: AiReference = { ...duflo, authors: ['Muller, K.'] };
    expect(pickCrossrefMatch(cited, [work({ author: [{ given: 'Karl', family: 'Müller' }] })])).not.toBeNull();
  });
});

describe('toVerifiedReference', () => {
  it('uses registry metadata and links the DOI', () => {
    const verified = toVerifiedReference(
      duflo,
      work({
        DOI: '10.1257/aer.91.4.795',
        title: ['<i>Schooling</i> and Labor Market Consequences'],
        subtitle: ['Evidence'],
        author: [{ given: 'Esther', family: 'Duflo' }],
        'container-title': ['American Economic Review'],
      }),
      '2026-10-05T00:00:00.000Z'
    );

    expect(verified).toMatchObject({
      title: 'Schooling and Labor Market Consequences: Evidence',
      authors: ['Duflo, E.'],
      year: 2001,
      source: 'American Economic Review',
      doi: '10.1257/aer.91.4.795',
      url: 'https://doi.org/10.1257/aer.91.4.795',
    });
  });
});
