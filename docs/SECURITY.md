# Security Guide

Capstone Topic Explorer의 현재 보안 구조와 운영 절차입니다. (2026-10-05 기준)

이 서비스는 KDI School 학생 대상 파일럿이라 **사용 편의를 우선**하고, 그로 인해 생기는 위험은 아래의 보완 통제로 막습니다.

---

## 1. 구조

```
[Browser] ──(서명된 세션 쿠키)──> [Next.js /api/* → Hono] ──> Claude API (Anthropic)
                                          │                ──> Serper 검색 API
                                          └──(secret key)──> Supabase (Postgres)
```

- 모든 유료 API 호출은 서버에서만 합니다. API 키는 브라우저에 전달되지 않습니다.
- Hono 라우터는 `src/features/[feature]/backend/route.ts`에 있고, `/api/[[...hono]]`로 노출됩니다.

---

## 2. 인증

### 학생
- **학번(9자리)만으로 로그인**합니다. 비밀번호는 없으며, 파일럿 편의를 위한 의도된 결정입니다.
- 세션은 `SESSION_SECRET`(32자 이상)으로 HMAC-SHA256 서명한 쿠키(`capstone_session`, 7일)입니다. 쿠키를 변조하면 서명 검증에서 거부됩니다.
- `SESSION_SECRET`이 없거나 짧으면 세션 발급과 검증을 모두 거부합니다(fail closed).
- `/api/openai/*`, `/api/search/*`는 `requireSession()` 미들웨어로 로그인을 강제합니다.

### 관리자
- 관리자 학번 + **4자리 PIN**(`ADMIN_PASSWORD`)으로 로그인합니다.
- 무차별 대입 방지: DB 함수 `reserve_admin_login_attempt`(migration 0005)가 비밀번호를 확인하기 **전에** 시도 1회를 예약하므로, 동시 요청을 보내도 **24시간에 5회**를 넘을 수 없습니다.
- 잠금 해제:
  ```sql
  update students set admin_failed_attempts = 0, admin_attempt_window_start = null where role = 'admin';
  ```

---

## 3. 학생별 일일 사용량 제한

학번만 알면 로그인할 수 있으므로, 한 계정이나 유출된 학번이 크레딧을 소진하지 못하도록 학생별 하루 호출 횟수를 제한합니다.

| 기능 | endpoint | 하루 한도 |
|------|----------|-----------|
| 정책 이슈 생성 | `issues` | 20 |
| 연구 주제 생성 | `topics` | 20 |
| 주제 분석 | `analysis` | 10 |
| 자료 검증 (Serper, 두 검색 라우트 합산) | `search` | 30 |

- 한도 값: `src/features/openai/constants/limits.ts`. 값만 바꾸면 되고 마이그레이션은 필요 없습니다.
- **한국 시간(KST) 자정**에 초기화됩니다. **관리자 계정은 제외**됩니다.
- `reserve_ai_call`(migration 0006)이 호출 전에 1회를 원자적으로 예약하므로, 동시 요청으로도 한도를 넘을 수 없습니다.
- 응답이 400 이상(AI 오류, 입력 오류 등)이면 `release_ai_call`로 예약을 되돌립니다.
- 사용량을 기록할 수 없으면 호출을 **거부**합니다(503, `USAGE_TRACKING_ERROR`). 크레딧이 소진됐던 원인이 바로 기록되지 않는 호출이었기 때문입니다.
- 한도 초과 시 429 `DAILY_LIMIT_EXCEEDED`를 돌려주고, 화면에 안내 토스트를 띄웁니다. 검색은 실패해도 "미검증 목록"으로 대체 표시됩니다.
- 사용 현황: 관리자 대시보드 **AI Usage (KST)** 섹션(최근 7일 합계, 오늘 학생별 사용량, 한도 도달 표시)
- 특정 학생의 오늘 한도 초기화:
  ```sql
  delete from ai_usage_daily
  where student_id = '학번' and usage_date = (now() at time zone 'Asia/Seoul')::date;
  ```

