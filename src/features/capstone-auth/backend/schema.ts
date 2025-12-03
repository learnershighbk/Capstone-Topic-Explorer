import { z } from 'zod';

export const loginRequestSchema = z.object({
  studentId: z
    .string()
    .length(9, 'Student ID must be exactly 9 digits')
    .regex(/^[0-9]{9}$/, 'Student ID must contain only digits'),
});

export const loginResponseSchema = z.object({
  studentId: z.string(),
  isNewUser: z.boolean(),
  lastLoginAt: z.string(),
});

export const sessionResponseSchema = z.object({
  isLoggedIn: z.boolean(),
  studentId: z.string().nullable(),
});

export const logoutResponseSchema = z.object({
  message: z.string(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
