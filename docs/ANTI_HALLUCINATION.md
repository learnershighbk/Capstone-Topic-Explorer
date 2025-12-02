# Anti-Hallucination Strategy

## 개요

Step 4 "Detailed Topic Analysis"에서 제공되는 **Potential Data Sources**와 **Key References**의 할루시네이션 문제를 해결하기 위한 전략입니다.

---

## 현재 문제점 (v1.0)

### 1. Data Sources 할루시네이션

현재 AI가 생성하는 데이터 소스 목록의 문제:
- 존재하지 않는 데이터베이스 이름 생성
- 잘못된 URL 제공
- 폐쇄되거나 접근 불가능한 소스 제안
- 국가별로 맞지 않는 소스 제안

**예시 (문제 있는 응답):**
```
- Bangladesh Bureau of Statistics (잘못된 URL 가능)
- Non-existent Data Portal (존재하지 않음)
- Outdated Government Database (폐쇄된 사이트)
```

### 2. Key References 할루시네이션

현재 AI가 생성하는 참고문헌의 문제:
- 실제 존재하지 않는 논문/저자 생성
- 잘못된 출판 연도
- 가짜 DOI 번호
- 존재하지 않는 학술지 이름

**예시 (문제 있는 응답):**
```
- Kim et al. (2024). "Fake Title" - 존재하지 않는 논문
- World Bank (2025). "Future Report" - 아직 발간되지 않은 보고서
```

---

## 해결 전략

### 전략 1: 웹 검색 기반 검증

AI가 제안한 소스/참고문헌을 웹 검색으로 실제 존재 여부를 확인합니다.

```
AI 생성 → 웹 검색 → 검증 → 검증된 결과만 표시
```

### 전략 2: 신뢰할 수 있는 소스 데이터베이스

미리 검증된 데이터 소스 목록을 유지하고, 국가/주제별로 매칭합니다.

### 전략 3: 하이브리드 접근

AI 생성 + 웹 검색 + 사전 정의된 신뢰 소스 조합

---

## 구현 방안

### 1. 웹 검색 API 통합

Google Custom Search API 또는 Serper API를 사용하여 실시간 검색:

```typescript
// src/lib/search.ts
import { SerperClient } from './serper';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function verifyDataSource(
  sourceName: string,
  country: string,
  topic: string
): Promise<SearchResult | null> {
  const query = `${sourceName} ${country} ${topic} official data statistics site`;
  
  const results = await SerperClient.search(query, {
    num: 5,
    type: 'search'
  });
  
  // 첫 번째 관련 결과 반환
  const relevant = results.find(r => 
    r.url.includes('.gov') ||
    r.url.includes('.org') ||
    r.url.includes('worldbank') ||
    r.url.includes('un.org') ||
    r.url.includes('oecd.org')
  );
  
  return relevant || null;
}
```

### 2. 참고문헌 검증 (Google Scholar / Semantic Scholar)

```typescript
// src/lib/search.ts
export async function verifyReference(
  title: string,
  authors: string[],
  year: number
): Promise<VerifiedReference | null> {
  // Google Scholar 검색 (Serper API 사용)
  const query = `"${title}" ${authors[0]} ${year} site:scholar.google.com`;
  
  const results = await SerperClient.search(query, {
    num: 3,
    type: 'scholar'
  });
  
  if (results.length === 0) return null;
  
  // 제목 유사도 확인
  const match = results.find(r => 
    similarity(r.title, title) > 0.7
  );
  
  if (!match) return null;
  
  return {
    title: match.title,
    authors: match.authors || authors,
    year: match.year || year,
    source: match.publication || '',
    url: match.link,
    doi: extractDOI(match),
    verified_at: new Date().toISOString()
  };
}

function similarity(str1: string, str2: string): number {
  // Levenshtein distance 기반 유사도 계산
  // 0-1 사이 값 반환
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  
  return (longer.length - costs[shorter.length]) / longer.length;
}
```

### 3. 검증된 소스 API Route

