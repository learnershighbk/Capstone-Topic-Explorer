'use client';

import { useState } from 'react';
import { useAuth } from '../context/capstone-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[0-9]{9}$/.test(studentId)) {
      setError('학번은 9자리 숫자여야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      await login(studentId);
      onClose();
      setStudentId('');
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setStudentId(value);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Login</h2>
        <p className="text-gray-600 mb-6">
          Enter your 9-digit student ID to login.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="studentId" className="block text-sm font-medium mb-2">
              Student ID
            </Label>
            <Input
              type="text"
              id="studentId"
              value={studentId}
              onChange={handleInputChange}
              placeholder="e.g., 202412345"
              className="w-full"
              maxLength={9}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || studentId.length !== 9}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
