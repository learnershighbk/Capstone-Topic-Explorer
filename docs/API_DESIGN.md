# API Design Document

## 개요

Capstone Topic Explorer v2.0의 API 엔드포인트 설계입니다. 모든 AI API 호출은 서버 사이드에서 처리하여 API 키를 보호합니다.

---

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

---

## 인증 관련 API

### POST `/api/auth/login`

학번으로 로그인합니다. 회원이 없으면 자동 생성됩니다.

**Request Body:**
```json
{
  "studentId": "202412345"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "202412345",
    "isNewUser": false,
    "lastLoginAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Invalid student ID format. Must be 9 digits."
}
```

**구현 로직:**
1. 학번 형식 검증 (9자리 숫자)
2. 기존 학생 조회
3. 없으면 새로 생성
4. 세션 쿠키 설정
5. 마지막 로그인 시간 업데이트

---

### POST `/api/auth/logout`

현재 세션을 종료합니다.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/session`

현재 로그인 상태를 확인합니다.

**Response (200) - 로그인 상태:**
```json
{
  "isLoggedIn": true,
  "studentId": "202412345"
}
```

**Response (200) - 비로그인 상태:**
```json
{
  "isLoggedIn": false,
  "studentId": null
}
```

---

## AI 생성 API (OpenAI)

### POST `/api/openai/issues`

선택한 국가와 관심 분야에 대한 정책 이슈를 생성합니다.

**Request Body:**
```json
{
  "country": "South Korea",
  "interest": "Digital Healthcare"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "policy_issues": [
      {
        "issue": "Telemedicine Regulation Reform",
        "importance_score": 8.5,
        "frequency_score": 7.0,
        "total_score": 15.5
      },
      // ... 최대 10개
    ]
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to generate policy issues",
  "details": "API rate limit exceeded"
}
```

---

### POST `/api/openai/topics`

선택한 정책 이슈에 대한 캡스톤 주제를 생성합니다.

**Request Body:**
```json
{
  "country": "South Korea",
  "issue": "Telemedicine Regulation Reform"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "topics": [
      { "title": "Regulatory Framework for Cross-Border Telemedicine Services in South Korea" },
      { "title": "Patient Data Privacy in AI-Powered Diagnostic Systems" },
      // ... 5개
    ]
  }
}
```

---

### POST `/api/openai/topics/more`

추가 주제를 생성합니다 (기존 주제 제외).

**Request Body:**
```json
{
  "country": "South Korea",
  "issue": "Telemedicine Regulation Reform",
  "existingTopics": [
    "Regulatory Framework for Cross-Border Telemedicine Services",
    "Patient Data Privacy in AI-Powered Diagnostic Systems"
  ]
}
```

---

### POST `/api/openai/analysis`

선택한 주제에 대한 상세 분석을 생성합니다.

**Request Body:**
```json
{
  "country": "South Korea",
  "issue": "Telemedicine Regulation Reform",
  "topicTitle": "Regulatory Framework for Cross-Border Telemedicine Services"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rationale": {
      "relevance": "...",
      "feasibility": "...",
      "impact": "..."
    },
    "data_sources": ["...", "..."],
    "key_references": ["...", "..."],
    "methodologies": [
      { "methodology": "Comparative Policy Analysis", "explanation": "..." }
    ],
    "policy_questions": ["...", "...", "...", "...", "..."]
  }
}
```

---

## 검증된 소스 검색 API

### POST `/api/search/data-sources`

실제 존재하는 데이터 소스를 웹 검색으로 찾습니다.

**Request Body:**
```json
{
  "country": "South Korea",
  "topic": "Telemedicine Regulation",
  "aiSuggestions": ["Korean Statistical Information Service", "WHO Health Data"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "verified_sources": [
      {
        "name": "Korean Statistical Information Service (KOSIS)",
        "url": "https://kosis.kr",
        "description": "Official statistics portal of South Korea",
        "source_type": "government",
        "verified_at": "2024-01-15T10:30:00Z"
      },
      {
        "name": "World Health Organization - Global Health Observatory",
        "url": "https://www.who.int/data/gho",
        "description": "WHO's gateway to health statistics",
        "source_type": "international_org",
        "verified_at": "2024-01-15T10:30:00Z"
      }
    ],
    "unverified_suggestions": ["Some AI suggestion that couldn't be verified"]
  }
}
```

---

### POST `/api/search/references`

실제 존재하는 학술 자료를 검색합니다.

**Request Body:**
```json
{
  "country": "South Korea",
  "topic": "Telemedicine Regulation",
  "aiSuggestions": [
    "Kim et al. (2023) - Telemedicine in Korea",
    "World Bank Report on Digital Health"
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "verified_references": [
      {
        "title": "Telemedicine Policies and Their Effectiveness in South Korea",
        "authors": ["Kim, J.", "Lee, S.", "Park, H."],
        "year": 2023,
        "source": "Health Policy and Planning",
        "url": "https://academic.oup.com/...",
        "doi": "10.1093/...",
        "verified_at": "2024-01-15T10:30:00Z"
      }
    ],
    "unverified_suggestions": ["..."]
  }
}
```

---

## 저장된 주제 API

### GET `/api/saved-topics`

로그인한 학생의 저장된 분석 목록을 조회합니다.

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10)
- `country` (optional): 국가 필터

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-1234",
        "country": "South Korea",
        "interest": "Digital Healthcare",
        "selected_issue": "Telemedicine Regulation Reform",
        "topic_title": "Regulatory Framework for Cross-Border Telemedicine",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

**Response (401) - 미로그인:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### GET `/api/saved-topics/:id`

특정 저장된 분석의 상세 정보를 조회합니다.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "country": "South Korea",
    "interest": "Digital Healthcare",
    "selected_issue": "Telemedicine Regulation Reform",
    "issue_importance_score": 8.5,
    "issue_frequency_score": 7.0,
    "topic_title": "Regulatory Framework for Cross-Border Telemedicine",
    "analysis_data": {
      "rationale": { ... },
      "data_sources": [...],
      "key_references": [...],
      "methodologies": [...],
      "policy_questions": [...]
    },
    "verified_data_sources": [...],
    "verified_references": [...],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### POST `/api/saved-topics`

새로운 분석 결과를 저장합니다.

**Request Body:**
```json
{
  "country": "South Korea",
  "interest": "Digital Healthcare",
  "selected_issue": "Telemedicine Regulation Reform",
  "issue_importance_score": 8.5,
  "issue_frequency_score": 7.0,
  "topic_title": "Regulatory Framework for Cross-Border Telemedicine",
  "analysis_data": { ... },
  "verified_data_sources": [...],
  "verified_references": [...]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "message": "Analysis saved successfully"
  }
}
```

---

### DELETE `/api/saved-topics/:id`

저장된 분석을 삭제합니다.

**Response (200):**
```json
{
  "success": true,
  "message": "Analysis deleted successfully"
}
```

---

## 유틸리티 API

### GET `/api/countries`

UN 193개 회원국 목록을 반환합니다.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "countries": [
      { "code": "KR", "name": "South Korea", "priority": true },
      { "code": "AF", "name": "Afghanistan", "priority": false },
      { "code": "AL", "name": "Albania", "priority": false },
      // ... 193개국
    ]
  }
}
```

---

## 에러 응답 형식

모든 API는 일관된 에러 형식을 사용합니다.

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Additional details (optional)"
}
```

### 에러 코드

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | 입력값 검증 실패 |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `RATE_LIMIT` | 429 | 요청 한도 초과 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |
| `AI_ERROR` | 502 | AI API 오류 |

---

## Rate Limiting

- **인증된 사용자**: 분당 60 요청
- **미인증 사용자**: 분당 10 요청
- **AI API**: 분당 20 요청 (OpenAI API 제한 고려)

Rate limit 초과 시 응답:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 60
}
```
