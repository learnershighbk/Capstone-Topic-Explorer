# My Page Feature Specification

## 개요

Step 4 "Detailed Topic Analysis"에서 생성된 분석 결과를 저장하고, 이후에 로그인하여 저장된 주제별로 조회할 수 있는 My Page 기능입니다.

---

## 기능 요구사항

### 필수 기능

1. **분석 결과 저장**: Step 4에서 "Save to My Page" 버튼으로 현재 분석 결과 저장
2. **저장된 분석 목록 조회**: My Page에서 저장된 모든 분석 목록 표시
3. **상세 분석 조회**: 목록에서 항목 선택 시 상세 분석 결과 표시
4. **삭제 기능**: 불필요한 저장 항목 삭제

### 선택 기능

1. **국가별 필터링**: 국가 기준으로 저장된 분석 필터링
2. **검색 기능**: 주제명, 이슈명으로 검색
3. **정렬 기능**: 저장 날짜순 정렬

---

## 사용자 플로우

### 분석 결과 저장 플로우

```
1. Step 4에서 분석 결과 확인
        │
        ▼
2. "Save to My Page" 버튼 클릭
        │
        ├── [로그인 상태] ──────────►
        │                           │
        └── [비로그인 상태] ──►      │
            로그인 모달 표시         │
                    │               │
                    ▼               │
            학번 입력 후 로그인       │
                    │               │
                    └───────────────┘
                                    │
                                    ▼
3. 저장 API 호출 (/api/saved-topics)
        │
        ├── [성공] ──► "저장되었습니다" 토스트 메시지
        │
        └── [실패] ──► "저장에 실패했습니다" 에러 메시지
```

### My Page 조회 플로우

```
1. Header의 "My Page" 메뉴 클릭
        │
        ├── [로그인 상태] ──────────► My Page 표시
        │
        └── [비로그인 상태] ──► 로그인 모달 표시
                    │
                    ▼
            로그인 후 My Page 표시
```

---

## UI 설계

### Header 수정

```tsx
// src/components/common/Header.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function Header() {
  const { isLoggedIn, studentId, logout } = useAuth();
  
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Capstone Topic Explorer
        </Link>
        
        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link 
                href="/my-page" 
                className="text-gray-600 hover:text-gray-900"
              >
                My Page
              </Link>
              <span className="text-sm text-gray-500">
                {studentId}
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => {/* 로그인 모달 열기 */}}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
```

### My Page 메인

```tsx
// src/app/my-page/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSavedTopics } from '@/hooks/useSavedTopics';
import { SavedTopicCard } from '@/components/my-page/SavedTopicCard';
import { LoginModal } from '@/components/auth/LoginModal';
import { useState } from 'react';

export default function MyPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { topics, isLoading, error, deleteTopic } = useSavedTopics();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  
  if (authLoading) {
    return <div className="flex justify-center p-8"><Loader /></div>;
  }
  
  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">My Page</h1>
        <p className="text-gray-600 mb-6">
          저장된 분석 결과를 보려면 로그인이 필요합니다.
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          로그인
        </button>
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </div>
    );
  }
  
  const filteredTopics = countryFilter
    ? topics.filter(t => t.country === countryFilter)
    : topics;
  
  const uniqueCountries = [...new Set(topics.map(t => t.country))];
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Saved Topics</h1>
        
        {/* 필터 */}
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Countries</option>
          {uniqueCountries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader /></div>
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>저장된 분석 결과가 없습니다.</p>
          <p className="mt-2 text-sm">
            주제 분석 후 "Save to My Page" 버튼을 눌러 저장하세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTopics.map(topic => (
            <SavedTopicCard
              key={topic.id}
              topic={topic}
              onDelete={() => deleteTopic(topic.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### SavedTopicCard 컴포넌트

```tsx
// src/components/my-page/SavedTopicCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SavedAnalysis } from '@/types';

interface SavedTopicCardProps {
  topic: SavedAnalysis;
  onDelete: () => void;
}

