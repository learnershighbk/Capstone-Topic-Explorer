'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/features/capstone-auth';
import { AdminDashboard } from '@/features/admin/components/AdminDashboard';

export default function AdminPage() {
  const router = useRouter();
  const { isLoggedIn, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || role !== 'admin')) {
      router.replace('/');
    }
  }, [isLoading, isLoggedIn, role, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="flex justify-center py-12">
          <Loader size="lg" text="Loading..." />
        </main>
      </div>
    );
  }

  if (!isLoggedIn || role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main>
        <AdminDashboard />
      </main>
    </div>
  );
}
