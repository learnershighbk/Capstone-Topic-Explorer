'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { UN_COUNTRIES, searchCountries } from '@/data/un-countries';

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Select a country',
}: CountrySelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return UN_COUNTRIES;
    return searchCountries(searchQuery);
  }, [searchQuery]);

  const selectedCountry = UN_COUNTRIES.find((c) => c.name === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="w-full p-3 border border-gray-300 rounded-md shadow-sm cursor-pointer flex justify-between items-center bg-white hover:border-blue-500 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedCountry ? 'text-gray-900' : 'text-gray-400'}>
          {selectedCountry ? selectedCountry.name : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b sticky top-0 bg-white">
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country, index) => {
                const isFirstAndNotSearching = index === 0 && !searchQuery;
                return (
                  <div
                    key={country.code}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${
                      country.name === value ? 'bg-blue-100' : ''
                    } ${isFirstAndNotSearching ? 'border-b-2 border-blue-200' : ''}`}
                    onClick={() => {
                      onChange(country.name);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div>
                      <span
                        className={
                          isFirstAndNotSearching ? 'font-semibold' : ''
                        }
                      >
                        {country.name}
                      </span>
                      {country.nameKo && (
                        <span className="ml-2 text-gray-400 text-sm">
                          ({country.nameKo})
                        </span>
                      )}
                    </div>
                    {isFirstAndNotSearching && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                        Priority
                      </span>
                    )}
                    {country.name === value && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
