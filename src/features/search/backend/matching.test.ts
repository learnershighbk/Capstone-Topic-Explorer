import { describe, expect, it } from 'vitest';
import {
  inferSourceType,
  isAcademicUrl,
  isOfficialDataUrl,
  sourceNameMatches,
  mentionsAnyAuthor,
  titlesMatch,
  venuesAgree,
} from './matching';
import { formatCitation } from '@/lib/citation';

describe('titlesMatch', () => {
  it('accepts a truncated search-result title of the same work', () => {
    expect(
      titlesMatch(
        'Why Nations Fail: The Origins of Power, Prosperity, and Poverty',
        '(PDF) Why Nations Fail: The Origins of Power, Prosperity ...'
      )
    ).toBe(true);
  });

  it('accepts titles containing periods such as "U.S."', () => {
    expect(
      titlesMatch(
        "U.S. trade policy and Korea's FTA strategy",
        "U.S. Trade Policy and Korea's FTA Strategy - JSTOR"
      )
    ).toBe(true);
  });

  it('rejects an unrelated page that shares only generic words', () => {
    expect(
      titlesMatch(
        'Fiscal decentralization and rural pension coverage in Mongolia',
        'Pension reform in Korea: lessons for Asia'
      )
    ).toBe(false);
  });

  it('rejects a result sharing a single word with a short title', () => {
    expect(titlesMatch('Education at a Glance 2022', 'Education - Wikipedia')).toBe(false);
  });
});

describe('URL classification', () => {
  it('matches academic hosts by domain, not substring', () => {
    expect(isAcademicUrl('https://www.jstor.org/stable/123')).toBe(true);
    expect(isAcademicUrl('https://economics.harvard.edu/paper')).toBe(true);
    expect(isAcademicUrl('https://www.education.gov.au/report')).toBe(false);
  });

  it('classifies source types', () => {
    expect(inferSourceType('https://www.education.gov.au')).toBe('government');
    expect(inferSourceType('https://kosis.go.kr')).toBe('government');
    expect(inferSourceType('https://data.worldbank.org')).toBe('international_org');
    expect(inferSourceType('https://www.hrw.org')).toBe('ngo');
    expect(inferSourceType('not a url')).toBe('other');
  });

  it('treats a lookalike host as non-official', () => {
    expect(isOfficialDataUrl('https://example.com/oecd.org-mirror')).toBe(false);
    expect(isOfficialDataUrl('https://stats.oecd.org')).toBe(true);
  });
});

describe('formatCitation', () => {
  it('formats a structured reference', () => {
    expect(
      formatCitation({
        authors: ['Acemoglu, D.', 'Robinson, J. A.'],
        year: 2012,
        title: 'Why Nations Fail',
        venue: 'Crown',
      })
    ).toBe('Acemoglu, D., Robinson, J. A. (2012). Why Nations Fail. Crown.');
  });

  it('passes legacy string references through', () => {
    expect(formatCitation('Kim, J. (2020). Title.')).toBe('Kim, J. (2020). Title.');
  });
});

describe('venuesAgree', () => {
  it('accepts the same venue, abbreviations, and missing venues', () => {
    expect(venuesAgree('American Economic Review', 'American Economic Review')).toBe(true);
    expect(venuesAgree('AER', 'American Economic Review')).toBe(true);
    expect(venuesAgree('Crown', '')).toBe(true);
  });

  it('rejects an unrelated journal and venues sharing only generic words', () => {
    expect(venuesAgree('Crown', 'ASEAN Economic Bulletin')).toBe(false);
    expect(venuesAgree('Journal of Finance', 'Journal of Public Economics')).toBe(false);
  });
});

describe('mentionsAnyAuthor', () => {
  it('finds a cited surname in a search snippet', () => {
    expect(mentionsAnyAuthor('D Acemoglu, S Johnson - American economic review, 2001', ['Acemoglu, D.'])).toBe(true);
  });

  it('rejects a snippet that names none of the cited authors', () => {
    expect(mentionsAnyAuthor('D Acemoglu, S Johnson - American economic review, 2001', ['Park, S.'])).toBe(false);
  });

  it('ignores a surname embedded in another word', () => {
    expect(mentionsAnyAuthor('This sparked a debate on institutions', ['Park, S.'])).toBe(false);
  });

  it('passes when no authors are cited', () => {
    expect(mentionsAnyAuthor('anything', [])).toBe(true);
  });
});

describe('data source names', () => {
  it('accepts a result titled by the source name or its acronym', () => {
    expect(sourceNameMatches('World Development Indicators', 'World Development Indicators | DataBank')).toBe(true);
    expect(sourceNameMatches('Korean Statistical Information Service (KOSIS)', 'KOSIS 국가통계포털')).toBe(true);
    expect(sourceNameMatches('Korean Labor and Income Panel Study', 'Korea Labor & Income Panel Study')).toBe(true);
  });

  it('rejects a result about something else on an official host', () => {
    expect(sourceNameMatches('Korea Labor and Income Panel Study', 'Ministry of Employment and Labor')).toBe(false);
    expect(sourceNameMatches('National Health Insurance Claims Data', 'Health - OECD')).toBe(false);
  });

  it('treats government hosts worldwide as official', () => {
    expect(isOfficialDataUrl('https://www.data.gov.in/catalog')).toBe(true);
    expect(isOfficialDataUrl('https://www.inegi.org.mx/temas')).toBe(true);
    expect(isOfficialDataUrl('https://www.bps.go.id/statistics')).toBe(true);
    expect(isOfficialDataUrl('https://www.kli.re.kr/klips')).toBe(true);
    expect(inferSourceType('https://www.bps.go.id')).toBe('government');
  });
});
