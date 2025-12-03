import type { TrustedSource } from '@/types';

export const TRUSTED_SOURCES: TrustedSource[] = [
  // International Organizations - Global
  {
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org',
    description: 'Free and open access to global development data',
    type: 'international_org',
    countries: ['global'],
    topics: ['development', 'economy', 'health', 'education', 'poverty', 'finance', 'trade'],
  },
  {
    name: 'UN Data',
    url: 'https://data.un.org',
    description: 'United Nations statistical databases',
    type: 'international_org',
    countries: ['global'],
    topics: ['population', 'development', 'environment', 'health', 'gender', 'migration'],
  },
  {
    name: 'OECD Data',
    url: 'https://data.oecd.org',
    description: 'OECD statistics and indicators',
    type: 'international_org',
    countries: ['global'],
    topics: ['economy', 'education', 'health', 'environment', 'governance', 'labor', 'tax'],
  },
  {
    name: 'IMF Data',
    url: 'https://data.imf.org',
    description: 'International Monetary Fund data',
    type: 'international_org',
    countries: ['global'],
    topics: ['economy', 'finance', 'trade', 'monetary', 'fiscal'],
  },
  {
    name: 'WHO Global Health Observatory',
    url: 'https://www.who.int/data/gho',
    description: 'World Health Organization health data',
    type: 'international_org',
    countries: ['global'],
    topics: ['health', 'healthcare', 'disease', 'mortality', 'vaccination', 'medicine'],
  },
  {
    name: 'UNESCO Institute for Statistics',
    url: 'https://uis.unesco.org',
    description: 'Education, science, culture and communication data',
    type: 'international_org',
    countries: ['global'],
    topics: ['education', 'science', 'culture', 'literacy', 'research'],
  },
  {
    name: 'ILO Statistics (ILOSTAT)',
    url: 'https://ilostat.ilo.org',
    description: 'International Labour Organization statistics',
    type: 'international_org',
    countries: ['global'],
    topics: ['labor', 'employment', 'wage', 'social protection', 'working conditions'],
  },
  {
    name: 'FAO Statistics (FAOSTAT)',
    url: 'https://www.fao.org/faostat',
    description: 'Food and Agriculture Organization data',
    type: 'international_org',
    countries: ['global'],
    topics: ['agriculture', 'food', 'nutrition', 'forestry', 'fisheries'],
  },
  {
    name: 'UNICEF Data',
    url: 'https://data.unicef.org',
    description: 'Data on children and women worldwide',
    type: 'international_org',
    countries: ['global'],
    topics: ['children', 'education', 'health', 'nutrition', 'protection'],
  },
  {
    name: 'UNDP Human Development Reports',
    url: 'https://hdr.undp.org/data-center',
    description: 'Human Development Index and related data',
    type: 'international_org',
    countries: ['global'],
    topics: ['development', 'inequality', 'gender', 'sustainability'],
  },

  // Regional Development Banks
  {
    name: 'Asian Development Bank Data Library',
    url: 'https://data.adb.org',
    description: 'ADB statistics and indicators for Asia',
    type: 'international_org',
    countries: ['global', 'Asia'],
    topics: ['development', 'economy', 'infrastructure', 'climate'],
  },
  {
    name: 'African Development Bank Data Portal',
    url: 'https://dataportal.opendataforafrica.org',
    description: 'African Development Bank statistics',
    type: 'international_org',
    countries: ['global', 'Africa'],
    topics: ['development', 'economy', 'infrastructure'],
  },
  {
    name: 'Inter-American Development Bank Data',
    url: 'https://data.iadb.org',
    description: 'IDB data for Latin America and Caribbean',
    type: 'international_org',
    countries: ['global', 'Latin America'],
    topics: ['development', 'economy', 'social'],
  },

  // South Korea
  {
    name: 'Korean Statistical Information Service (KOSIS)',
    url: 'https://kosis.kr',
    description: 'Official statistics portal of South Korea',
    type: 'government',
    countries: ['South Korea'],
    topics: ['economy', 'population', 'health', 'education', 'environment', 'labor'],
  },
  {
    name: 'Korea Development Institute (KDI)',
    url: 'https://www.kdi.re.kr',
    description: 'Korea Development Institute research data',
    type: 'government',
    countries: ['South Korea'],
    topics: ['economy', 'policy', 'development', 'finance'],
  },
  {
    name: 'Bank of Korea Economic Statistics System (ECOS)',
    url: 'https://ecos.bok.or.kr',
    description: 'Bank of Korea economic statistics',
    type: 'government',
    countries: ['South Korea'],
    topics: ['economy', 'finance', 'monetary', 'banking'],
  },
  {
    name: 'Korea Health Industry Development Institute',
    url: 'https://www.khidi.or.kr',
    description: 'Health industry statistics and research',
    type: 'government',
    countries: ['South Korea'],
    topics: ['health', 'healthcare', 'pharmaceutical', 'medical'],
  },

  // Academic Sources
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com',
    description: 'Academic literature search engine',
    type: 'academic',
    countries: ['global'],
    topics: ['all'],
  },
  {
    name: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org',
    description: 'AI-powered research tool',
    type: 'academic',
    countries: ['global'],
    topics: ['all'],
  },
  {
    name: 'JSTOR',
    url: 'https://www.jstor.org',
    description: 'Digital library of academic journals',
    type: 'academic',
    countries: ['global'],
    topics: ['all'],
  },
  {
    name: 'PubMed',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    description: 'Biomedical literature database',
    type: 'academic',
    countries: ['global'],
    topics: ['health', 'medicine', 'biology', 'life sciences'],
  },
  {
    name: 'SSRN',
    url: 'https://www.ssrn.com',
    description: 'Social Science Research Network',
    type: 'academic',
    countries: ['global'],
    topics: ['social science', 'economics', 'law', 'management'],
  },

  // NGOs and Think Tanks
  {
    name: 'Transparency International',
    url: 'https://www.transparency.org/en/cpi',
    description: 'Corruption Perceptions Index',
    type: 'ngo',
    countries: ['global'],
    topics: ['governance', 'corruption', 'transparency'],
  },
  {
    name: 'Freedom House',
    url: 'https://freedomhouse.org',
    description: 'Freedom in the World reports',
    type: 'ngo',
    countries: ['global'],
    topics: ['democracy', 'freedom', 'human rights', 'governance'],
  },
  {
    name: 'Human Rights Watch',
    url: 'https://www.hrw.org',
    description: 'Human rights research and advocacy',
    type: 'ngo',
    countries: ['global'],
    topics: ['human rights', 'justice', 'governance'],
  },
  {
    name: 'Brookings Institution',
    url: 'https://www.brookings.edu',
    description: 'Public policy research organization',
    type: 'ngo',
    countries: ['global', 'United States'],
    topics: ['policy', 'governance', 'economy', 'foreign policy'],
  },

  // Environment
  {
    name: 'Climate Watch',
    url: 'https://www.climatewatchdata.org',
    description: 'Climate data for action',
    type: 'international_org',
    countries: ['global'],
    topics: ['climate', 'environment', 'emissions', 'sustainability'],
  },
  {
    name: 'Global Forest Watch',
    url: 'https://www.globalforestwatch.org',
    description: 'Forest monitoring and alert data',
    type: 'ngo',
    countries: ['global'],
    topics: ['environment', 'forestry', 'deforestation', 'biodiversity'],
  },

  // Trade and Economics
  {
    name: 'WTO Statistics',
    url: 'https://stats.wto.org',
    description: 'World Trade Organization trade data',
    type: 'international_org',
    countries: ['global'],
    topics: ['trade', 'tariffs', 'exports', 'imports'],
  },
  {
    name: 'UN Comtrade',
    url: 'https://comtrade.un.org',
    description: 'International trade statistics',
    type: 'international_org',
    countries: ['global'],
    topics: ['trade', 'exports', 'imports', 'commodities'],
  },
];

export function findTrustedSources(country: string, topic: string): TrustedSource[] {
  const lowerTopic = topic.toLowerCase();

  return TRUSTED_SOURCES.filter((source) => {
    const countryMatch =
      source.countries.includes('global') ||
      source.countries.some(
        (c) => c.toLowerCase() === country.toLowerCase()
      );

    const topicMatch =
      source.topics.includes('all') ||
      source.topics.some((t) => lowerTopic.includes(t.toLowerCase()));

    return countryMatch && topicMatch;
  });
}
