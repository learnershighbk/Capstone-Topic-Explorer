# Capstone Topic Explorer - 개선 명세서

> 이 문서는 학생 사용자 관점에서 분석한 개선사항을 새 세션에서 바로 구현할 수 있도록 작성된 명세서입니다.
> 각 항목에 **수정 대상 파일, 현재 문제 코드, 개선 방향**을 명시합니다.

---

## 세션 A: 우선순위 높음 (핵심 UX 문제)

### A-1. 진행 중 데이터 유실 방지 ~~[DONE]~~

**문제**: `src/app/page.tsx`의 모든 스텝 상태(country, interest, issues, selectedIssue, topics, selectedTopic, analysis 등)가 `useState`로만 관리되어, 브라우저 새로고침/뒤로가기 시 Step 1~4 전체 데이터가 즉시 사라짐. OpenAI API 호출 3회(각 수초~십수초)를 거쳐 도달한 결과가 한 번의 실수로 소실됨.

**수정 대상 파일**:
- `src/app/page.tsx` (상태 관리 로직 전체)

**현재 코드 패턴** (`src/app/page.tsx` 20~36행):
```typescript
const [currentStep, setCurrentStep] = useState(1);
const [country, setCountry] = useState('');
const [interest, setInterest] = useState('');
const [issues, setIssues] = useState<PolicyIssue[]>([]);
const [selectedIssue, setSelectedIssue] = useState<PolicyIssue | null>(null);
const [topics, setTopics] = useState<Topic[]>([]);
const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
// ... verified data 상태들도 동일
```

**개선 방향**:
- `zustand` + `persist` 미들웨어를 사용하여 `sessionStorage`에 스텝 상태를 자동 저장하는 store 생성
- 새 파일: `src/features/explorer/stores/use-step-store.ts`
- `StepState` 타입은 이미 `src/types/index.ts`에 정의되어 있으므로 활용
- 로딩 상태(isLoadingIssues 등)는 persist 대상에서 제외 (transient 상태)
- `handleReset` 호출 시 store도 초기화

**참고**: zustand는 이미 package.json에 설치되어 있음 (`"zustand": "^4.5.6"`)

---

### A-2. alert() 에러 처리를 toast로 교체 ~~[DONE]~~

**문제**: `src/app/page.tsx`에서 모든 API 실패 시 `alert()`로 처리. 브라우저를 블로킹하고, 에러 유형(rate limit, 네트워크, 서버 오류)에 따른 차별화된 안내 없음.

**수정 대상 파일**:
- `src/app/page.tsx` (5곳의 alert 호출)
- `src/app/my-page/page.tsx` (1곳: 74행 삭제 실패 alert)

**현재 코드 패턴** (`src/app/page.tsx`):
```typescript
// 58행: 이슈 생성 실패
alert('Failed to generate policy issues. Please try again.');
// 78행: 주제 생성 실패
alert('Failed to generate topics. Please try again.');
// 98행: 추가 주제 생성 실패
alert('Failed to generate more topics. Please try again.');
// 153행: 분석 생성 실패
alert('Failed to generate analysis. Please try again.');
// 178행: 저장 실패
alert('Failed to save analysis. Please try again.');
```

`src/app/my-page/page.tsx` 74행:
```typescript
alert('Failed to delete analysis. Please try again.');
```

**개선 방향**:
- `src/hooks/use-toast.ts`와 `src/components/ui/toaster.tsx`가 이미 존재함 (shadcn toast)
- `alert()` → `toast({ title, description, variant })` 교체
- 에러 유형별 메시지 분기:
  - Rate limit (429) → "요청이 많습니다. 잠시 후 다시 시도해주세요."
  - Network error → "네트워크 연결을 확인해주세요."
  - Server error (5xx) → "서버 오류가 발생했습니다."
  - 기타 → "오류가 발생했습니다. 다시 시도해주세요."
- `src/lib/remote/api-client.ts`의 `extractApiErrorMessage()` 함수를 활용하여 에러 메시지 추출
- `Toaster` 컴포넌트가 렌더 트리에 포함되어 있는지 확인 필요 (layout.tsx 또는 providers.tsx)

---

### A-3. 미로그인 시 조기 안내 및 로그인 모달 연동 ~~[DONE]~~

**문제**: Step 1에서 국가 선택 + 관심분야 입력을 모두 완료한 뒤에야 미로그인 상태를 알게 됨. 하단에 작은 텍스트(`text-sm text-amber-600`)로 경고가 있지만 놓치기 쉬움.

