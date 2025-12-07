'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, LoginModal } from '@/features/capstone-auth';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function Header() {
  const { isLoggedIn, studentId, isLoading, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 transition-colors hover:text-[#615EEB] lg:text-2xl"
            >
              Capstone Topic Explorer
            </Link>

            <nav className="flex items-center gap-3 lg:gap-4">
              {isLoading ? (
                <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
              ) : isLoggedIn ? (
                <>
                  <span className="hidden text-sm text-gray-600 sm:inline">
                    Student ID: <span className="font-medium text-gray-900">{studentId}</span>
                  </span>
                  <Link
                    href="/my-page"
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#615EEB] hover:bg-[#615EEB]/5 hover:text-[#615EEB]"
                  >
                    My Page
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="rounded-full bg-[#615EEB] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[#5250d9] hover:shadow-md"
                >
                  Login
                </Button>
              )}
            </nav>
          </div>
        </div>
      </motion.header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
