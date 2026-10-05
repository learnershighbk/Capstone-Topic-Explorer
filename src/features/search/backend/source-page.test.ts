import { describe, expect, it } from 'vitest';
import {
  findSourcePage,
  hostNamesSource,
  isSiteFrontPage,
  parseSourceSuggestion,
  scoreSourcePage,
  sourceAcronyms,
  titleIsFromSuggestion,
} from './source-page';

const result = (title: string, link: string) => ({ title, link, snippet: '' });

describe('parseSourceSuggestion', () => {
  it('splits the name from the description', () => {
    expect(parseSourceSuggestion('KOSIS (Korean Statistical Information Service): monthly labor data')).toEqual({
      name: 'KOSIS (Korean Statistical Information Service)',
      detail: 'monthly labor data',
    });
    expect(parseSourceSuggestion('Labour Force Survey - quarterly employment data').name).toBe('Labour Force Survey');
    expect(parseSourceSuggestion('World Development Indicators')).toEqual({
      name: 'World Development Indicators',
      detail: '',
    });
  });
});

describe('sourceAcronyms', () => {
  it('collects parenthesized, all-caps and initial acronyms', () => {
    expect(sourceAcronyms('Korean Statistical Information Service (KOSIS)')).toContain('kosis');
    expect(sourceAcronyms('WHO Global Health Observatory')).toContain('who');
    expect(sourceAcronyms('Bank of Korea Economic Statistics System (ECOS)')).toEqual(
      expect.arrayContaining(['ecos', 'bokess'])
    );
    expect(sourceAcronyms('Ministry of Employment and Labor')).toContain('moel');
    expect(sourceAcronyms('Korean Labor and Income Panel Study (KLIPS), Korea Labor Institute')).toEqual(
      expect.arrayContaining(['klips', 'kli'])
    );
    expect(sourceAcronyms('Statistics Korea')).toEqual([]);
  });
});

describe('hostNamesSource', () => {
  it("recognizes the source's own site by acronym or a distinctive word", () => {
    expect(hostNamesSource('https://kosis.kr/eng/', 'Korean Statistical Information Service (KOSIS)', 'South Korea')).toBe(true);
    expect(hostNamesSource('https://www.who.int/data/gho', 'WHO Global Health Observatory', 'Indonesia')).toBe(true);
    expect(hostNamesSource('https://www.bps.go.id/en', 'BPS-Statistics Indonesia (Badan Pusat Statistik)', 'Indonesia')).toBe(true);
    expect(hostNamesSource('https://www.moel.go.kr/english/resources/statistics.do', 'Ministry of Employment and Labor', 'South Korea')).toBe(true);
    expect(hostNamesSource('https://www.bok.or.kr/eng/main/main.do', 'Bank of Korea Economic Statistics System (ECOS)', 'South Korea')).toBe(true);
  });

  it('does not treat generic or country words as ownership', () => {
    expect(hostNamesSource('https://www.korea.net/Government/Briefing-Room', 'Bank of Korea Economic Statistics System (ECOS)', 'South Korea')).toBe(false);
    expect(hostNamesSource('https://data360.worldbank.org/en/dataset/WHO_GHO', 'WHO Global Health Observatory', 'Indonesia')).toBe(false);
    expect(hostNamesSource('https://kebijakankesehatanindonesia.net/x', 'Ministry of Health Indonesia', 'Indonesia')).toBe(false);
  });
});

describe('isSiteFrontPage', () => {
  it('treats language and landing paths as the front page', () => {
    expect(isSiteFrontPage('https://kosis.kr')).toBe(true);
    expect(isSiteFrontPage('https://www.moel.go.kr/english/')).toBe(true);
    expect(isSiteFrontPage('https://www.bok.or.kr/eng/main/main.do')).toBe(true);
    expect(isSiteFrontPage('https://www.keis.or.kr/keis/en/index.do')).toBe(true);
    expect(isSiteFrontPage('https://www.nso.gov.vn/en/homepage/')).toBe(true);
    expect(isSiteFrontPage('https://www.bps.go.id/en?lang=en')).toBe(true);
    expect(isSiteFrontPage('https://www.bok.or.kr/imerEng/main/main.do')).toBe(true);
    expect(isSiteFrontPage('https://survey.keis.or.kr/eng/goms/index.jsp')).toBe(false);
  });

  it('treats dataset and report pages as specific', () => {
    expect(isSiteFrontPage('https://www.kli.re.kr/menu.es?mid=a50101000000')).toBe(false);
    expect(isSiteFrontPage('https://www.moel.go.kr/english/resources/statistics.do')).toBe(false);
    expect(isSiteFrontPage('https://databank.worldbank.org/source/world-development-indicators')).toBe(false);
    expect(isSiteFrontPage('https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1B8000F')).toBe(false);
  });
});

