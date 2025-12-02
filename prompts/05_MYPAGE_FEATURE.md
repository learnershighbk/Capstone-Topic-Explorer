# Prompt: My Page Feature

## 목적
Step 4에서 생성된 분석 결과를 저장하고, My Page에서 조회/삭제할 수 있는 기능 구현

---

## 프롬프트

```
My Page 기능을 구현해줘. 로그인한 사용자가 분석 결과를 저장하고 나중에 조회할 수 있어야 해.

## 요구사항

### 1. Supabase 테이블 (saved_analyses)
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
    
    -- Step 3 & 4: Topic and Analysis
    topic_title TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    
    -- Verified Sources (할루시네이션 방지 - 나중에 추가)
    verified_data_sources JSONB,
    verified_references JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_analyses_student_id ON saved_analyses(student_id);
CREATE INDEX idx_saved_analyses_created_at ON saved_analyses(created_at DESC);
```

### 2. API Routes

#### GET /api/saved-topics
저장된 분석 목록 조회 (로그인 필요)

**Query Params:**
- page (optional): 페이지 번호, 기본값 1
- limit (optional): 페이지당 항목 수, 기본값 10
- country (optional): 국가 필터

**Response:**
```typescript
{
  success: true,
  data: {
    items: SavedAnalysis[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }
}
```

#### GET /api/saved-topics/[id]
특정 저장된 분석 상세 조회

**Response:**
```typescript
{
  success: true,
  data: SavedAnalysis  // 전체 데이터
}
```

#### POST /api/saved-topics
새 분석 저장

**Request:**
```typescript
{
  country: string,
  interest: string,
  selected_issue: string,
  issue_importance_score?: number,
  issue_frequency_score?: number,
  topic_title: string,
  analysis_data: AnalysisData,
  verified_data_sources?: VerifiedDataSource[],
  verified_references?: VerifiedReference[]
}
```

#### DELETE /api/saved-topics/[id]
저장된 분석 삭제

### 3. 타입 정의 (src/types/index.ts)
```typescript
interface SavedAnalysis {
  id: string;
  student_id: string;
  country: string;
  interest: string;
  selected_issue: string;
  issue_importance_score?: number;
  issue_frequency_score?: number;
  topic_title: string;
  analysis_data: AnalysisData;
  verified_data_sources?: VerifiedDataSource[];
  verified_references?: VerifiedReference[];
  created_at: string;
  updated_at: string;
}

interface AnalysisData {
  rationale: {
    relevance: string;
    feasibility: string;
    impact: string;
  };
  data_sources: string[];
  key_references: string[];
  methodologies: { methodology: string; explanation: string }[];
  policy_questions: string[];
}
```

### 4. useSavedTopics Hook (src/hooks/useSavedTopics.ts)
```typescript
function useSavedTopics() {
  return {
    topics: SavedAnalysis[],
    isLoading: boolean,
    error: string | null,
    saveTopic: (data) => Promise<{ id: string }>,
    deleteTopic: (id: string) => Promise<void>,
    refresh: () => Promise<void>
  };
}
```

### 5. My Page 페이지들

#### /my-page (src/app/my-page/page.tsx)
- 저장된 분석 목록
- 국가별 필터 드롭다운
- 각 항목: 국가, 주제, 이슈, 저장일, View/Delete 버튼
- 비로그인 시 로그인 유도

#### /my-page/[id] (src/app/my-page/[id]/page.tsx)
- 상세 분석 조회
- Back 버튼
- Step 4와 동일한 레이아웃으로 분석 내용 표시
- 검증된 소스는 ✓ Verified 배지와 함께 표시

### 6. SavedTopicCard 컴포넌트 (src/components/my-page/SavedTopicCard.tsx)
- 국가 배지
- 주제 제목
- 이슈명
- 저장 날짜
- View 버튼 → /my-page/[id]
- Delete 버튼 (확인 후 삭제)

### 7. Step 4에 저장 버튼 추가
분석 완료 후 하단에 "Save to My Page" 버튼 추가
- 비로그인 상태: 로그인 모달 표시 → 로그인 후 저장
- 로그인 상태: 바로 저장 → 토스트 메시지 "저장되었습니다"

### 8. Header 수정
- 로그인 시 "My Page" 링크 추가

## 디자인 요구사항
- 카드 형태의 목록
- 호버 시 그림자 효과
- 국가별 색상 배지
- 빈 상태: "저장된 분석이 없습니다" 메시지
- 삭제 확인: window.confirm 또는 모달
```

---

## 예상 결과

1. `src/app/api/saved-topics/route.ts` (GET, POST)
2. `src/app/api/saved-topics/[id]/route.ts` (GET, DELETE)
3. `src/app/my-page/page.tsx`
4. `src/app/my-page/[id]/page.tsx`
5. `src/components/my-page/SavedTopicCard.tsx`
6. `src/hooks/useSavedTopics.ts`
7. Step 4 컴포넌트에 저장 버튼 추가
8. Header에 My Page 링크 추가

---

## 사용자 플로우

```
Step 4 분석 완료
    │
    ├── [비로그인] ──► "Save to My Page" 클릭
    │       │
    │       ▼
    │   로그인 모달 표시
    │       │
    │       ▼
    │   학번 입력 후 로그인
    │       │
    │       └──────┐
    │              │
    ├── [로그인] ──┤
    │              │
    │              ▼
    │       저장 API 호출
    │              │
    │              ▼
    │       "저장되었습니다" 토스트
    │
    ▼
Header의 "My Page" 클릭
    │
    ▼
저장된 분석 목록 표시
    │
    ▼
항목 "View" 클릭 → 상세 페이지
```

---

## 다음 단계

→ `06_ANTI_HALLUCINATION.md` 실행