```typescript
// src/app/api/search/data-sources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyDataSource } from '@/lib/search';
import { TRUSTED_SOURCES } from '@/data/trusted-sources';

export async function POST(request: NextRequest) {
  const { country, topic, aiSuggestions } = await request.json();
  
  const verifiedSources: VerifiedDataSource[] = [];
  const unverifiedSuggestions: string[] = [];
  
  // 1. 사전 정의된 신뢰 소스에서 매칭
  const trustedMatches = TRUSTED_SOURCES.filter(source =>
    source.countries.includes(country) || source.countries.includes('global')
  ).filter(source =>
    source.topics.some(t => topic.toLowerCase().includes(t.toLowerCase()))
  );
  
  verifiedSources.push(...trustedMatches.map(s => ({
    name: s.name,
    url: s.url,
    description: s.description,
    source_type: s.type,
    verified_at: new Date().toISOString()
  })));
  
  // 2. AI 제안 소스 웹 검색으로 검증
  for (const suggestion of aiSuggestions) {
    // 이미 신뢰 소스에 있으면 스킵
    if (verifiedSources.some(v => v.name.toLowerCase() === suggestion.toLowerCase())) {
      continue;
    }
    
    const verified = await verifyDataSource(suggestion, country, topic);
    
    if (verified) {
      verifiedSources.push({
        name: suggestion,
        url: verified.url,
        description: verified.snippet,
        source_type: inferSourceType(verified.url),
        verified_at: new Date().toISOString()
      });
    } else {
      unverifiedSuggestions.push(suggestion);
    }
  }
  
  return NextResponse.json({
    success: true,
    data: {
      verified_sources: verifiedSources,
      unverified_suggestions: unverifiedSuggestions
    }
  });
}

function inferSourceType(url: string): string {
  if (url.includes('.gov')) return 'government';
  if (url.includes('worldbank') || url.includes('un.org') || url.includes('imf.org') || url.includes('oecd.org')) {
    return 'international_org';
  }
  if (url.includes('edu') || url.includes('scholar')) return 'academic';
  if (url.includes('.org')) return 'ngo';
  return 'other';
}
```

### 4. 참고문헌 검증 API Route

