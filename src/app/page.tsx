'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Header, HeroSection } from '@/components/common';
import { useAuth } from '@/features/capstone-auth';

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleNavigateToExplore = useCallback(() => {
    router.push('/explore');
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <HeroSection
        isLoggedIn={isLoggedIn}
        onGetStarted={handleNavigateToExplore}
        onLoginSuccess={handleNavigateToExplore}
      />

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">Capstone Topic Explorer</p>
          <p className="mt-4">Contact: bklee@kdischool.ac.kr</p>
          <p className="mt-1">Designed by Learning Innovation Division at KDI School of Public Policy and Management</p>
        </div>
      </footer>
    </div>
  );
}