**수정 대상 파일**:
- `src/components/steps/Step1Scope.tsx`

**현재 코드** (`Step1Scope.tsx` 90~95행):
```typescript
<div className="flex flex-col items-end gap-2 pt-4">
  {!isLoggedIn && (
    <p className="text-sm text-amber-600">
      정책 이슈를 생성하려면 로그인이 필요합니다
    </p>
  )}
  <Button
    onClick={handleSubmit}
    disabled={isLoading || !country || !interest.trim() || !isLoggedIn}
    ...
```

**개선 방향**: 두 가지 변경
1. Step 1 상단(ImportantNotice 근처)에 미로그인 시 눈에 띄는 배너 추가 (ImportantNotice type="warning" 활용)
2. 미로그인 상태에서 버튼 클릭 시 → disabled 대신 → `LoginModal`을 열도록 변경
   - Step1Scope에 `onLoginRequest` 콜백 prop 추가
   - `src/app/page.tsx`에서 LoginModal 상태를 관리하고 Step1Scope에 전달
   - 또는 Step1Scope 내부에서 직접 LoginModal을 렌더 (Step4Analysis와 동일 패턴 - 49~51행 참고)

---

### A-4. Step 4 분석 로딩 시 단계별 진행 상태 표시 ~~[DONE]~~

**문제**: 분석 생성 중 `FullPageLoader`가 전체 화면을 덮어 10~30초간 학생이 아무 정보 없이 대기. 분석 생성 → 데이터 소스 검증 → 참고문헌 검증 3단계를 구분할 수 없음.

**수정 대상 파일**:
- `src/app/page.tsx` (233~241행 FullPageLoader 부분 + 104~157행 handleGenerateAnalysis)
- `src/components/common/Loader.tsx` (FullPageLoader 개선 또는 새 컴포넌트)

**현재 코드** (`src/app/page.tsx` 233~241행):
```typescript
if (isLoadingAnalysis) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <FullPageLoader text="Generating detailed analysis..." />
    </div>
  );
}
```

**현재 분석 흐름** (`src/app/page.tsx` 105~157행):
```
handleGenerateAnalysis:
  1. setIsLoadingAnalysis(true)           ← 전체 로딩 시작
  2. apiClient.post('/api/openai/analysis')  ← AI 분석 생성 (오래 걸림)
  3. setAnalysis(data) + setCurrentStep(4)
  4. setIsVerifying(true)                 ← 검증 시작
  5. Promise.all([data-sources, references]) ← 병렬 검증
  6. setIsLoadingAnalysis(false)          ← 전체 로딩 종료
```

**개선 방향**:
- 로딩 단계를 나타내는 상태 추가: `analysisPhase: 'generating' | 'verifying-sources' | 'verifying-references' | 'done'`
- FullPageLoader를 단계별 진행률 UI로 교체:
  ```
  Step 1: AI 분석 생성 중...        ✓ (완료)
  Step 2: 데이터 소스 검증 중...     ● (진행 중)
  Step 3: 참고문헌 검증 중...        ○ (대기)
  ```
- 또는 FullPageLoader 대신 Step 4 컴포넌트 내부에 인라인 로딩 표시 (현재 Step 4의 isVerifying 패턴처럼)

---

## 세션 B: 우선순위 중간 (사용 편의성)

### B-5. My Page 목록 정보 보강 ~~[DONE]~~

**문제**: 저장된 분석 카드에 country, topic_title, created_at만 표시. 여러 분석을 저장했을 때 구분이 어려움.

**수정 대상 파일**:
- `src/app/my-page/page.tsx` (149~195행 카드 렌더링 부분)

**현재 카드에 표시되는 정보**: topic_title, country 배지, selected_issue 배지, interest, created_at

**사실 확인**: 코드를 다시 보면 interest와 selected_issue가 이미 표시되고 있음. 다만:
- issue_importance_score, issue_frequency_score는 `SavedAnalysisSummary` 타입에 없어 표시 불가
- 필터링/정렬 기능이 없음

**개선 방향**:
- 국가별 필터 드롭다운 추가
- 정렬 옵션 추가 (최신순/오래된순)
- `SavedAnalysisSummary` 타입에 점수 필드 추가 고려 (`src/types/index.ts` 98~105행)

---

### B-6. 저장 성공 후 My Page 이동 동선 추가 ~~[DONE]~~

