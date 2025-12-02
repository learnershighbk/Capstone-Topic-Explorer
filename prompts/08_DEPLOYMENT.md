# Prompt: Vercel Deployment

## 목적
Capstone Topic Explorer v2.0을 Vercel에 배포하고 환경 변수 설정

---

## 프롬프트

```
프로젝트를 Vercel에 배포하기 위한 설정을 해줘.

## 사전 준비

### 1. 환경 변수 목록
필요한 환경 변수:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Search API (할루시네이션 방지용)
SERPER_API_KEY=your-serper-api-key
```

### 2. Vercel 설정 파일 (vercel.json)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "regions": ["icn1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

### 3. next.config.js 확인
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화
  images: {
    unoptimized: false,
  },
  // 환경 변수 노출 범위 설정
  env: {
    // NEXT_PUBLIC_ 접두사 붙은 것만 클라이언트에 노출
  },
  // 서버 컴포넌트에서 외부 패키지 사용 허용
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
};

module.exports = nextConfig;
```

### 4. .gitignore 확인
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

## Vercel 배포 단계

### Step 1: Git 저장소 연결
1. GitHub/GitLab/Bitbucket에 코드 푸시
2. Vercel 대시보드에서 "New Project" 클릭
3. Git 저장소 선택

### Step 2: 프로젝트 설정
- Framework Preset: Next.js (자동 감지)
- Root Directory: ./
- Build Command: `npm run build`
- Output Directory: .next

### Step 3: 환경 변수 설정
Vercel 대시보드 → Settings → Environment Variables

| Name | Value | Environment |
|------|-------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | https://xxx.supabase.co | All |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJ... | All |
| SUPABASE_SERVICE_ROLE_KEY | eyJ... | All |
| GEMINI_API_KEY | AIza... | All |
| SERPER_API_KEY | xxx | All |

⚠️ 주의: SUPABASE_SERVICE_ROLE_KEY와 GEMINI_API_KEY는 NEXT_PUBLIC_ 접두사 없이!

### Step 4: Supabase 설정
Supabase 대시보드에서 Vercel URL 허용:
1. Authentication → URL Configuration
2. Site URL: https://your-project.vercel.app
3. Redirect URLs: https://your-project.vercel.app/*

### Step 5: 배포 확인
- 빌드 로그 확인
- 환경 변수 적용 확인
- API 라우트 테스트
- 프론트엔드 동작 확인

## 배포 후 체크리스트

### 기능 테스트
- [ ] Step 1: 국가 선택 (193개국 확인)
- [ ] Step 1: 관심 분야 입력
- [ ] Step 2: 정책 이슈 생성 (API 동작)
- [ ] Step 3: 주제 생성
- [ ] Step 3: "Show 5 More" 동작
- [ ] Step 4: 상세 분석 표시
- [ ] Step 4: 데이터 소스 검증
- [ ] Step 4: 참고문헌 검증
- [ ] 로그인/로그아웃
- [ ] My Page 목록 조회
- [ ] My Page 상세 조회
- [ ] 분석 저장
- [ ] 분석 삭제

### 보안 확인
- [ ] API 키가 클라이언트에 노출되지 않는지 확인
- [ ] 브라우저 개발자 도구 → Network 탭에서 확인
- [ ] 소스 코드에 API 키 하드코딩 없는지 확인

### 성능 확인
- [ ] 페이지 로딩 시간
- [ ] API 응답 시간
- [ ] Lighthouse 점수

## 도메인 설정 (선택)

커스텀 도메인 연결:
1. Vercel 대시보드 → Settings → Domains
2. 도메인 추가
3. DNS 레코드 설정 (CNAME 또는 A 레코드)

예시:
```
capstone-explorer.kdis.ac.kr → cname.vercel-dns.com
```

## 자동 배포 설정

GitHub 푸시 시 자동 배포:
- main 브랜치: Production
- 기타 브랜치: Preview

## 모니터링

### Vercel Analytics
- 프로젝트 설정에서 Analytics 활성화
- 페이지뷰, 방문자 수 확인

### 에러 모니터링
- Vercel Functions 로그 확인
- Supabase 로그 확인
```

---

## 예상 결과

1. `vercel.json` - Vercel 설정 파일
2. Vercel 대시보드 설정 가이드
3. 배포 후 체크리스트

---

## 트러블슈팅

### 빌드 실패
1. 타입 에러 확인: `npm run build` 로컬에서 테스트
2. 환경 변수 누락 확인
3. 패키지 버전 충돌 확인

### API 오류
1. 환경 변수 설정 확인
2. Supabase URL/키 유효성 확인
3. Gemini API 할당량 확인
4. Serper API 할당량 확인

### 인증 문제
1. Supabase URL Configuration 확인
2. 쿠키 설정 확인 (secure, sameSite)

---

## 배포 완료 후

1. 테스트 사용자로 전체 플로우 테스트
2. 에러 로그 모니터링
3. API 사용량 모니터링
4. 사용자 피드백 수집
