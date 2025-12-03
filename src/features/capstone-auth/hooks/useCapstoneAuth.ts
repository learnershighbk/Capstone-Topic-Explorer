'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/remote/api-client';

interface AuthState {
  isLoggedIn: boolean;
  studentId: string | null;
  isLoading: boolean;
}

interface LoginResponse {
  studentId: string;
  isNewUser: boolean;
  lastLoginAt: string;
}

export function useCapstoneAuth() {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    studentId: null,
    isLoading: true,
  });

  const checkSession = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ isLoggedIn: boolean; studentId: string | null }>(
        '/api/auth/session'
      );
      setState({
        isLoggedIn: data.isLoggedIn,
        studentId: data.studentId,
        isLoading: false,
      });
    } catch {
      setState({
        isLoggedIn: false,
        studentId: null,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (studentId: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/api/auth/login', { studentId });
    setState({
      isLoggedIn: true,
      studentId: data.studentId,
      isLoading: false,
    });
    return data;
  }, []);

  const logout = useCallback(async () => {
    await apiClient.post('/api/auth/logout');
    setState({
      isLoggedIn: false,
      studentId: null,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    login,
    logout,
    checkSession,
  };
}