---

## 4. 입력 검증

모든 요청 본문은 zod 스키마로 검증하고, 길이 상한을 두어 한 번의 호출로 거대한 프롬프트를 보낼 수 없게 합니다.

| 필드 | 상한 |
|------|------|
| country | 100자 |
| interest | 300자 (입력창에도 `maxLength` 적용) |
| issue / topicTitle / topic | 500자 |
| existingTopics | 100개 |
| 검색 aiSuggestions | 20개, 항목당 1000자 |

---

## 5. 데이터베이스 (Supabase)

- 프로젝트 정책상 RLS는 사용하지 않습니다. 대신 **테이블 권한**으로 막습니다.
  - migration 0004: `anon`, `authenticated` 역할의 public 스키마 테이블·시퀀스 권한을 모두 회수하고, 이후 생성되는 테이블에도 기본 적용합니다.
  - 브라우저에 포함되는 publishable(anon) 키로는 `students`, `saved_analyses`, `ai_usage_daily`를 읽거나 쓸 수 없습니다.
- 앱은 서버에서 secret(service_role) 키로만 DB에 접근합니다.
- DB 함수(`reserve_admin_login_attempt`, `reserve_ai_call`, `release_ai_call`)는 `service_role`만 실행할 수 있습니다.
- Supabase legacy JWT 키는 비활성화하고, 새 publishable/secret 키를 사용합니다.

### 마이그레이션 적용 순서
`supabase/migrations`의 번호 순서대로 Supabase SQL Editor에서 실행합니다. 코드를 배포하기 **전에** 해당 마이그레이션을 먼저 적용해야 합니다. 0006이 없으면 AI 기능 전체가 503으로 막힙니다.

---

## 6. 환경 변수

| 변수명 | 설명 | 노출 범위 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 클라이언트 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable 키 (테이블 접근 불가) | 클라이언트 |
| `SUPABASE_URL` | Supabase URL (서버) | 서버만 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret 키 | 서버만 |
| `ANTHROPIC_API_KEY` | Claude API 키 | 서버만 |
| `SERPER_API_KEY` | Serper 검색 API 키 | 서버만 |
| `SESSION_SECRET` | 세션 쿠키 서명 키 (32자 이상) | 서버만 |
| `ADMIN_PASSWORD` | 관리자 4자리 PIN | 서버만 |

- Vercel에서는 서버 전용 변수를 **Secret** 타입(자물쇠 아이콘)으로 등록합니다.
- `.env.local`은 Git에 커밋하지 않습니다.

---

## 7. 사고 대응

| 상황 | 조치 |
|------|------|
| API 키 유출 의심 | 해당 콘솔(Anthropic / Serper / Supabase)에서 키를 재발급하고 Vercel 환경 변수를 교체한 뒤 재배포 |
| 세션 탈취 의심 | `SESSION_SECRET`을 교체하고 재배포 (모든 사용자가 다시 로그인) |
| 특정 학번 남용 | 관리자 대시보드에서 확인 후 Vercel 로그의 `[UsageLimit]` 기록 확인, 필요 시 한도 하향 |
| 관리자 잠김 | 2장의 잠금 해제 SQL 실행 |

---

## 8. 남은 과제

- [ ] Anthropic 콘솔 워크스페이스 **월 지출 한도** 설정 (학생별 한도와 별개의 최종 안전장치)

## 9. 점검 체크리스트

- [ ] API 키가 코드에 하드코딩되어 있지 않은가
- [ ] 서버 전용 변수에 `NEXT_PUBLIC_` 접두사가 붙지 않았는가
- [ ] 새 유료 API 라우트에 `requireSession()`과 `enforceDailyLimit()`이 적용되었는가
- [ ] 새 요청 스키마에 길이 상한이 있는가
- [ ] 새 테이블이 publishable 키로 접근되지 않는가 (0004 기본 권한 확인)
- [ ] 브라우저 Network 탭에 API 키가 노출되지 않는가
