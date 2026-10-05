import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAdminAccess, getAdminPassword, isAdminPasswordValid } from './admin-password';

const PASSWORD = 'correct-horse-battery-staple-42';

describe('isAdminPasswordValid', () => {
  it('accepts the exact password', () => {
    expect(isAdminPasswordValid(PASSWORD, PASSWORD)).toBe(true);
  });

  it('rejects a wrong, empty, or differently sized password', () => {
    expect(isAdminPasswordValid('wrong-password-0000', PASSWORD)).toBe(false);
    expect(isAdminPasswordValid('', PASSWORD)).toBe(false);
    expect(isAdminPasswordValid(undefined, PASSWORD)).toBe(false);
    expect(isAdminPasswordValid(`${PASSWORD}x`, PASSWORD)).toBe(false);
  });
});

describe('checkAdminAccess', () => {
  it('lets students and new IDs through without a password', () => {
    expect(checkAdminAccess('student', undefined, PASSWORD)).toBeNull();
    expect(checkAdminAccess(null, undefined, PASSWORD)).toBeNull();
    expect(checkAdminAccess('student', undefined, null)).toBeNull();
  });

  it('asks an admin for the password', () => {
    expect(checkAdminAccess('admin', undefined, PASSWORD)).toMatchObject({
      status: 401,
      code: 'ADMIN_PASSWORD_REQUIRED',
    });
  });

  it('rejects an admin with the wrong password', () => {
    expect(checkAdminAccess('admin', 'guess', PASSWORD)).toMatchObject({
      status: 401,
      code: 'INVALID_ADMIN_PASSWORD',
    });
  });

  it('admits an admin with the right password', () => {
    expect(checkAdminAccess('admin', PASSWORD, PASSWORD)).toBeNull();
  });

  it('fails closed for admins when no password is configured', () => {
    expect(checkAdminAccess('admin', PASSWORD, null)).toMatchObject({
      status: 500,
      code: 'CONFIG_ERROR',
    });
  });
});

describe('getAdminPassword', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('treats a short password as missing', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'short');
    expect(getAdminPassword()).toBeNull();
  });

  it('returns a sufficiently long password', () => {
    vi.stubEnv('ADMIN_PASSWORD', PASSWORD);
    expect(getAdminPassword()).toBe(PASSWORD);
  });
});