export function SavedTopicCard({ topic, onDelete }: SavedTopicCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {topic.country}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(topic.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {topic.topic_title}
          </h3>
          
          <p className="text-sm text-gray-600">
            Issue: {topic.selected_issue}
          </p>
          <p className="text-sm text-gray-500">
            Interest: {topic.interest}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/my-page/${topic.id}`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            View
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
          >
            {isDeleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 상세 분석 조회 페이지

```tsx
// src/app/my-page/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SavedAnalysis } from '@/types';

export default function SavedTopicDetail() {
  const params = useParams();
  const router = useRouter();
  const [topic, setTopic] = useState<SavedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchTopic();
  }, [params.id]);
  
  const fetchTopic = async () => {
    try {
      const res = await fetch(`/api/saved-topics/${params.id}`);
      const data = await res.json();
      
      if (data.success) {
        setTopic(data.data);
      } else {
        router.push('/my-page');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader /></div>;
  }
  
  if (!topic) {
    return <div>Topic not found</div>;
  }
  
  const analysis = topic.analysis_data;
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/my-page')}
        className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
      >
        ← Back to My Page
      </button>
      
      {/* Topic Header */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm px-2 py-1 bg-blue-200 text-blue-800 rounded">
            {topic.country}
          </span>
          <span className="text-sm text-gray-500">
            Saved on {new Date(topic.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-blue-800">{topic.topic_title}</h1>
        <p className="text-blue-600 mt-1">Issue: {topic.selected_issue}</p>
      </div>
      
      {/* Analysis Content - Step 4와 동일한 레이아웃 */}
      <div className="space-y-8">
        {/* Rationale */}
        <section>
          <h2 className="text-xl font-semibold border-b pb-2 mb-3">Rationale</h2>
          <p><strong>Relevance:</strong> {analysis.rationale.relevance}</p>
          <p className="mt-1"><strong>Feasibility:</strong> {analysis.rationale.feasibility}</p>
          <p className="mt-1"><strong>Impact:</strong> {analysis.rationale.impact}</p>
        </section>
        
        {/* Policy Questions */}
        <section>
          <h2 className="text-xl font-semibold border-b pb-2 mb-3">Key Policy Questions</h2>
          <div className="space-y-3">
            {analysis.policy_questions.map((q, i) => (
              <a
                key={i}
                href={`https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-slate-50 rounded-lg border hover:bg-slate-100"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <p>{q}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
        
        {/* Verified Data Sources */}
        {topic.verified_data_sources && topic.verified_data_sources.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold border-b pb-2 mb-3">
              Verified Data Sources
              <span className="ml-2 text-sm font-normal text-green-600">✓ Verified</span>
            </h2>
            <ul className="space-y-2">
              {topic.verified_data_sources.map((source, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {source.name}
                    </a>
                    <p className="text-sm text-gray-600">{source.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        
        {/* Verified References */}
        {topic.verified_references && topic.verified_references.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold border-b pb-2 mb-3">
              Key References
              <span className="ml-2 text-sm font-normal text-green-600">✓ Verified</span>
            </h2>
            <ul className="space-y-2">
              {topic.verified_references.map((ref, i) => (
                <li key={i}>
                  <p className="font-medium">{ref.title}</p>
                  <p className="text-sm text-gray-600">
                    {ref.authors.join(', ')} ({ref.year}). {ref.source}
                  </p>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Source
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        
        {/* Methodologies */}
        <section>
          <h2 className="text-xl font-semibold border-b pb-2 mb-3">Recommended Methodologies</h2>
          <ul className="space-y-2">
            {analysis.methodologies.map((m, i) => (
              <li key={i}>
                <strong>{m.methodology}:</strong> {m.explanation}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
```

---

## Hook 구현

```typescript
// src/hooks/useSavedTopics.ts
'use client';

import { useState, useEffect } from 'react';
import { SavedAnalysis } from '@/types';

export function useSavedTopics() {
  const [topics, setTopics] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchTopics();
  }, []);
  
  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/saved-topics');
      const data = await res.json();
      
      if (data.success) {
        setTopics(data.data.items);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch saved topics');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveTopic = async (analysisData: Omit<SavedAnalysis, 'id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch('/api/saved-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisData)
    });
    
    const data = await res.json();
    
    if (data.success) {
      await fetchTopics(); // Refresh list
      return data.data;
    }
    
    throw new Error(data.error);
  };
  
  const deleteTopic = async (id: string) => {
    const res = await fetch(`/api/saved-topics/${id}`, {
      method: 'DELETE'
    });
    
    const data = await res.json();
    
    if (data.success) {
      setTopics(topics.filter(t => t.id !== id));
    } else {
      throw new Error(data.error);
    }
  };
  
  return {
    topics,
    isLoading,
    error,
    saveTopic,
    deleteTopic,
    refresh: fetchTopics
  };
}
```

---

## Step 4 수정 사항

Step 4 컴포넌트에 "Save to My Page" 버튼 추가:

```tsx
// Step 4 Analysis 섹션에 추가
<div className="mt-8 pt-6 border-t flex justify-center gap-4">
  <button
    onClick={handleSaveToMyPage}
    disabled={isSaving}
    className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 disabled:opacity-50"
  >
    {isSaving ? 'Saving...' : '💾 Save to My Page'}
  </button>
</div>
```

---

## 타입 정의

```typescript
// src/types/index.ts
export interface SavedAnalysis {
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

export interface AnalysisData {
  rationale: {
    relevance: string;
    feasibility: string;
    impact: string;
  };
  data_sources: string[];
  key_references: string[];
  methodologies: {
    methodology: string;
    explanation: string;
  }[];
  policy_questions: string[];
}

export interface VerifiedDataSource {
  name: string;
  url: string;
  description: string;
  source_type: 'government' | 'international_org' | 'academic' | 'ngo' | 'other';
  verified_at: string;
}

export interface VerifiedReference {
  title: string;
  authors: string[];
  year: number;
  source: string;
  url?: string;
  doi?: string;
  verified_at: string;
}
```