```typescript
// src/app/api/search/references/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyReference } from '@/lib/search';

export async function POST(request: NextRequest) {
  const { country, topic, aiSuggestions } = await request.json();
  
  const verifiedReferences: VerifiedReference[] = [];
  const unverifiedSuggestions: string[] = [];
  
  for (const suggestion of aiSuggestions) {
    // AI 응답에서 제목, 저자, 연도 파싱
    const parsed = parseReference(suggestion);
    
    if (!parsed) {
      unverifiedSuggestions.push(suggestion);
      continue;
    }
    
    const verified = await verifyReference(
      parsed.title,
      parsed.authors,
      parsed.year
    );
    
    if (verified) {
      verifiedReferences.push(verified);
    } else {
      unverifiedSuggestions.push(suggestion);
    }
  }
  
  // 추가: 주제 관련 실제 학술 자료 검색
  const additionalRefs = await searchScholarForTopic(country, topic);
  verifiedReferences.push(...additionalRefs);
  
  return NextResponse.json({
    success: true,
    data: {
      verified_references: verifiedReferences,
      unverified_suggestions: unverifiedSuggestions
    }
  });
}

function parseReference(text: string): { title: string; authors: string[]; year: number } | null {
  // "Author et al. (2023). Title Here" 형식 파싱
  const match = text.match(/^(.+?)\s*\((\d{4})\)\.\s*(.+?)(?:\.|$)/);
  
  if (!match) return null;
  
  return {
    authors: match[1].split(/,\s*|and\s*/),
    year: parseInt(match[2]),
    title: match[3].trim()
  };
}

async function searchScholarForTopic(country: string, topic: string): Promise<VerifiedReference[]> {
  const query = `${topic} ${country} policy research`;
  
  // Semantic Scholar API 또는 Google Scholar 검색
  const results = await SemanticScholarClient.search(query, { limit: 5 });
  
  return results.map(r => ({
    title: r.title,
    authors: r.authors.map(a => a.name),
    year: r.year,
    source: r.venue || r.journal || 'Academic Publication',
    url: r.url || `https://www.semanticscholar.org/paper/${r.paperId}`,
    doi: r.doi,
    verified_at: new Date().toISOString()
  }));
}
```

---

## 신뢰할 수 있는 데이터 소스 목록

### 글로벌 소스

```typescript
// src/data/trusted-sources.ts
export const TRUSTED_SOURCES = [
  // International Organizations
  {
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org',
    description: 'Free and open access to global development data',
    type: 'international_org',
    countries: ['global'],
    topics: ['development', 'economy', 'health', 'education', 'poverty']
  },
  {
    name: 'UN Data',
    url: 'https://data.un.org',
    description: 'United Nations statistical databases',
    type: 'international_org',
    countries: ['global'],
    topics: ['population', 'development', 'environment', 'health']
  },
  {
    name: 'OECD Data',
    url: 'https://data.oecd.org',
    description: 'OECD statistics and indicators',
    type: 'international_org',
    countries: ['global'],
    topics: ['economy', 'education', 'health', 'environment', 'governance']
  },
  {
    name: 'IMF Data',
    url: 'https://data.imf.org',
    description: 'International Monetary Fund data',
    type: 'international_org',
    countries: ['global'],
    topics: ['economy', 'finance', 'trade']
  },
  {
    name: 'WHO Global Health Observatory',
    url: 'https://www.who.int/data/gho',
    description: 'World Health Organization health data',
    type: 'international_org',
    countries: ['global'],
    topics: ['health', 'healthcare', 'disease', 'mortality']
  },
  
  // South Korea
  {
    name: 'Korean Statistical Information Service (KOSIS)',
    url: 'https://kosis.kr',
    description: '대한민국 공식 통계 포털',
    type: 'government',
    countries: ['South Korea'],
    topics: ['economy', 'population', 'health', 'education', 'environment']
  },
  {
    name: 'Korea Development Institute (KDI)',
    url: 'https://www.kdi.re.kr',
    description: '한국개발연구원 연구자료',
    type: 'government',
    countries: ['South Korea'],
    topics: ['economy', 'policy', 'development']
  },
  {
    name: 'Bank of Korea Economic Statistics System',
    url: 'https://ecos.bok.or.kr',
    description: '한국은행 경제통계시스템',
    type: 'government',
    countries: ['South Korea'],
    topics: ['economy', 'finance', 'monetary']
  },
  
  // Academic
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com',
    description: 'Academic literature search engine',
    type: 'academic',
    countries: ['global'],
    topics: ['all']
  },
  {
    name: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org',
    description: 'AI-powered research tool',
    type: 'academic',
    countries: ['global'],
    topics: ['all']
  },
  {
    name: 'JSTOR',
    url: 'https://www.jstor.org',
    description: 'Digital library of academic journals',
    type: 'academic',
    countries: ['global'],
    topics: ['all']
  },
  
  // Regional Development Banks
  {
    name: 'Asian Development Bank Data Library',
    url: 'https://data.adb.org',
    description: 'ADB statistics and indicators',
    type: 'international_org',
    countries: ['global', 'Asia'],
    topics: ['development', 'economy', 'infrastructure']
  },
  {
    name: 'African Development Bank Data Portal',
    url: 'https://dataportal.opendataforafrica.org',
    description: 'AfDB African statistics',
    type: 'international_org',
    countries: ['global', 'Africa'],
    topics: ['development', 'economy']
  },
  
  // ... 더 많은 국가별/주제별 소스 추가
];
```

---

## UI 표시 방식

### 검증된 소스 표시

```tsx
// Step 4 Analysis에서 검증된 소스 표시
<section className="mt-6">
  <h4 className="text-xl font-semibold border-b pb-2 mb-3">
    Potential Data Sources
    <span className="ml-2 text-sm font-normal text-green-600">
      ✓ Verified Links
    </span>
  </h4>
  
  {isLoadingVerification ? (
    <div className="flex items-center gap-2 text-gray-500">
      <Loader /> Verifying data sources...
    </div>
  ) : (
    <>
      {/* 검증된 소스 */}
      <ul className="space-y-3">
        {verifiedSources.map((source, i) => (
          <li key={i} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
            <span className="text-green-500 mt-1">✓</span>
            <div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {source.name}
              </a>
              <p className="text-sm text-gray-600">{source.description}</p>
              <span className="text-xs text-gray-400 mt-1">
                {source.source_type} • Verified
              </span>
            </div>
          </li>
        ))}
      </ul>
      
      {/* 검증되지 않은 AI 제안 (참고용) */}
      {unverifiedSuggestions.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-700 font-medium mb-2">
            ⚠️ AI Suggestions (Not Verified - Use with Caution)
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            {unverifiedSuggestions.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )}
</section>
```

---

## 환경 변수

```env
# .env.local
SERPER_API_KEY=your-serper-api-key
SEMANTIC_SCHOLAR_API_KEY=your-semantic-scholar-key  # Optional
```

---

## 검증 프로세스 플로우

```
1. AI가 data_sources와 key_references 생성
                │
                ▼
2. 클라이언트에서 /api/search/data-sources 호출
   └─ AI 제안 목록 전송
                │
                ▼
3. 서버에서 검증 프로세스 실행
   ├─ 신뢰 소스 DB 매칭
   └─ 웹 검색으로 존재 여부 확인
                │
                ▼
4. 검증된 소스 + 미검증 소스 구분하여 반환
                │
                ▼
5. 클라이언트에서 구분하여 표시
   ├─ 검증된 소스: 클릭 가능한 링크
   └─ 미검증 소스: 경고와 함께 참고용 표시
                │
                ▼
6. 저장 시 verified_data_sources, verified_references에 저장
```

---

## 테스트 케이스

| 시나리오 | AI 제안 | 예상 결과 |
|----------|---------|-----------|
| 존재하는 정부 DB | "KOSIS" | ✓ Verified (https://kosis.kr) |
| 존재하지 않는 DB | "Fake Data Portal" | ⚠️ Unverified |
| 존재하는 학술 자료 | "World Bank (2023) Report" | ✓ Verified with URL |
| 가짜 참고문헌 | "Kim et al. (2024) Fake" | ⚠️ Unverified |
| 국제기구 보고서 | "WHO Global Status Report" | ✓ Verified |
