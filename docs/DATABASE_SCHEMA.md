# Database Schema - Supabase

## 개요

Capstone Topic Explorer v2.0에서 사용하는 Supabase 데이터베이스 스키마입니다.

---

## 테이블 구조

### 1. `students` - 학생 정보

학번 기반 간편 로그인을 위한 학생 테이블입니다.

```sql
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(9) UNIQUE NOT NULL,  -- 9자리 학번
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT student_id_format CHECK (student_id ~ '^[0-9]{9}$')
);

-- 인덱스
CREATE INDEX idx_students_student_id ON students(student_id);

-- 학번으로 빠른 조회를 위한 유니크 인덱스 (이미 UNIQUE 제약 조건으로 생성됨)
```

### 2. `saved_analyses` - 저장된 분석 결과

My Page에서 조회할 저장된 주제 분석 결과입니다.

```sql
CREATE TABLE saved_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(9) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    
    -- Step 1: Scope
    country VARCHAR(100) NOT NULL,
    interest VARCHAR(500) NOT NULL,
    
    -- Step 2: Selected Issue
    selected_issue TEXT NOT NULL,
    issue_importance_score DECIMAL(3,1),
    issue_frequency_score DECIMAL(3,1),
    
    -- Step 3 & 4: Selected Topic and Analysis
    topic_title TEXT NOT NULL,
    analysis_data JSONB NOT NULL,  -- 전체 분석 결과 저장
    
    -- Verified Sources (할루시네이션 방지)
    verified_data_sources JSONB,   -- 검증된 데이터 소스
    verified_references JSONB,     -- 검증된 참고문헌
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_saved_analyses_student_id ON saved_analyses(student_id);
CREATE INDEX idx_saved_analyses_created_at ON saved_analyses(created_at DESC);
CREATE INDEX idx_saved_analyses_country ON saved_analyses(country);

-- 업데이트 시 자동 타임스탬프
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_analyses_updated_at
    BEFORE UPDATE ON saved_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. `api_usage_logs` - API 사용 로그 (선택사항)

API 사용량 모니터링 및 남용 방지를 위한 로그 테이블입니다.

```sql
CREATE TABLE api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(9) REFERENCES students(student_id) ON DELETE SET NULL,
    endpoint VARCHAR(100) NOT NULL,
    request_ip VARCHAR(45),
    request_data JSONB,
    response_status INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_api_usage_logs_student_id ON api_usage_logs(student_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

-- 30일 이상 된 로그 자동 삭제 (선택사항)
-- Supabase Edge Function 또는 pg_cron으로 구현
```

---

## JSONB 스키마 상세

### `analysis_data` 구조

```typescript
interface AnalysisData {
  rationale: {
    relevance: string;
    feasibility: string;
    impact: string;
  };
  data_sources: string[];      // AI가 생성한 원본 (참고용)
  key_references: string[];    // AI가 생성한 원본 (참고용)
  methodologies: {
    methodology: string;
    explanation: string;
  }[];
  policy_questions: string[];
}
```

### `verified_data_sources` 구조

```typescript
interface VerifiedDataSource {
  name: string;           // 데이터 소스 이름
  url: string;            // 실제 URL
  description: string;    // 설명
  verified_at: string;    // 검증 시간 (ISO 8601)
  source_type: 'government' | 'international_org' | 'academic' | 'ngo' | 'other';
}
```

### `verified_references` 구조

```typescript
interface VerifiedReference {
  title: string;          // 논문/보고서 제목
  authors: string[];      // 저자
  year: number;           // 출판 연도
  source: string;         // 학술지/출판사
  url?: string;           // URL (있는 경우)
  doi?: string;           // DOI (있는 경우)
  verified_at: string;    // 검증 시간
}
```

---

## Row Level Security (RLS)

학생은 자신의 데이터만 접근할 수 있도록 RLS를 설정합니다.

```sql
-- RLS 활성화
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_analyses ENABLE ROW LEVEL SECURITY;

-- students 테이블 정책
-- 서비스 역할은 모든 작업 가능 (API 서버에서 사용)
CREATE POLICY "Service role has full access to students"
    ON students FOR ALL
    USING (auth.role() = 'service_role');

-- saved_analyses 테이블 정책
CREATE POLICY "Students can view own analyses"
    ON saved_analyses FOR SELECT
    USING (student_id = current_setting('app.current_student_id', true));

CREATE POLICY "Students can insert own analyses"
    ON saved_analyses FOR INSERT
    WITH CHECK (student_id = current_setting('app.current_student_id', true));

CREATE POLICY "Students can update own analyses"
    ON saved_analyses FOR UPDATE
    USING (student_id = current_setting('app.current_student_id', true));

CREATE POLICY "Students can delete own analyses"
    ON saved_analyses FOR DELETE
    USING (student_id = current_setting('app.current_student_id', true));

-- 서비스 역할 정책 (API 서버용)
CREATE POLICY "Service role has full access to saved_analyses"
    ON saved_analyses FOR ALL
    USING (auth.role() = 'service_role');
```

---

## 마이그레이션 파일

### `supabase/migrations/001_initial_schema.sql`

```sql
-- 위의 모든 테이블, 인덱스, 트리거, RLS 정책을 포함
-- Supabase CLI로 마이그레이션 실행: supabase db push
```

---

## Supabase 설정

### 환경 변수 (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 서버 사이드 전용
```

### Supabase Client 설정

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // 서비스 역할 키 사용
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

---

## 데이터 조회 예시

### 학생의 저장된 분석 목록 조회

```typescript
const { data, error } = await supabase
  .from('saved_analyses')
  .select('*')
  .eq('student_id', studentId)
  .order('created_at', { ascending: false });
```

### 특정 국가별 분석 조회

```typescript
const { data, error } = await supabase
  .from('saved_analyses')
  .select('*')
  .eq('student_id', studentId)
  .eq('country', 'South Korea')
  .order('created_at', { ascending: false });
```
