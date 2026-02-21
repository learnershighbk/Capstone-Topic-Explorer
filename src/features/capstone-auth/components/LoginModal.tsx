'use client';

import { Button } from '@/components/ui/button';
import { LoginForm } from './LoginForm';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Login</h2>
        <p className="text-gray-600 mb-6">
          Enter your 9-digit student ID to login.
        </p>

        <LoginForm onSuccess={onClose} />

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