**문제**: Step 4에서 저장 성공 시 ImportantNotice만 표시되고, My Page로 이동하는 버튼/링크가 없음. 학생이 Header에서 My Page를 수동으로 찾아야 함.

**수정 대상 파일**:
- `src/components/steps/Step4Analysis.tsx` (332~337행 saveSuccess 부분)

**현재 코드** (`Step4Analysis.tsx` 332~337행):
```typescript
{saveSuccess ? (
  <ImportantNotice type="success">
    <p>
      <strong>Success!</strong> Your analysis has been saved to My Page.
    </p>
  </ImportantNotice>
) : ( ... )}
```

**개선 방향**:
- ImportantNotice 내부에 `<Link href="/my-page">My Page에서 확인하기</Link>` 버튼 추가
- Next.js Link 컴포넌트 import 필요

---

### B-7. 중복 저장 방지 ~~[DONE]~~

**문제**: 같은 분석을 여러 번 저장 가능. 버튼 연타 시 동일 데이터 중복 생성.

**수정 대상 파일**:
- `src/components/steps/Step4Analysis.tsx` (saveSuccess 상태 활용)
- (선택) `src/features/saved-topics/backend/service.ts` (DB 레벨 중복 체크)

**현재 코드**: `saveSuccess` 상태가 있지만, 저장 성공 후 다시 저장 가능 (버튼 교체만 됨). 그러나 실제로는 `saveSuccess`가 true이면 버튼 대신 ImportantNotice가 표시되므로 UI 레벨에서는 1회 저장만 됨.

**실제 남은 문제**: 네트워크 지연 중 빠른 더블클릭 가능성

**개선 방향**:
- `handleSave`에서 `isSaving` 상태를 즉시 true로 설정하여 더블클릭 방지 (현재 이미 `disabled={isSaving}` 있음)
- 추가로 debounce 또는 `saveSuccess` 후 버튼 완전 비활성화
- (선택) DB에 `UNIQUE(student_id, topic_title, country)` 제약 추가 → migration 파일 필요

---

### B-8. Step 2 정책 이슈에 설명 추가 ~~[DONE]~~

**문제**: 10개 정책 이슈가 제목(issue)과 점수만 표시. 학생이 이슈를 충분히 이해하지 못한 채 선택해야 함.

**수정 대상 파일**:
- `src/types/index.ts` (PolicyIssue 타입: 28~33행)
- `src/features/openai/backend/schema.ts` (policyIssueSchema: 9~14행)
- `src/features/openai/backend/service.ts` (generatePolicyIssues 프롬프트: 99~128행)
- `src/components/steps/Step2Issues.tsx` (카드 렌더링: 43~89행)

**현재 PolicyIssue 타입** (`src/types/index.ts` 28~33행):
```typescript
export interface PolicyIssue {
  issue: string;
  importance_score: number;
  frequency_score: number;
  total_score: number;
}
```

**개선 방향**:
- `PolicyIssue`에 `description: string` 필드 추가
- OpenAI 프롬프트의 JSON 구조에 `"description": "1~2문장 설명"` 추가
- `policyIssueSchema`에 `description: z.string()` 추가
- Step2Issues 카드에 이슈 제목 아래 설명 텍스트 표시

---

### B-9. Step 3 주제에 설명 추가 ~~[DONE]~~

**문제**: Topic 타입이 `{ title: string }`만 가짐. 유사한 주제 구분이 어려움.

**수정 대상 파일**:
- `src/types/index.ts` (Topic 타입: 36~38행)
- `src/features/openai/backend/schema.ts` (topicSchema: 27~29행)
- `src/features/openai/backend/service.ts` (generateTopics 프롬프트: 150~186행)
- `src/components/steps/Step3Topics.tsx` (카드 렌더링: 45~69행)

**현재 Topic 타입** (`src/types/index.ts` 36~38행):
```typescript
export interface Topic {
  title: string;
}
```

**개선 방향**:
- `Topic`에 `description: string` 필드 추가
- OpenAI 프롬프트의 JSON 구조 변경: `{ "title": "...", "description": "1~2문장 설명" }`
- `topicSchema`에 `description: z.string()` 추가
- Step3Topics 카드에 주제 제목 아래 설명 텍스트 표시

**주의**: B-8, B-9는 OpenAI 프롬프트 변경이므로 기존 저장된 데이터와의 호환성 고려 필요 (SavedAnalysis의 analysis_data는 JSONB이므로 영향 없음)