describe('titleIsFromSuggestion', () => {
  const suggestion =
    'Korean Statistical Information Service (KOSIS): Economically Active Population Survey data on youth employment';

  it("accepts a title made of the suggestion's words, ignoring the site-name suffix", () => {
    expect(titleIsFromSuggestion(suggestion, 'Economically Active Population Survey - Statistics Korea')).toBe(true);
    expect(
      titleIsFromSuggestion(
        'BPS-Statistics Indonesia: National Socioeconomic Survey (SUSENAS)',
        'Susenas - Sistem Informasi Layanan Statistik'
      )
    ).toBe(true);
  });

  it('rejects titles that add their own subject', () => {
    expect(titleIsFromSuggestion(suggestion, 'Youth Labor Market Trends in South Korea, Oct 2024–Oct 2025')).toBe(false);
    expect(titleIsFromSuggestion(suggestion, 'Publication - BPS-Statistics Indonesia')).toBe(false);
    expect(titleIsFromSuggestion(suggestion, 'Korea')).toBe(false);
  });
});

describe('findSourcePage', () => {
  const country = 'South Korea';

  it("prefers a specific page on the source's own site over a third-party directory", () => {
    const suggestion = 'Ministry of Employment and Labor: Employment Insurance statistics';
    const chosen = findSourcePage(suggestion, country, [
      result('Ministry of Employment and Labor (MOEL) of the Republic of Korea', 'https://www.decentjobsforyouth.org/partner/3746'),
      result('Ministry of Employment and Labor> > Statistics - 고용노동부', 'https://www.moel.go.kr/english/resources/statistics.do'),
      result('고용노동부', 'https://www.moel.go.kr/'),
    ]);
    expect(chosen?.link).toBe('https://www.moel.go.kr/english/resources/statistics.do');
  });

  it("accepts the own site's front page only when nothing more specific names the source", () => {
    const suggestion = 'Korean Statistical Information Service (KOSIS): labor statistics';
    const chosen = findSourcePage(suggestion, country, [
      result('KOSIS KOrean Statistical Information Service', 'https://kosis.kr/eng/'),
      result('Vital Statistics of Korea', 'https://kosis.kr/statHtml/statHtml.do?orgId=101'),
    ]);
    expect(chosen?.link).toBe('https://kosis.kr/eng/');
  });

  it("never links another organization's front page or a non-publisher", () => {
    const suggestion = 'Bank of Korea Economic Statistics System (ECOS): macroeconomic indicators';
    expect(scoreSourcePage(suggestion, country, result('Ministry of Finance and Economy', 'https://english.mofe.go.kr/'))).toBe(0);
    expect(
      scoreSourcePage(suggestion, country, result('Economic Statistics System (Bank of Korea)', 'https://dateno.io/registry/catalog/cdi00004413/'))
    ).toBe(0);
    expect(scoreSourcePage(suggestion, country, result('Bank of Korea', 'https://en.wikipedia.org/wiki/Bank_of_Korea'))).toBe(0);
  });

  it("prefers the page naming the dataset over the site's generic pages, and strips session ids", () => {
    const suggestion = 'Korean Statistical Information Service (KOSIS): Economically Active Population Survey data';
    const chosen = findSourcePage(suggestion, country, [
      result('KOSIS KOrean Statistical Information Service', 'https://kosis.kr/eng/bulletinBoard/pressReleasesList.do;jsessionid=ABC123'),
      result('Economically Active Population Survey | KOSIS', 'https://kosis.kr/statHtml/statHtml.do;jsessionid=XYZ?orgId=101'),
    ]);
    expect(chosen?.link).toBe('https://kosis.kr/statHtml/statHtml.do?orgId=101');
  });

  it("prefers another official page titled by the dataset over the own site's unrelated page", () => {
    const suggestion =
      'Korean Statistical Information Service (KOSIS): Economically Active Population Survey data on youth employment';
    const chosen = findSourcePage(suggestion, country, [
      result('KOSIS KOrean Statistical Information Service', 'https://kosis.kr/eng/bulletinBoard/pressReleasesList.do'),
      result('Economically Active Population Survey - Statistics Korea', 'https://mods.go.kr/menu.es?mid=a20204010000'),
    ]);
    expect(chosen?.link).toBe('https://mods.go.kr/menu.es?mid=a20204010000');
  });

  it('does not let a loosely related third-party page outrank the own site', () => {
    const suggestion = 'Korea Employment Information Service (KEIS): Youth Panel Survey';
    const chosen = findSourcePage(suggestion, country, [
      result('Cohort Panel Project in Korea for Supporting Youth', 'https://www.decentjobsforyouth.org/commitment/407'),
      result('Employment Survey/htm/asapro_en/yp/yp01.jsp', 'https://survey.keis.or.kr/eng/yp/yp01.jsp'),
    ]);
    expect(chosen?.link).toBe('https://survey.keis.or.kr/eng/yp/yp01.jsp');
  });

  it("prefers a related page on the source's own site over a third-party page naming it", () => {
    const suggestion = 'WHO Global Health Observatory: Indonesia country profile';
    const chosen = findSourcePage(suggestion, 'Indonesia', [
      result('Indonesia - Health Country Profile', 'https://ourworldindata.org/profile/health/indonesia'),
      result('Indonesia - WHO Data', 'https://data.who.int/countries/360'),
    ]);
    expect(chosen?.link).toBe('https://data.who.int/countries/360');
  });

  it("prefers the portal's statistics list over its press-release list and front page", () => {
    const suggestion = 'Korean Statistical Information Service (KOSIS): regional labor market indicators';
    const siteTitle = 'KOSIS KOrean Statistical Information Service';
    const chosen = findSourcePage(suggestion, country, [
      result(siteTitle, 'https://kosis.kr/eng/'),
      result(siteTitle, 'https://kosis.kr/eng/bulletinBoard/pressReleasesList.do'),
      result(siteTitle, 'https://kosis.kr/eng/statisticsList/statisticsListIndex.do?menuId=M_01_01'),
    ]);
    expect(chosen?.link).toBe('https://kosis.kr/eng/statisticsList/statisticsListIndex.do?menuId=M_01_01');
  });

  it("keeps a dataset's own 'About' page ahead of a third-party catalog", () => {
    const suggestion = 'Korean Labor and Income Panel Study (KLIPS), Korea Labor Institute: longitudinal household survey';
    const chosen = findSourcePage(suggestion, country, [
      result('Korean Labor and Income Panel Study', 'https://atlaslongitudinaldatasets.ac.uk/datasets/klips'),
      result('About KLIPS : 한국노동패널조사 영문', 'https://www.kli.re.kr/menu.es?mid=a50101000000'),
    ]);
    expect(chosen?.link).toBe('https://www.kli.re.kr/menu.es?mid=a50101000000');
  });

  it('prefers the data page over a board attachment and a PDF report on the same site', () => {
    const klips = 'Korean Labor and Income Panel Study (KLIPS), Korea Labor Institute: longitudinal household survey';
    expect(
      findSourcePage(klips, country, [
        result('KLIPS User Guide', 'https://www.kli.re.kr/boardDownload.es?bid=0055&list_no=102610&seq=10861'),
        result('About KLIPS : 한국노동패널조사 영문', 'https://www.kli.re.kr/menu.es?mid=a50101000000'),
      ])?.link
    ).toBe('https://www.kli.re.kr/menu.es?mid=a50101000000');

    const youngLives = 'Young Lives Ethiopia: longitudinal child and household data';
    expect(
      findSourcePage(youngLives, 'Ethiopia', [
        result('Young Lives Ethiopia Lessons from Longitudinal Research', 'https://www.younglives.org.uk/sites/default/files/Ethiopia-Report.pdf'),
        result('Data | Young Lives', 'https://www.younglives.org.uk/data'),
      ])?.link
    ).toBe('https://www.younglives.org.uk/data');
  });

  it("ranks a president's greeting page no higher than the front page", () => {
    const suggestion = 'Korea Employment Information Service (KEIS) Employment Insurance Database: administrative records';
    const chosen = findSourcePage(suggestion, country, [
      result('About KEIS | KEIS President', 'https://www.keis.or.kr/keis/en/conts/306/web.do'),
      result('Korea Employment Information Service KEIS', 'https://www.keis.or.kr/keis/en/index.do'),
    ]);
    expect(chosen?.link).toBe('https://www.keis.or.kr/keis/en/index.do');
  });

  it('accepts a university host for a dataset it publishes', () => {
    const suggestion = 'CHIRPS rainfall data (Climate Hazards Group, UC Santa Barbara): gridded rainfall';
    const chosen = findSourcePage(suggestion, 'Ethiopia', [
      result('CHIRPS: Rainfall Estimates from Rain Gauge and Satellite Observations', 'https://www.chc.ucsb.edu/data/chirps'),
      result('Rainfall estimates (CHIRPS)', 'https://docs.digitalearthafrica.org/en/latest/data_specs/CHIRPS_specs.html'),
    ]);
    expect(chosen?.link).toBe('https://www.chc.ucsb.edu/data/chirps');
  });

  it('does not mistake a catalog for the source because the acronym is in its path', () => {
    expect(hostNamesSource('https://atlaslongitudinaldatasets.ac.uk/datasets/klips', 'Korean Labor and Income Panel Study (KLIPS)', 'South Korea')).toBe(false);
  });

  it('returns undefined when no result names the source', () => {
    expect(findSourcePage('Youth Panel Survey', country, [result('Korea Herald news', 'https://www.koreaherald.com/a')])).toBeUndefined();
  });
});
