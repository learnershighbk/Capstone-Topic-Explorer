# Prompt: Secure API Routes

## 목적
클라이언트에 노출된 API 키를 서버 사이드로 이동하여 보안 강화

---

## 프롬프트

```
Gemini API 호출을 서버 사이드 API 라우트로 마이그레이션해서 API 키를 보호해줘.

## 현재 문제점 (수정 전)
```javascript
// 클라이언트에 API 키 노출됨 (보안 취약)
const apiKey = "AIzaSyD_...";  // 하드코딩된 키
const apiUrl = `https://generativelanguage.googleapis.com/...?key=${apiKey}`;
const response = await fetch(apiUrl, { ... });
```

## 해결 방안
API 키를 환경 변수로 관리하고, Next.js API 라우트에서만 사용

## 구현할 API Routes

### 1. POST /api/gemini/issues
정책 이슈 10개 생성

**Request:**
```typescript
{
  country: string;   // 예: "South Korea"
  interest: string;  // 예: "Digital Healthcare"
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    policy_issues: [
      {
        issue: string;
        importance_score: number;  // 1-10
        frequency_score: number;   // 1-10
        total_score: number;       // 합계
      }
    ]
  }
}
```

**Gemini 프롬프트 (기존 코드에서 가져옴):**
```
As a policy analysis expert, identify the 10 most critical policy issues for ${country} related to "${interest}". 
For each issue, provide a score from 1 to 10 for "Importance" and "Mention Frequency" based on the following specific criteria.

**Importance Score Criteria (1-10):**
1. **National Development Plans:** How prominently is the issue featured in the country's top-level national development plans?
2. **Think Tank Reports:** How is the issue evaluated in recent reports from authoritative think tanks?
3. **Budget Allocation:** How much of the national budget is allocated to sectors related to this issue?

**Frequency Score Criteria (1-10):**
1. **Keyword Search Volume:** Search volume in academic databases over the last 1-2 years
2. **Parliamentary Records:** How often is the issue discussed in parliamentary records?
3. **International Organization Reports:** How frequently mentioned in World Bank, IMF, OECD reports?

Return as JSON with policy_issues array.
```

### 2. POST /api/gemini/topics
선택한 이슈에 대한 캡스톤 주제 5개 생성

**Request:**
```typescript
{
  country: string;
  issue: string;
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    topics: [{ title: string }]
  }
}
```

### 3. POST /api/gemini/topics/more
추가 주제 5개 생성 (기존 주제 제외)

**Request:**
```typescript
{
  country: string;
  issue: string;
  existingTopics: string[];  // 제외할 기존 주제들
}
```

### 4. POST /api/gemini/analysis
선택한 주제에 대한 상세 분석

**Request:**
```typescript
{
  country: string;
  issue: string;
  topicTitle: string;
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    rationale: {
      relevance: string;
      feasibility: string;
      impact: string;
    },
    data_sources: string[],
    key_references: string[],
    methodologies: [
      { methodology: string; explanation: string }
    ],
    policy_questions: string[]
  }
}
```

## Gemini API 유틸리티 (src/lib/gemini.ts)

```typescript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiPayload {
  contents: Array<{ parts: Array<{ text: string }> }>;
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: object;
  };
}

export async function callGeminiAPI<T>(payload: GeminiPayload): Promise<T> {
  // API 키 확인
  // fetch 호출
  // 재시도 로직 (최대 5회, 지수 백오프)
  // JSON 파싱 및 반환
}
```

## 입력 검증 (src/lib/validation.ts)

```typescript
import { z } from 'zod';

export const issuesRequestSchema = z.object({
  country: z.string().min(2).max(100),
  interest: z.string().min(3).max(500)
});

export const topicsRequestSchema = z.object({
  country: z.string().min(2).max(100),
  issue: z.string().min(3).max(500)
});

export const analysisRequestSchema = z.object({
  country: z.string().min(2).max(100),
  issue: z.string().min(3).max(500),
  topicTitle: z.string().min(5).max(500)
});
```

## 클라이언트 API 유틸리티 (src/lib/api.ts)

```typescript
export async function fetchPolicyIssues(country: string, interest: string) {
  const response = await fetch('/api/gemini/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, interest })
  });
  // 에러 핸들링
  return response.json();
}

// fetchTopics, fetchMoreTopics, fetchAnalysis 도 동일하게
```

## 환경 변수 설정
```env
# .env.local
GEMINI_API_KEY=your-actual-gemini-api-key
```

## 에러 응답 형식
```typescript
{
  success: false,
  error: string;
  code?: string;
  details?: any;
}
```

## 에러 코드
- VALIDATION_ERROR (400)
- UNAUTHORIZED (401)
- RATE_LIMIT (429)
- AI_ERROR (502)
- INTERNAL_ERROR (500)
```

---

## 예상 결과

1. `src/app/api/gemini/issues/route.ts`
2. `src/app/api/gemini/topics/route.ts`
3. `src/app/api/gemini/topics/more/route.ts` (또는 topics 내 처리)
4. `src/app/api/gemini/analysis/route.ts`
5. `src/lib/gemini.ts`
6. `src/lib/validation.ts`
7. `src/lib/api.ts`

---

## 보안 체크리스트

- [ ] API 키가 환경 변수에만 있는지 확인
- [ ] 클라이언트 코드에 API 키 없는지 확인
- [ ] .env.local이 .gitignore에 있는지 확인
- [ ] 입력 검증이 모든 라우트에 적용되는지 확인

---

## 다음 단계

→ `05_MYPAGE_FEATURE.md` 실행