---

### B-10. 국가 선택 UX 개선 ~~[CANCELLED]~~

**문제**: 193개국 전체를 스크롤하기엔 목록이 길고, GKS 장학생 출신 빈도가 높은 국가에 대한 빠른 접근이 없음.

**수정 대상 파일**:
- `src/components/common/CountrySelect.tsx`

**개선 방향**:
- 드롭다운 상단에 "자주 선택되는 국가" 그룹 추가 (예: Bangladesh, Vietnam, Indonesia, Philippines, Nepal, Myanmar, Sri Lanka, Cambodia 등 GKS 장학생 출신 상위국)
- 그룹 구분선으로 "--- 전체 국가 ---" 추가
- (선택) `localStorage`에 최근 선택 국가 저장 후 상단 표시

> **롤백 사유**: 특정 국가를 우선 표시하는 것이 다른 국가 학생에게 차별로 느껴질 수 있어 구현 후 롤백함. 검색 기능만 유지.

---

## 세션 C: 우선순위 낮음 (부가 기능)

### C-11. 언어 통일 (영어) ~~[DONE]~~

**문제**: UI 전반에 한국어/영어 혼용. GKS 장학생은 외국인이므로 영어 통일이 적절.

**수정 대상 파일**:
- `src/components/steps/Step1Scope.tsx` (한국어: "Step 1: 프로젝트 범위 정의", "관심 국가", "관심 분야", "정책 이슈 생성하기", 등)
- `src/components/common/HeroSection.tsx` (한국어: "시작하기", 설명 텍스트들)
- `src/app/page.tsx` (한국어: "프로젝트 범위 설정", "정책 이슈 선택", "연구 주제 선택", "분석 결과")
- `src/features/capstone-auth/components/LoginModal.tsx` (한국어: "학번 로그인", "학번은 9자리 숫자여야 합니다")

**현재 혼용 예시**:
```
Header: 영어 (Login, Logout, My Page)
ProgressBar: 영어 (Define Your Scope, Identify Key Policy Issues)
Step1 제목: 한국어 ("Step 1: 프로젝트 범위 정의")
Step1 버튼: 한국어 ("정책 이슈 생성하기")
Step2~4 제목: 영어 ("Step 2: Identify Key Policy Issues")
분석 결과 섹션: 영어 (Rationale, Policy Questions, Methodologies)
```

**개선 방향**: 전체 영어 통일. 단, 국가 선택의 한글명 병기(nameKo)는 유지.

---

### C-12. 분석 결과 내보내기 (Export) ~~[DONE]~~

**문제**: Step 4 및 My Page 상세 페이지에서 분석 결과를 PDF/복사 등으로 내보낼 수 없음.

**수정 대상 파일**:
- `src/components/steps/Step4Analysis.tsx` (내보내기 버튼 추가)
- `src/app/my-page/[id]/page.tsx` (내보내기 버튼 추가)

**개선 방향**:
- "클립보드에 복사" 버튼 (navigator.clipboard API) - 분석 내용을 정형화된 텍스트로 변환
- (선택) "PDF 다운로드" - react-pdf 또는 브라우저 print API 활용
- 새 shadcn 컴포넌트 필요 가능: 없음 (Button만 있으면 됨)

---

### C-13. Step 간 결과 캐싱 ~~[DONE]~~

**문제**: Step 2에서 이슈를 선택하고 Step 3으로 간 뒤, 다른 이슈를 시도하려면 뒤로 갔다가 다시 API 호출 필요.

**수정 대상 파일**:
- `src/app/page.tsx` (handleBackToStep1, handleBackToStep2, handleBackToStep3)

**현재 코드** (`src/app/page.tsx` 218~231행):
```typescript
const handleBackToStep1 = () => {
  setCurrentStep(1);
  setSelectedIssue(null);   // 선택만 초기화
};
const handleBackToStep2 = () => {
  setCurrentStep(2);
  setSelectedTopic(null);   // 선택만 초기화
};
const handleBackToStep3 = () => {
  setCurrentStep(3);
  setAnalysis(null);        // 분석 결과 초기화
};
```

**개선 방향**:
- 이전 스텝으로 돌아갈 때 `issues`, `topics` 데이터를 유지 (현재도 일부 유지됨)
- `handleBackToStep3`에서 `setAnalysis(null)` 대신 분석 결과를 캐시에 보관
- 같은 주제를 다시 선택하면 캐시에서 즉시 로드
- Map 구조: `Map<topicTitle, { analysis, verifiedDataSources, verifiedReferences }>` 활용

