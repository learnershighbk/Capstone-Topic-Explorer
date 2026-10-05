import { createHash, timingSafeEqual } from 'node:crypto';
import { AUTH_ERROR_CODES } from './error';

/**
 * The admin password is a 4-digit PIN by operator choice. A PIN that short is
 * only safe because attempts are capped (see MAX_ADMIN_ATTEMPTS).
 */
const MIN_ADMIN_PASSWORD_LENGTH = 4;

/**
 * Attempts allowed per 24-hour window, enforced atomically in the database by
 * `reserve_admin_login_attempt` (migration 0005). With a 4-digit PIN this
 * caps an attacker's chance per window at 5 / 10,000.
 */
export const MAX_ADMIN_ATTEMPTS = 5;

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
  status: 401 | 429 | 500;
  code:
    | typeof AUTH_ERROR_CODES.ADMIN_PASSWORD_REQUIRED
    | typeof AUTH_ERROR_CODES.INVALID_ADMIN_PASSWORD
    | typeof AUTH_ERROR_CODES.ADMIN_LOCKED
    | typeof AUTH_ERROR_CODES.CONFIG_ERROR;
  message: string;
};

/**
 * First gate, checked before any attempt is counted. Students pass with their
 * ID alone; admin accounts need a configured password and must submit one,
 * because admin IDs are not secret (one is committed to the public repository).
 * Returns `verify` when the submitted password should be checked next.
 */
export function checkAdminPrecondition(
  role: string | null,
  submittedPassword: string | undefined,
  expectedPassword: string | null
): AdminAccessDenial | 'pass' | 'verify' {
  if (role !== 'admin') {
    return 'pass';
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

  return 'verify';
}

/**
 * Second gate, after one attempt has been reserved. Once the cap is exceeded
 * even the correct password is refused, so parallel guessing cannot get past it.
 */
export function judgeAdminAttempt(
  attemptsInWindow: number,
  submittedPassword: string,
  expectedPassword: string
): AdminAccessDenial | null {
  if (attemptsInWindow > MAX_ADMIN_ATTEMPTS) {
    return {
      status: 429,
      code: AUTH_ERROR_CODES.ADMIN_LOCKED,
      message: 'Too many attempts. Admin login is locked for 24 hours.',
    };
  }

  if (!isAdminPasswordValid(submittedPassword, expectedPassword)) {
    const remaining = MAX_ADMIN_ATTEMPTS - attemptsInWindow;

    return {
      status: 401,
      code: AUTH_ERROR_CODES.INVALID_ADMIN_PASSWORD,
      message: `Incorrect admin password. ${remaining} attempt(s) left.`,
    };
  }

  return null;
}
