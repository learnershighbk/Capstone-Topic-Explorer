'use client';

import { useState } from 'react';
import { useAuth } from '../context/capstone-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  onSuccess?: () => void;
  layout?: 'default' | 'inline';
}

export function LoginForm({ onSuccess, layout = 'default' }: LoginFormProps) {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[0-9]{9}$/.test(studentId)) {
      setError('Student ID must be a 9-digit number.');
      return;
    }

    setIsLoading(true);

    try {
      await login(studentId);
      setStudentId('');
      onSuccess?.();
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setStudentId(value);
    setError('');
  };

  if (layout === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <Input
            type="text"
            value={studentId}
            onChange={handleInputChange}
            placeholder="Enter your 9-digit Student ID"
            className="w-64 border-gray-300 bg-white text-center"
            maxLength={9}
          />
          <Button
            type="submit"
            disabled={isLoading || studentId.length !== 9}
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
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      <Button
        type="submit"
        disabled={isLoading || studentId.length !== 9}
        className="w-full bg-[#615EEB] hover:bg-[#5250d9]"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
