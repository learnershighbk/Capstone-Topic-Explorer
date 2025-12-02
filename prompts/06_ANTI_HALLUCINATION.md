# Prompt: Anti-Hallucination for Data Sources & References

## 목적
Step 4 "Detailed Topic Analysis"의 Data Sources와 Key References 할루시네이션 방지

---

## 프롬프트

```
Step 4에서 AI가 생성하는 Data Sources와 Key References를 웹 검색으로 검증해서 실제 존재하는 것만 표시하도록 구현해줘.

## 문제점
AI가 생성하는 데이터:
- 존재하지 않는 데이터베이스 이름
- 잘못된 URL
- 가짜 논문 제목/저자
- 존재하지 않는 학술지

## 해결 방안
1. AI가 먼저 제안 생성
2. 웹 검색 API로 실제 존재 여부 검증
3. 검증된 것만 ✓ 표시, 미검증은 경고와 함께 참고용으로 표시

## 구현 내용

### 1. 검색 API 유틸리티 (src/lib/search.ts)

Serper API 사용 (Google Search API 대안)

```typescript
const SERPER_API_KEY = process.env.SERPER_API_KEY;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// 데이터 소스 검증
export async function verifyDataSource(
  sourceName: string,
  country: string,
  topic: string
): Promise<SearchResult | null> {
  // 신뢰할 수 있는 도메인 우선 (.gov, .org, worldbank, un.org, oecd.org)
}

// 참고문헌 검증
export async function verifyReference(
  title: string,
  authors: string[],
  year: number
): Promise<VerifiedReference | null> {
  // Google Scholar 또는 Semantic Scholar 검색
  // 제목 유사도 70% 이상이면 검증 성공
}

// 주제 관련 실제 학술 자료 검색
export async function searchScholarForTopic(
  country: string,
  topic: string
): Promise<VerifiedReference[]> {
  // 실제 존재하는 관련 논문 검색
}
```

### 2. 신뢰 데이터 소스 목록 (src/data/trusted-sources.ts)

미리 검증된 데이터 소스:

```typescript
export const TRUSTED_SOURCES = [
  // 국제기구
  { name: 'World Bank Open Data', url: 'https://data.worldbank.org', countries: ['global'], topics: ['development', 'economy'] },
  { name: 'UN Data', url: 'https://data.un.org', countries: ['global'], topics: ['population', 'development'] },
  { name: 'OECD Data', url: 'https://data.oecd.org', countries: ['global'], topics: ['economy', 'education'] },
  { name: 'WHO Global Health Observatory', url: 'https://www.who.int/data/gho', countries: ['global'], topics: ['health'] },
  { name: 'IMF Data', url: 'https://data.imf.org', countries: ['global'], topics: ['economy', 'finance'] },
  
  // 한국
  { name: 'KOSIS', url: 'https://kosis.kr', countries: ['South Korea'], topics: ['economy', 'population', 'health'] },
  { name: 'KDI', url: 'https://www.kdi.re.kr', countries: ['South Korea'], topics: ['economy', 'policy'] },
  { name: 'ECOS', url: 'https://ecos.bok.or.kr', countries: ['South Korea'], topics: ['economy', 'finance'] },
  
  // 학술 검색
  { name: 'Google Scholar', url: 'https://scholar.google.com', countries: ['global'], topics: ['all'] },
  { name: 'Semantic Scholar', url: 'https://www.semanticscholar.org', countries: ['global'], topics: ['all'] },
  
  // 지역개발은행
  { name: 'ADB Data Library', url: 'https://data.adb.org', countries: ['global', 'Asia'], topics: ['development'] },
  { name: 'AfDB Data Portal', url: 'https://dataportal.opendataforafrica.org', countries: ['global', 'Africa'], topics: ['development'] },
  
  // ... 더 많은 국가별/주제별 소스 추가
];
```

### 3. API Routes

#### POST /api/search/data-sources
```typescript
Request: {
  country: string,
  topic: string,
  aiSuggestions: string[]  // AI가 생성한 데이터 소스 목록
}

Response: {
  success: true,
  data: {
    verified_sources: VerifiedDataSource[],     // 검증된 소스
    unverified_suggestions: string[]             // 미검증 (참고용)
  }
}
```

로직:
1. 신뢰 소스 DB에서 국가/주제 매칭
2. AI 제안에 대해 웹 검색으로 검증
3. 검증된 것과 미검증 분리하여 반환

#### POST /api/search/references
```typescript
Request: {
  country: string,
  topic: string,
  aiSuggestions: string[]  // AI가 생성한 참고문헌 목록
}

