'use client';

import { useState } from 'react';
import { match } from 'ts-pattern';
import { useAuth } from '../context/capstone-auth-context';
import { AUTH_ERROR_CODES } from '../lib/dto';
import { isAxiosError } from '@/lib/remote/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  onSuccess?: () => void;
  layout?: 'default' | 'inline';
}

const getLoginErrorCode = (error: unknown) => {
  if (!isAxiosError(error)) {
    return undefined;
  }

  const payload = error.response?.data as { error?: { code?: string } } | undefined;

  return payload?.error?.code;
};

export function LoginForm({ onSuccess, layout = 'default' }: LoginFormProps) {
  const [studentId, setStudentId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [needsAdminPassword, setNeedsAdminPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const isSubmitDisabled =
    isLoading || studentId.length !== 9 || (needsAdminPassword && adminPassword.length === 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[0-9]{9}$/.test(studentId)) {
      setError('Student ID must be a 9-digit number.');
      return;
    }

    setIsLoading(true);

    try {
      await login(studentId, needsAdminPassword ? adminPassword : undefined);
      setStudentId('');
      setAdminPassword('');
      setNeedsAdminPassword(false);
      onSuccess?.();
    } catch (loginError) {
      match(getLoginErrorCode(loginError))
        .with(AUTH_ERROR_CODES.ADMIN_PASSWORD_REQUIRED, () => {
          setNeedsAdminPassword(true);
          setError('This is an admin account. Please enter the admin password.');
        })
        .with(AUTH_ERROR_CODES.INVALID_ADMIN_PASSWORD, () => {
          setAdminPassword('');
          setError('Incorrect admin password.');
        })
        .otherwise(() => setError('Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setStudentId(value);
    setAdminPassword('');
    setNeedsAdminPassword(false);
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminPassword(e.target.value);
    setError('');
  };

  if (layout === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Input
            type="text"
            value={studentId}
            onChange={handleInputChange}
            placeholder="Enter your 9-digit Student ID"
            className="w-64 border-gray-300 bg-white text-center"
            maxLength={9}
          />
          {needsAdminPassword && (
            <Input
              type="password"
              value={adminPassword}
              onChange={handlePasswordChange}
              placeholder="Admin password"
              aria-label="Admin password"
              autoComplete="current-password"
              className="w-64 border-gray-300 bg-white text-center"
              autoFocus
            />
          )}
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="rounded-full bg-[#615EEB] px-6 text-white transition-all hover:bg-[#5250d9] hover:shadow-md disabled:bg-gray-500"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <Label htmlFor="loginFormStudentId" className="block text-sm font-medium mb-2">
          Student ID
        </Label>
        <Input
          type="text"
          id="loginFormStudentId"
          value={studentId}
          onChange={handleInputChange}
          placeholder="e.g., 202412345"
          className="w-full"
          maxLength={9}
          autoFocus
        />
      </div>
      {needsAdminPassword && (
        <div className="mb-4">
          <Label htmlFor="loginFormAdminPassword" className="block text-sm font-medium mb-2">
            Admin Password
          </Label>
          <Input
            type="password"
            id="loginFormAdminPassword"
            value={adminPassword}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            className="w-full"
            autoFocus
          />
        </div>
      )}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <Button type="submit" disabled={isSubmitDisabled} className="w-full bg-[#615EEB] hover:bg-[#5250d9]">
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
