# API Security Guide

## 개요

Capstone Topic Explorer v1.0(MVP)에서 발견된 보안 문제와 v2.0에서의 해결 방안입니다.

---

## 현재 보안 문제 (v1.0)

### 1. 클라이언트 사이드 API 키 노출

**문제점:**
```javascript
// index.html - API 키가 브라우저에서 확인 가능
const apiKey = "AIzaSyD_xxxxxxxxxxxx";
```

- API 키가 브라우저에서 확인 가능
- 누구나 개발자 도구에서 키 복사 가능
- 키 남용으로 인한 비용 발생 위험
- API 할당량 초과 가능

---

## 해결 방안 (v2.0)

### 1. 서버 사이드 API 라우트

모든 AI API 호출은 Next.js API Routes를 통해 서버에서 처리합니다.

```
[Client] → [Next.js API Route] → [OpenAI API]
    ↑              ↓
    └──── Response ←────┘
```

### 2. 환경 변수를 통한 키 관리

```env
# .env.local (절대 Git에 커밋하지 않음)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# .env.example (Git에 커밋)
OPENAI_API_KEY=your-api-key-here
```

### 3. API Route 구현

```typescript
// src/app/api/openai/issues/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  // 1. API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured');
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // 2. 요청 본문 파싱
  const body = await request.json();
  const { country, interest } = body;

  // 3. 입력 검증
  if (!country || !interest || interest.length < 3) {
    return NextResponse.json(
      { success: false, error: 'Invalid input' },
      { status: 400 }
    );
  }

  // 4. OpenAI API 호출 (서버 사이드)
  try {
    const prompt = buildIssuesPrompt(country, interest);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a policy research assistant.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const data = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate policy issues' },
      { status: 500 }
    );
  }
}
```

### 4. 클라이언트 측 호출

```typescript
// 클라이언트에서는 내부 API만 호출
export async function fetchPolicyIssues(country: string, interest: string) {
  const response = await fetch('/api/openai/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, interest })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch policy issues');
  }

  return response.json();
}
```

---

## 추가 보안 조치

### 1. Rate Limiting

```typescript
// src/middleware.ts
const RATE_LIMIT = 20; // 분당 최대 요청 수
const WINDOW_MS = 60 * 1000; // 1분

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/openai')) {
    return NextResponse.next();
  }
  // ... rate limit 로직
}

export const config = {
  matcher: '/api/openai/:path*'
};
```

### 2. 입력 검증 (Zod)

```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const issuesRequestSchema = z.object({
  country: z.string().min(1).max(100),
  interest: z.string().min(3).max(500)
});

export const studentIdSchema = z.string().regex(/^[0-9]{9}$/, 'Student ID must be 9 digits');
```

### 3. OpenAI SDK 설정

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,  // 자동 재시도
  timeout: 30000, // 30초 타임아웃
});

export async function callOpenAI<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',  // 또는 'gpt-4o-mini'
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

export { openai };
```

---

## 환경 변수 체크리스트

| 변수명 | 설명 | 노출 범위 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 클라이언트 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | 클라이언트 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Key | 서버만 |
| `OPENAI_API_KEY` | OpenAI API 키 | 서버만 |
| `SERPER_API_KEY` | Serper 검색 API 키 | 서버만 |

---

## 보안 점검 체크리스트

- [ ] API 키가 하드코딩되어 있지 않은지 확인
- [ ] `NEXT_PUBLIC_` 접두사가 적절히 사용되는지 확인
- [ ] 모든 API 라우트에 입력 검증이 있는지 확인
- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 확인
- [ ] 브라우저 Network 탭에서 API 키 노출 확인
