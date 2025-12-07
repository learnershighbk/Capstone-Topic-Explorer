'use client';

import { useState } from 'react';
import { CountrySelect } from '@/components/common/CountrySelect';
import { ImportantNotice } from '@/components/common/ImportantNotice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Step1ScopeProps {
  country: string;
  interest: string;
  onCountryChange: (country: string) => void;
  onInterestChange: (interest: string) => void;
  onNext: () => void;
  isLoading: boolean;
  isLoggedIn: boolean;
}

export function Step1Scope({
  country,
  interest,
  onCountryChange,
  onInterestChange,
  onNext,
  isLoading,
  isLoggedIn,
}: Step1ScopeProps) {
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!country) {
      setError('Please select a country');
      return;
    }
    if (!interest.trim()) {
      setError('Please enter your area of interest');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Step 1: 프로젝트 범위 정의
      </h2>

      <ImportantNotice type="info">
        <p>
          <strong>KDI School 학생:</strong> 관심 있는 국가를 선택하고 연구 분야를
          설명해주세요. 이를 바탕으로 관련 정책 이슈와 캡스톤 주제를 생성합니다.
        </p>
      </ImportantNotice>

      <div className="mt-6 space-y-6">
        <div>
          <Label htmlFor="country" className="mb-2 block text-lg font-semibold text-gray-900">
            관심 국가
          </Label>
          <CountrySelect
            value={country}
            onChange={onCountryChange}
            placeholder="국가를 선택하세요 (대한민국이 상단에 표시됩니다)"
          />
          <p className="mt-1 text-sm text-gray-500">
            UN 회원국 193개국 중에서 선택 가능합니다
          </p>
        </div>

        <div>
          <Label htmlFor="interest" className="mb-2 block text-lg font-semibold text-gray-900">
            관심 분야
          </Label>
          <Textarea
            id="interest"
            value={interest}
            onChange={(e) => onInterestChange(e.target.value)}
            placeholder="예: 디지털 헬스케어, 지속가능한 에너지 정책, 교육 개혁, 도시 개발..."
            className="min-h-[120px] border-gray-300 focus:border-[#615EEB] focus:ring-[#615EEB]"
          />
          <p className="mt-1 text-sm text-gray-500">
            더 나은 주제 제안을 위해 연구 관심사를 구체적으로 작성해주세요
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col items-end gap-2 pt-4">
          {!isLoggedIn && (
            <p className="text-sm text-amber-600">
              정책 이슈를 생성하려면 로그인이 필요합니다
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !country || !interest.trim() || !isLoggedIn}
            className="rounded-full bg-[#615EEB] px-8 py-3 text-white transition-all hover:bg-[#5250d9] hover:shadow-md disabled:bg-gray-300 disabled:hover:bg-gray-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                정책 이슈 생성 중...
              </span>
            ) : (
              '정책 이슈 생성하기'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
