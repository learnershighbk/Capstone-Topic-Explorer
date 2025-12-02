# Authentication Flow - 간편 로그인 시스템

## 개요

Capstone Topic Explorer는 복잡한 회원가입/인증 절차 없이 **9자리 학번**만으로 로그인하는 간편 인증 시스템을 사용합니다.

---

## 요구사항

1. **회원가입 없음**: 별도의 회원가입 절차 불필요
2. **인증 절차 없음**: 이메일/SMS 인증 불필요
3. **9자리 학번**: 숫자로만 구성된 9자리 학번으로 로그인
4. **로그아웃 가능**: 이용 종료 시 로그아웃 가능
5. **세션 유지**: 브라우저 닫았다 열어도 로그인 상태 유지 (선택사항)

---

## 로그인 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                        사용자 플로우                              │
└─────────────────────────────────────────────────────────────────┘

1. 웹사이트 접속
        │
        ▼
2. 로그인 모달 표시 (선택적) 또는 Header의 로그인 버튼 클릭
        │
        ▼
3. 9자리 학번 입력
        │
        ├── [유효하지 않은 형식] ──► 에러 메시지 표시
        │                           "학번은 9자리 숫자여야 합니다"
        │
        └── [유효한 형식] ──────────►
                                    │
                                    ▼
4. 서버에서 학번 확인
        │
        ├── [기존 학생] ───────────► 마지막 로그인 시간 업데이트
        │
        └── [신규 학생] ───────────► 새 학생 레코드 생성
                                    │
                                    ▼
5. 세션 쿠키 설정 및 로그인 완료
        │
        ▼
6. 서비스 이용 (My Page 접근 가능)
        │
        ▼
7. 로그아웃 버튼 클릭 (선택)
        │
        ▼
8. 세션 쿠키 삭제 및 로그아웃 완료
```

---

## 세션 관리

### 쿠키 기반 세션

```typescript
// 세션 쿠키 설정
const SESSION_COOKIE_NAME = 'capstone_session';
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7일 (초)

interface SessionData {
  studentId: string;
  createdAt: number;
  expiresAt: number;
}
```

### 세션 생성 (로그인 시)

```typescript
// src/app/api/auth/login/route.ts
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { studentId } = await request.json();
  
  // 1. 학번 형식 검증
  if (!/^[0-9]{9}$/.test(studentId)) {
    return Response.json(
      { success: false, error: 'Invalid student ID format. Must be 9 digits.' },
      { status: 400 }
    );
  }
  
  const supabase = createServerSupabaseClient();
  
  // 2. 기존 학생 확인 또는 새로 생성
  const { data: existingStudent } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', studentId)
    .single();
  
  let isNewUser = false;
  
  if (!existingStudent) {
    // 신규 학생 생성
    await supabase
      .from('students')
      .insert({ student_id: studentId });
    isNewUser = true;
  } else {
    // 마지막 로그인 시간 업데이트
    await supabase
      .from('students')
      .update({ last_login_at: new Date().toISOString() })
      .eq('student_id', studentId);
  }
  
  // 3. 세션 쿠키 설정
  const sessionData: SessionData = {
    studentId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY * 1000
  };
  
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY,
    path: '/'
  });
  
  return Response.json({
    success: true,
    data: {
      studentId,
      isNewUser,
      lastLoginAt: new Date().toISOString()
    }
  });
}
```

### 세션 확인

```typescript
// src/lib/auth.ts
import { cookies } from 'next/headers';

export function getSession(): SessionData | null {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie) return null;
  
  try {
    const session: SessionData = JSON.parse(sessionCookie.value);
    
    // 만료 확인
    if (session.expiresAt < Date.now()) {
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

export function getCurrentStudentId(): string | null {
  const session = getSession();
  return session?.studentId || null;
}
```

### 로그아웃

```typescript
// src/app/api/auth/logout/route.ts
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  
  return Response.json({
    success: true,
    message: 'Logged out successfully'
  });
}
```

---

## UI 컴포넌트

### LoginModal 컴포넌트

```typescript
// src/components/auth/LoginModal.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 클라이언트 측 검증
    if (!/^[0-9]{9}$/.test(studentId)) {
      setError('학번은 9자리 숫자여야 합니다.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(studentId);
      onClose();
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">로그인</h2>
        <p className="text-gray-600 mb-6">
          학번 9자리를 입력하여 로그인하세요.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="studentId" className="block text-sm font-medium mb-1">
              학번 (Student ID)
            </label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="예: 202412345"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={9}
              pattern="[0-9]{9}"
              required
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || studentId.length !== 9}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### useAuth Hook

```typescript
// src/hooks/useAuth.ts
'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  studentId: string | null;
  isLoading: boolean;
  login: (studentId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 초기 세션 확인
  useEffect(() => {
    checkSession();
  }, []);
  
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setIsLoggedIn(data.isLoggedIn);
      setStudentId(data.studentId);
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (studentId: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId })
    });
    
    if (!res.ok) {
      throw new Error('Login failed');
    }
    
    const data = await res.json();
    setIsLoggedIn(true);
    setStudentId(data.data.studentId);
  };
  
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setStudentId(null);
  };
  
  return (
    <AuthContext.Provider value={{ isLoggedIn, studentId, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 보안 고려사항

### 1. 학번 검증
- 9자리 숫자만 허용
- 정규식: `/^[0-9]{9}$/`

### 2. Rate Limiting
- 동일 IP에서 분당 10회 로그인 시도 제한
- 실패 시 점진적 대기 시간 증가

### 3. 쿠키 보안
- `httpOnly`: JavaScript에서 쿠키 접근 방지
- `secure`: HTTPS에서만 전송 (프로덕션)
- `sameSite: 'lax'`: CSRF 방지

### 4. 세션 만료
- 기본 7일 후 자동 만료
- 재로그인 필요

---

## 선택적 개선사항

### 1. 자동 로그인 프롬프트
- 로그인하지 않은 상태에서 My Page 접근 시 로그인 유도
- Step 4에서 저장하기 전 로그인 요청

### 2. 학번 기억하기
- 로컬 스토리지에 마지막 사용 학번 저장 (선택 시)
- 다음 로그인 시 자동 입력

### 3. 비활성 세션 처리
- 30분 이상 비활성 시 세션 갱신 확인
- 장기 비활성 시 자동 로그아웃

---

## 테스트 시나리오

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 정상 로그인 (신규) | 202412345 | 새 계정 생성, 로그인 성공 |
| 정상 로그인 (기존) | 202412345 | 기존 계정으로 로그인 |
| 잘못된 형식 (8자리) | 20241234 | 에러: "학번은 9자리 숫자여야 합니다" |
| 잘못된 형식 (문자) | 2024a2345 | 에러: "학번은 9자리 숫자여야 합니다" |
| 로그아웃 | - | 세션 종료, My Page 접근 불가 |
