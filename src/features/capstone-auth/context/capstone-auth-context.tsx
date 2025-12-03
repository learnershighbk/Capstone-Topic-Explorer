'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useCapstoneAuth } from '../hooks/useCapstoneAuth';

interface AuthContextType {
  isLoggedIn: boolean;
  studentId: string | null;
  isLoading: boolean;
  login: (studentId: string) => Promise<{ studentId: string; isNewUser: boolean; lastLoginAt: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function CapstoneAuthProvider({ children }: AuthProviderProps) {
  const auth = useCapstoneAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within CapstoneAuthProvider');
  }
  return context;
}
