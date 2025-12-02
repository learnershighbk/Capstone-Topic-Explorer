# Prompt: Step Components Migration

## 목적
기존 index.html의 Step 1-4 UI를 Next.js React 컴포넌트로 마이그레이션

---

## 프롬프트

```
기존 MVP index.html의 4단계 UI를 React 컴포넌트로 마이그레이션해줘.

## 기존 구조 (index.html)
- Step 1: Define Your Scope (국가 선택, 관심 분야 입력)
- Step 2: Identify Key Policy Issues (10개 이슈 목록, 점수 표시)
- Step 3: Explore Capstone Topics (5개 주제, "Show 5 More" 버튼)
- Step 4: Detailed Topic Analysis (Rationale, Policy Questions, Methodologies, Data Sources, References)

## 새로운 컴포넌트 구조

### 1. 메인 페이지 (src/app/page.tsx)
- 상태 관리 (useState)
- 4단계 상태 전환 로직
- ProgressBar 연동

### 2. ProgressBar 컴포넌트 (src/components/common/ProgressBar.tsx)
```typescript
interface ProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
}
```
- 4개 스텝 표시
- active: 현재 단계 (파란색)
- completed: 완료된 단계 (초록색)
- 기본: 회색

### 3. Step1Scope 컴포넌트 (src/components/steps/Step1Scope.tsx)
```typescript
interface Step1ScopeProps {
  initialCountry?: string;
  initialInterest?: string;
  onSubmit: (country: string, interest: string) => void;
  isLoading?: boolean;
}
```
변경사항:
- CountrySelect 컴포넌트 사용 (UN 193개국)
- 기존 8개국 하드코딩 제거
- South Korea 기본 선택

### 4. Step2Issues 컴포넌트 (src/components/steps/Step2Issues.tsx)
```typescript
interface PolicyIssue {
  issue: string;
  importance_score: number;
  frequency_score: number;
  total_score: number;
}

interface Step2IssuesProps {
  issues: PolicyIssue[];
  selectedIssue: string;
  onSelectIssue: (issue: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}
```
UI:
- 이슈 카드 목록
- 점수 배지 (Importance, Frequency, Total)
- 선택 시 파란색 테두리
- Back 버튼

### 5. Step3Topics 컴포넌트 (src/components/steps/Step3Topics.tsx)
```typescript
interface Topic {
  title: string;
}

interface Step3TopicsProps {
  topics: Topic[];
  onSelectTopic: (title: string) => void;
  onShowMore: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  error?: string;
}
```
UI:
- 주제 카드 목록
- "Analyze this Topic" 버튼
- "Show 5 More Topics" 버튼
- Back 버튼

### 6. Step4Analysis 컴포넌트 (src/components/steps/Step4Analysis.tsx)
```typescript
interface Step4AnalysisProps {
  analysis: AnalysisData;
  topic: { title: string; country: string; issue: string; interest: string };
  verifiedSources?: VerifiedDataSource[];
  verifiedReferences?: VerifiedReference[];
  unverifiedSources?: string[];
  unverifiedReferences?: string[];
  verificationStatus: 'idle' | 'loading' | 'done';
  onBack: () => void;
  onSave: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string;
}
```
섹션:
1. Topic Title (파란색 배경)
2. Rationale (Relevance, Feasibility, Impact)
3. Key Policy Questions (Google Scholar 링크)
4. Recommended Methodologies
5. Potential Data Sources (✓ Verified / ⚠️ Unverified)
6. Key References (✓ Verified / ⚠️ Unverified)
7. External Links (Google Scholar, Overton, Perplexity, Gemini, ChatGPT, Claude)
8. Save to My Page 버튼

### 7. Loader 컴포넌트 (src/components/common/Loader.tsx)
- 스피너 애니메이션
- 메시지 표시 옵션

### 8. AlertModal 컴포넌트 (src/components/common/AlertModal.tsx)
- 기존 alert-modal 마이그레이션

## 스타일 요구사항
- Tailwind CSS 사용
- 기존 스타일 유지 (card-hover, step-number 등)
- 반응형 (md 브레이크포인트)

## 상태 관리 (메인 페이지)
```typescript
// src/app/page.tsx
const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
const [isLoading, setIsLoading] = useState(false);

// Step 1
const [country, setCountry] = useState('South Korea');
const [interest, setInterest] = useState('');

// Step 2
const [issues, setIssues] = useState<PolicyIssue[]>([]);
const [selectedIssue, setSelectedIssue] = useState('');

// Step 3
const [topics, setTopics] = useState<Topic[]>([]);
const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

// Step 4
const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'done'>('idle');
const [verifiedSources, setVerifiedSources] = useState<VerifiedDataSource[]>([]);
const [verifiedReferences, setVerifiedReferences] = useState<VerifiedReference[]>([]);
```

## API 호출 함수
```typescript
// Step 1 → Step 2
async function handleFindIssues(country: string, interest: string) {
  setIsLoading(true);
  try {
    const res = await fetch('/api/gemini/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, interest })
    });
    const data = await res.json();
    if (data.success) {
      setIssues(data.data.policy_issues);
      setCurrentStep(2);
    }
  } finally {
    setIsLoading(false);
  }
}

// Step 2 → Step 3
async function handleSelectIssue(issue: string) { ... }

// Step 3 → Step 4
async function handleSelectTopic(title: string) { ... }

// Step 4 저장
async function handleSave() { ... }
```

## Important Notice 유지
기존 노란색 경고 박스 유지:
- 제목: "Important Notice"
- 내용: AI 생성 콘텐츠 경고, 비판적 검증 필요, 최종 책임은 사용자에게
- 닫기 버튼
```

---

## 예상 결과

1. `src/app/page.tsx` - 메인 페이지 (상태 관리)
2. `src/components/common/ProgressBar.tsx`
3. `src/components/common/Loader.tsx`
4. `src/components/common/AlertModal.tsx`
5. `src/components/steps/Step1Scope.tsx`
6. `src/components/steps/Step2Issues.tsx`
7. `src/components/steps/Step3Topics.tsx`
8. `src/components/steps/Step4Analysis.tsx`

---

## 마이그레이션 체크리스트

- [ ] 모든 기존 UI 요소 유지
- [ ] 스타일 일관성 확인
- [ ] 로딩 상태 표시
- [ ] 에러 처리
- [ ] Back 버튼 동작
- [ ] Progress Bar 연동
- [ ] 반응형 레이아웃
- [ ] Important Notice 표시/숨기기

---

## 다음 단계

→ `08_DEPLOYMENT.md` 실행
