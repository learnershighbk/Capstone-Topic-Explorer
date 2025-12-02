# Prompt: Simple Authentication System

## 목적
9자리 학번만으로 로그인하는 간편 인증 시스템 구현 (회원가입/인증 절차 없음)

---

## 프롬프트

```
9자리 학번으로만 로그인하는 간편 인증 시스템을 구현해줘.

## 요구사항

### 핵심 규칙
1. 회원가입 절차 없음 - 첫 로그인 시 자동 계정 생성
2. 인증 절차 없음 - 이메일/SMS 인증 없음
3. 9자리 숫자 학번만 입력
4. 로그아웃 기능 제공
5. 세션은 7일간 유지 (쿠키 기반)

### 1. Supabase 테이블 (students)
```sql
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(9) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT student_id_format CHECK (student_id ~ '^[0-9]{9}$')
);

CREATE INDEX idx_students_student_id ON students(student_id);
```

### 2. API Routes

#### POST /api/auth/login
- Request: { studentId: "202412345" }
- 학번 형식 검증 (9자리 숫자)
- 기존 학생이면 last_login_at 업데이트
- 신규 학생이면 새 레코드 생성
- 세션 쿠키 설정 (httpOnly, secure, 7일)
- Response: { success: true, data: { studentId, isNewUser, lastLoginAt } }

#### POST /api/auth/logout
- 세션 쿠키 삭제
- Response: { success: true, message: "Logged out successfully" }

#### GET /api/auth/session
- 현재 로그인 상태 확인
- Response: { isLoggedIn: boolean, studentId: string | null }

### 3. 인증 관련 라이브러리 (src/lib/auth.ts)
```typescript
const SESSION_COOKIE_NAME = 'capstone_session';
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7일

interface SessionData {
  studentId: string;
  createdAt: number;
  expiresAt: number;
}

// getSession(): 현재 세션 가져오기
// getCurrentStudentId(): 현재 로그인한 학생 ID
```

### 4. AuthProvider 컴포넌트 (src/components/auth/AuthProvider.tsx)
- React Context로 인증 상태 전역 관리
- 페이지 로드 시 세션 확인
- children에 isLoggedIn, studentId, login, logout 제공

### 5. useAuth Hook (src/hooks/useAuth.ts)
```typescript
interface AuthContextType {
  isLoggedIn: boolean;
  studentId: string | null;
  isLoading: boolean;
  login: (studentId: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### 6. LoginModal 컴포넌트 (src/components/auth/LoginModal.tsx)
- 모달 형태의 로그인 UI
- 학번 입력 필드 (숫자만 9자리)
- 실시간 입력 검증 (숫자 외 문자 자동 제거)
- 로딩 상태 표시
- 에러 메시지 표시
- Props: { isOpen: boolean, onClose: () => void }

### 7. Header에 로그인/로그아웃 버튼 추가
- 비로그인: "로그인" 버튼
- 로그인: 학번 표시 + "My Page" 링크 + "로그아웃" 버튼

## 보안 고려사항
- 쿠키 설정: httpOnly, secure (프로덕션), sameSite: 'lax'
- 학번 형식 검증 (서버 + 클라이언트)
- Rate limiting은 별도 미들웨어로 처리 (나중에)

## 디자인 요구사항
- 로그인 모달: 중앙 배치, 반투명 배경
- 입력 필드: placeholder "예: 202412345"
- 에러 상태: 빨간색 텍스트
- 버튼: 비활성화 상태 시 opacity-50
```

---

## 예상 결과

1. `src/app/api/auth/login/route.ts`
2. `src/app/api/auth/logout/route.ts`
3. `src/app/api/auth/session/route.ts`
4. `src/lib/auth.ts`
5. `src/components/auth/AuthProvider.tsx`
6. `src/components/auth/LoginModal.tsx`
7. `src/hooks/useAuth.ts`
8. `src/app/layout.tsx`에 AuthProvider 추가

---

## 테스트 시나리오

| 입력 | 예상 결과 |
|------|-----------|
| 202412345 | 로그인 성공 |
| 20241234 | 에러: 9자리 필요 |
| 2024a2345 | 자동 필터링 → 202412345 |
| 빈 값 | 에러: 학번 필요 |

---

## 다음 단계

→ `04_API_ROUTES.md` 실행