Response: {
  success: true,
  data: {
    verified_references: VerifiedReference[],
    unverified_suggestions: string[]
  }
}
```

로직:
1. AI 제안에서 제목/저자/연도 파싱
2. Google Scholar/Semantic Scholar 검색
3. 제목 유사도 70% 이상이면 검증 성공
4. 추가로 주제 관련 실제 논문 검색하여 보강

### 4. 타입 정의
```typescript
interface VerifiedDataSource {
  name: string;
  url: string;
  description: string;
  source_type: 'government' | 'international_org' | 'academic' | 'ngo' | 'other';
  verified_at: string;
}

interface VerifiedReference {
  title: string;
  authors: string[];
  year: number;
  source: string;  // 학술지/출판사
  url?: string;
  doi?: string;
  verified_at: string;
}
```

### 5. Step 4 UI 수정

분석 완료 후 자동으로 검증 API 호출:

```typescript
// Step 4 컴포넌트
const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'done'>('idle');
const [verifiedSources, setVerifiedSources] = useState<VerifiedDataSource[]>([]);
const [verifiedReferences, setVerifiedReferences] = useState<VerifiedReference[]>([]);
const [unverifiedSources, setUnverifiedSources] = useState<string[]>([]);
const [unverifiedReferences, setUnverifiedReferences] = useState<string[]>([]);

useEffect(() => {
  if (analysisData) {
    verifySourcesAndReferences();
  }
}, [analysisData]);

async function verifySourcesAndReferences() {
  setVerificationStatus('loading');
  
  // 병렬로 두 API 호출
  const [sourcesRes, refsRes] = await Promise.all([
    fetch('/api/search/data-sources', { ... }),
    fetch('/api/search/references', { ... })
  ]);
  
  // 결과 설정
  setVerificationStatus('done');
}
```

### 6. UI 표시

검증된 소스 표시:
```tsx
<section>
  <h4>Potential Data Sources <span className="text-green-600">✓ Verified Links</span></h4>
  
  {verificationStatus === 'loading' && (
    <div className="flex items-center gap-2">
      <Loader /> Verifying data sources...
    </div>
  )}
  
  {verificationStatus === 'done' && (
    <>
      {/* 검증된 소스 */}
      <ul className="space-y-2">
        {verifiedSources.map(source => (
          <li className="p-3 bg-green-50 rounded-lg">
            <span className="text-green-500">✓</span>
            <a href={source.url} className="text-blue-600 hover:underline">
              {source.name}
            </a>
            <p className="text-sm text-gray-600">{source.description}</p>
          </li>
        ))}
      </ul>
      
      {/* 미검증 AI 제안 */}
      {unverifiedSources.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700 font-medium">
            ⚠️ AI Suggestions (Not Verified)
          </p>
          <ul className="text-sm text-gray-600">
            {unverifiedSources.map(s => <li>• {s}</li>)}
          </ul>
        </div>
      )}
    </>
  )}
</section>
```

### 7. 저장 시 검증 결과 포함

My Page에 저장할 때 verified_data_sources, verified_references 함께 저장

## 환경 변수
```env
SERPER_API_KEY=your-serper-api-key
```

## 참고
- Serper API: https://serper.dev (Google Search 결과 제공)
- Semantic Scholar API: https://api.semanticscholar.org
- 제목 유사도 계산: Levenshtein distance 기반
```

---

## 예상 결과

1. `src/lib/search.ts`
2. `src/data/trusted-sources.ts`
3. `src/app/api/search/data-sources/route.ts`
4. `src/app/api/search/references/route.ts`
5. Step 4 컴포넌트에 검증 로직 추가
6. UI에 검증 상태 표시

---

## 검증 플로우

```
AI 분석 완료
    │
    ▼
data_sources, key_references 생성 (AI)
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
/api/search/data-sources            /api/search/references
    │                                      │
    ├─ 신뢰 소스 DB 매칭                    ├─ 제목/저자/연도 파싱
    └─ 웹 검색 검증                         └─ 학술 검색 API 검증
    │                                      │
    ▼                                      ▼
verified_sources + unverified       verified_refs + unverified
    │                                      │
    └──────────────┬───────────────────────┘
                   │
                   ▼
              UI에 표시
         (✓ 검증됨 / ⚠️ 미검증)
                   │
                   ▼
            저장 시 포함
```

---

## 다음 단계

→ `07_STEP_COMPONENTS.md` 실행
