'use client';

import { useState } from 'react';
import { CountrySelect } from '@/components/common/CountrySelect';
import { ImportantNotice } from '@/components/common/ImportantNotice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoginModal } from '@/features/capstone-auth';

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleSubmit = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
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
        Step 1: Define Your Project Scope
      </h2>

      {!isLoggedIn && (
        <div className="mb-4">
          <ImportantNotice type="warning">
            <p>
              <strong>Login Required:</strong> You need to log in to generate policy issues.{' '}
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="underline font-semibold hover:opacity-80"
              >
                Click here to log in
              </button>
            </p>
          </ImportantNotice>
        </div>
      )}

      <ImportantNotice type="info">
        <p>
          <strong>KDI School Students:</strong> Select a country of interest and describe
          your research area. We will generate relevant policy issues and capstone topics
          based on your input.
        </p>
      </ImportantNotice>

      <div className="mt-6 space-y-6">
        <div>
          <Label htmlFor="country" className="mb-2 block text-lg font-semibold text-gray-900">
            Country of Interest
          </Label>
          <CountrySelect
            value={country}
            onChange={onCountryChange}
            placeholder="Select a country"
          />
          <p className="mt-1 text-sm text-gray-500">
            Choose from 193 UN member states
          </p>
        </div>

        <div>
          <Label htmlFor="interest" className="mb-2 block text-lg font-semibold text-gray-900">
            Area of Interest
          </Label>
          <Textarea
            id="interest"
            value={interest}
            onChange={(e) => onInterestChange(e.target.value)}
            placeholder="e.g., Digital Healthcare, Sustainable Energy Policy, Education Reform, Urban Development..."
            className="min-h-[120px] border-gray-300 focus:border-[#615EEB] focus:ring-[#615EEB]"
          />
          <p className="mt-1 text-sm text-gray-500">
            Be specific about your research interest for better topic suggestions
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col items-end gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !country || !interest.trim()}
            className="rounded-full bg-[#615EEB] px-8 py-3 text-white transition-all hover:bg-[#5250d9] hover:shadow-md disabled:bg-gray-300 disabled:hover:bg-gray-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating Policy Issues...
              </span>
            ) : !isLoggedIn ? (
              'Log in to Generate Issues'
            ) : (
              'Generate Policy Issues'
            )}
          </Button>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
