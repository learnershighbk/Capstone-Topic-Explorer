import { createHash, timingSafeEqual } from 'node:crypto';
import { AUTH_ERROR_CODES } from './error';

/**
 * Admin login has no rate limiting, so the password must be long enough that
 * guessing it online is infeasible. Generate it randomly; do not pick a word.
 */
const MIN_ADMIN_PASSWORD_LENGTH = 16;

/** Returns the configured admin password, or null when it is missing or too short. */
export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return null;
  }

  return password;
}

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();

/** Constant-time comparison; hashing first equalizes lengths so timing leaks nothing. */
export function isAdminPasswordValid(input: string | undefined, expected: string): boolean {
  if (!input) {
    return false;
  }

  return timingSafeEqual(digest(input), digest(expected));
}

export type AdminAccessDenial = {
  status: 401 | 500;
  code:
    | typeof AUTH_ERROR_CODES.ADMIN_PASSWORD_REQUIRED
    | typeof AUTH_ERROR_CODES.INVALID_ADMIN_PASSWORD
    | typeof AUTH_ERROR_CODES.CONFIG_ERROR;
  message: string;
};

/**
 * Decides whether a login may proceed. Students pass with their ID alone;
 * admin accounts additionally need the admin password, because admin IDs are
 * not secret (one is committed to the public repository).
 */
export function checkAdminAccess(
  role: string | null,
  submittedPassword: string | undefined,
  expectedPassword: string | null
): AdminAccessDenial | null {
  if (role !== 'admin') {
    return null;
  }

  if (!expectedPassword) {
    return {
      status: 500,
      code: AUTH_ERROR_CODES.CONFIG_ERROR,
      message: 'Admin login is not configured.',
    };
  }

  if (!submittedPassword) {
    return {
      status: 401,
      code: AUTH_ERROR_CODES.ADMIN_PASSWORD_REQUIRED,
      message: 'Admin password is required.',
    };
  }

  if (!isAdminPasswordValid(submittedPassword, expectedPassword)) {
    return {
      status: 401,
      code: AUTH_ERROR_CODES.INVALID_ADMIN_PASSWORD,
      message: 'Incorrect admin password.',
    };
  }

  return null;
}
