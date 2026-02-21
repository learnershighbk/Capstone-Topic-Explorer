'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AdminStats, AdminUser, AdminAnalysis } from '../backend/schema';

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminStats>('/api/admin/stats');
      return data;
    },
  });
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUser[]>('/api/admin/users');
      return data;
    },
  });
}

export function useAdminAnalyses() {
  return useQuery<AdminAnalysis[]>({
    queryKey: ['admin', 'analyses'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminAnalysis[]>('/api/admin/analyses');
      return data;
    },
  });
}
