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
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Step 1: Define Your Scope
      </h2>

      <ImportantNotice type="info">
        <p>
          <strong>GKS Scholars:</strong> Select your country of interest and
          describe your research area. This will help generate relevant policy
          issues and capstone topics.
        </p>
      </ImportantNotice>

      <div className="mt-6 space-y-6">
        <div>
          <Label htmlFor="country" className="text-lg font-medium mb-2 block">
            Country of Interest
          </Label>
          <CountrySelect
            value={country}
            onChange={onCountryChange}
            placeholder="Select a country (South Korea is at the top)"
          />
          <p className="text-sm text-gray-500 mt-1">
            193 UN member countries available
          </p>
        </div>

        <div>
          <Label htmlFor="interest" className="text-lg font-medium mb-2 block">
            Area of Interest
          </Label>
          <Textarea
            id="interest"
            value={interest}
            onChange={(e) => onInterestChange(e.target.value)}
            placeholder="e.g., Digital Healthcare, Sustainable Energy Policy, Education Reform, Urban Development..."
            className="min-h-[120px]"
          />
          <p className="text-sm text-gray-500 mt-1">
            Be specific about your research interests for better topic
            suggestions
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col items-end gap-2 pt-4">
          {!isLoggedIn && (
            <p className="text-amber-600 text-sm">
              Please login to generate policy issues
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !country || !interest.trim() || !isLoggedIn}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 disabled:bg-gray-400"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Issues...
              </span>
            ) : (
              'Generate Policy Issues'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