---

### C-14. 미검증 항목 안내 강화 ~~[DONE]~~

**문제**: 데이터 소스/참고문헌 검증 실패 시 "AI Suggestions (Not Verified - Use with Caution)" 텍스트만 표시. 학생이 직접 검증할 방법 안내 부족.

**수정 대상 파일**:
- `src/components/steps/Step4Analysis.tsx` (195~206행 unverifiedDataSources, 266~277행 unverifiedReferences)

**현재 코드** (`Step4Analysis.tsx` 195~206행):
```typescript
{unverifiedDataSources.length > 0 && (
  <div className="p-3 bg-yellow-50 rounded-lg">
    <p className="text-sm text-yellow-700 font-medium mb-2">
      AI Suggestions (Not Verified - Use with Caution)
    </p>
    <ul className="text-sm text-gray-600 space-y-1">
      {unverifiedDataSources.map((s, i) => (
        <li key={i}>&#8226; {s}</li>
      ))}
    </ul>
  </div>
)}
```

**개선 방향**:
- 각 미검증 항목 옆에 Google Scholar 검색 링크 추가 (Step 4의 `googleScholarUrl()` 함수 재활용)
- 안내 문구 추가: "These sources were suggested by AI but could not be verified. Click the search icon to verify manually."

---

### C-15. 모바일 상세 뷰 최적화 ~~[DONE]~~

**문제**: Step 2의 점수 표시(Importance, Frequency, Total)가 3열로 배치되어 작은 화면에서 좁음. Step 4의 복잡한 섹션들이 모바일에서 읽기 불편할 수 있음.

**수정 대상 파일**:
- `src/components/steps/Step2Issues.tsx` (68~87행 점수 영역)
- `src/components/steps/Step4Analysis.tsx` (전체적인 패딩/마진 조정)

**현재 코드** (`Step2Issues.tsx` 68~87행):
```typescript
<div className="flex gap-4 text-sm shrink-0">
  <div className="text-center">
    <div className="text-gray-500">Importance</div>
    <div className="font-bold text-blue-600">{issue.importance_score.toFixed(1)}</div>
  </div>
  // ... Frequency, Total 동일 패턴
</div>
```

**개선 방향**:
- 모바일에서 점수를 카드 하단으로 이동 (flex-col on mobile, flex-row on md+)
- Step 4 각 섹션에 적절한 `px-3 md:px-6` 등 반응형 패딩 적용

---

## 기존 설치된 라이브러리 현황

새 패키지 설치 없이 구현 가능한 항목이 대부분입니다:

| 라이브러리 | 설치됨 | 사용 항목 |
|-----------|--------|----------|
| zustand | O (`^4.5.6`) | A-1 (persist 미들웨어) |
| shadcn toast | O (`use-toast.ts`, `toaster.tsx` 존재) | A-2 |
| date-fns | O | B-5 (정렬) |
| lucide-react | O | 아이콘 필요 시 |
| framer-motion | O (`motion`) | 애니메이션 개선 시 |
| axios | O | 에러 타입 분기 |

---

## 새 세션에서 사용할 프롬프트

### 세션 A (우선순위 높음)
```
docs/IMPROVEMENT_PLAN.md를 읽고 세션 A 항목(A-1 ~ A-4)을 구현해줘.
각 항목의 "수정 대상 파일"과 "현재 코드 패턴"을 참고하여 최소한의 파일만 읽고 바로 구현에 들어가줘.
```

### 세션 B (우선순위 중간)
```
docs/IMPROVEMENT_PLAN.md를 읽고 세션 B 항목(B-5 ~ B-10)을 구현해줘.
각 항목의 "수정 대상 파일"과 "현재 코드 패턴"을 참고하여 최소한의 파일만 읽고 바로 구현에 들어가줘.
```

### 세션 C (우선순위 낮음)
```
docs/IMPROVEMENT_PLAN.md를 읽고 세션 C 항목(C-11 ~ C-15)을 구현해줘.
각 항목의 "수정 대상 파일"과 "현재 코드 패턴"을 참고하여 최소한의 파일만 읽고 바로 구현에 들어가줘.
```

---

*작성일: 2026-02-21*
*분석 기준: 학생(GKS 장학생) 사용자 관점*
