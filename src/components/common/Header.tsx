'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, LoginModal } from '@/features/capstone-auth';
import { Button } from '@/components/ui/button';

export function Header() {
  const { isLoggedIn, studentId, isLoading, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold hover:opacity-90">
              Capstone Topic Explorer
            </Link>

            <nav className="flex items-center gap-4">
              {isLoading ? (
                <div className="h-10 w-24 bg-blue-500 animate-pulse rounded" />
              ) : isLoggedIn ? (
                <>
                  <span className="text-sm hidden sm:inline">
                    Student ID: {studentId}
                  </span>
                  <Link
                    href="/my-page"
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                  >
                    My Page
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Login
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
