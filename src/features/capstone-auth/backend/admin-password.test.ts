import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_ADMIN_ATTEMPTS,
  checkAdminPrecondition,
  getAdminPassword,
  isAdminPasswordValid,
  judgeAdminAttempt,
} from './admin-password';

const PIN = '4821';

describe('isAdminPasswordValid', () => {
  it('accepts the exact PIN', () => {
    expect(isAdminPasswordValid(PIN, PIN)).toBe(true);
  });

  it('rejects a wrong, empty, or differently sized PIN', () => {
    expect(isAdminPasswordValid('1234', PIN)).toBe(false);
    expect(isAdminPasswordValid('', PIN)).toBe(false);
    expect(isAdminPasswordValid(undefined, PIN)).toBe(false);
    expect(isAdminPasswordValid(`${PIN}0`, PIN)).toBe(false);
  });
});

describe('checkAdminPrecondition', () => {
  it('lets students and new IDs through without a PIN', () => {
    expect(checkAdminPrecondition('student', undefined, PIN)).toBe('pass');
    expect(checkAdminPrecondition(null, undefined, PIN)).toBe('pass');
    expect(checkAdminPrecondition('student', undefined, null)).toBe('pass');
  });

  it('asks an admin for the PIN without counting an attempt', () => {
    expect(checkAdminPrecondition('admin', undefined, PIN)).toMatchObject({
      status: 401,
      code: 'ADMIN_PASSWORD_REQUIRED',
    });
  });

  it('fails closed for admins when no PIN is configured', () => {
    expect(checkAdminPrecondition('admin', PIN, null)).toMatchObject({
      status: 500,
      code: 'CONFIG_ERROR',
    });
  });

  it('sends a submitted admin PIN on to verification', () => {
    expect(checkAdminPrecondition('admin', PIN, PIN)).toBe('verify');
  });
});

describe('judgeAdminAttempt', () => {
  it('admits the correct PIN within the limit', () => {
    expect(judgeAdminAttempt(1, PIN, PIN)).toBeNull();
    expect(judgeAdminAttempt(MAX_ADMIN_ATTEMPTS, PIN, PIN)).toBeNull();
  });

  it('rejects a wrong PIN and reports remaining attempts', () => {
    expect(judgeAdminAttempt(2, '0000', PIN)).toMatchObject({
      status: 401,
      code: 'INVALID_ADMIN_PASSWORD',
      message: expect.stringContaining(`${MAX_ADMIN_ATTEMPTS - 2} attempt(s) left`),
    });
  });

  it('locks out once the limit is exceeded, even with the correct PIN', () => {
    expect(judgeAdminAttempt(MAX_ADMIN_ATTEMPTS + 1, PIN, PIN)).toMatchObject({
      status: 429,
      code: 'ADMIN_LOCKED',
    });
  });
});

describe('getAdminPassword', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('treats a PIN shorter than 4 characters as missing', () => {
    vi.stubEnv('ADMIN_PASSWORD', '123');
    expect(getAdminPassword()).toBeNull();
  });

  it('accepts a 4-digit PIN', () => {
    vi.stubEnv('ADMIN_PASSWORD', PIN);
    expect(getAdminPassword()).toBe(PIN);
  });
});
