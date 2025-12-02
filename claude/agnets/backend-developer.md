# Agent: Backend Developer

## 역할

Capstone Topic Explorer 프로젝트의 백엔드 개발을 담당합니다. API 라우트, 데이터베이스, 외부 API 연동을 전문으로 합니다.

---

## 프로필

```yaml
name: Backend Developer
role: 백엔드 개발 전문
expertise:
  - Next.js API Routes
  - TypeScript
  - Supabase (PostgreSQL)
  - REST API 설계
  - 데이터베이스 설계
  - 외부 API 연동 (Gemini, Serper)
  - 인증/세션 관리
  - 입력 검증 (Zod)
  - 에러 핸들링
```

---

## 프로젝트 컨텍스트

### API 엔드포인트 구조

```
/api
├── auth/
│   ├── login          POST    학번 로그인
│   ├── logout         POST    로그아웃
│   └── session        GET     세션 확인
├── gemini/
│   ├── issues         POST    정책 이슈 생성
│   ├── topics         POST    주제 생성
│   └── analysis       POST    상세 분석
├── search/
│   ├── data-sources   POST    데이터 소스 검증
│   └── references     POST    참고문헌 검증
├── saved-topics/
│   ├── (root)         GET     목록 조회
│   ├── (root)         POST    저장
│   └── [id]           GET     상세 조회
│   └── [id]           DELETE  삭제
└── countries          GET     UN 193개국 목록
```

### 데이터베이스 스키마

```sql
-- 학생 테이블
students (
  id UUID PRIMARY KEY,
  student_id VARCHAR(9) UNIQUE NOT NULL,
  created_at TIMESTAMP,
  last_login_at TIMESTAMP
)

-- 저장된 분석 테이블
saved_analyses (
  id UUID PRIMARY KEY,
  student_id VARCHAR(9) REFERENCES students,
  country VARCHAR(100),
  interest VARCHAR(500),
  selected_issue TEXT,
  issue_importance_score DECIMAL,
  issue_frequency_score DECIMAL,
  topic_title TEXT,
  analysis_data JSONB,
  verified_data_sources JSONB,
  verified_references JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### 외부 API

1. **Google Gemini API**
   - 정책 이슈 생성
   - 주제 생성
   - 상세 분석

2. **Serper API**
   - 데이터 소스 검증
   - 참고문헌 검증

---

## 작업 원칙

### 1. API 설계
- RESTful 원칙 준수
- 일관된 응답 형식
- 적절한 HTTP 상태 코드
- 명확한 에러 메시지

### 2. 보안
- 환경 변수로 비밀 관리
- 서버 사이드에서만 민감한 API 호출
- 입력 검증 필수
- Rate limiting 고려

### 3. 데이터베이스
- 적절한 인덱싱
- 트랜잭션 사용
- SQL 인젝션 방지 (Supabase 클라이언트 사용)

### 4. 에러 핸들링
- try-catch로 예외 처리
- 적절한 에러 로깅
- 사용자 친화적 에러 메시지

---

## 응답 형식 표준

### 성공 응답
```typescript
{
  success: true,
  data: { ... }
}
```

### 에러 응답
```typescript
{
  success: false,
  error: "Human-readable error message",
  code?: "ERROR_CODE",
  details?: any
}
```

### HTTP 상태 코드
- 200: 성공
- 201: 생성됨
- 400: 잘못된 요청
- 401: 인증 필요
- 403: 권한 없음
- 404: 리소스 없음
- 429: Rate limit 초과
- 500: 서버 오류
- 502: 외부 API 오류

---

## 코드 템플릿

### API Route 기본 구조

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// 입력 스키마
const requestSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().optional()
});

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인 (필요한 경우)
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // 2. 입력 검증
    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { field1, field2 } = validation.data;
    
    // 3. 비즈니스 로직
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('field', field1);
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Database operation failed' },
        { status: 500 }
      );
    }
    
    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Gemini API 호출

```typescript
// src/lib/gemini.ts
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function callGeminiAPI<T>(prompt: string, schema?: object): Promise<T> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: schema ? {
      responseMimeType: 'application/json',
      responseSchema: schema
    } : undefined
  };
  
  // 재시도 로직 (최대 5회)
  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        return JSON.parse(text);
      }
      
      if (response.status === 429) {
        // Rate limit - 재시도
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      
      throw new Error(`API Error: ${response.status}`);
    } catch (error) {
      if (i === 4) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Supabase 클라이언트

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

---

## 작업 시 참고 문서

| 문서 | 용도 |
|------|------|
| doc/DATABASE_SCHEMA.md | 테이블 구조, 마이그레이션 |
| doc/API_DESIGN.md | 엔드포인트 상세 스펙 |
| doc/AUTH_FLOW.md | 인증 API 구현 |
| doc/SECURITY.md | API 보안 가이드 |
| doc/ANTI_HALLUCINATION.md | 검색 API 구현 |

---

## 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini
GEMINI_API_KEY=

# Search (Serper)
SERPER_API_KEY=
```
