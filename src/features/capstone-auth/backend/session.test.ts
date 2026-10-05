import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getSessionFromCookie,
  getSessionSecret,
  signSession,
  verifySession,
  type SessionData,
} from './session';

const SECRET = 'a'.repeat(64);
const NOW = 1_800_000_000_000;

const session: SessionData = {
  studentId: '202412345',
  role: 'student',
  createdAt: NOW,
  expiresAt: NOW + 60_000,
};

const tamperPayload = (cookie: string, patch: Partial<SessionData>) => {
  const [payload, signature] = cookie.split('.');
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  const forged = Buffer.from(JSON.stringify({ ...decoded, ...patch })).toString('base64url');
  return `${forged}.${signature}`;
};

describe('signSession / verifySession', () => {
  it('round-trips a valid session', () => {
    expect(verifySession(signSession(session, SECRET), SECRET, NOW)).toEqual(session);
  });

  it('rejects a payload edited to escalate the role', () => {
    const forged = tamperPayload(signSession(session, SECRET), { role: 'admin' });
    expect(verifySession(forged, SECRET, NOW)).toBeNull();
  });

  it('rejects a payload edited to impersonate another student', () => {
    const forged = tamperPayload(signSession(session, SECRET), { studentId: '999999999' });
    expect(verifySession(forged, SECRET, NOW)).toBeNull();
  });

  it('rejects a cookie signed with a different secret', () => {
    expect(verifySession(signSession(session, 'b'.repeat(64)), SECRET, NOW)).toBeNull();
  });

  it('rejects an expired session', () => {
    expect(verifySession(signSession(session, SECRET), SECRET, session.expiresAt + 1)).toBeNull();
  });

  it('rejects legacy unsigned JSON cookies', () => {
    expect(verifySession(JSON.stringify(session), SECRET, NOW)).toBeNull();
  });

  it('rejects empty and malformed values', () => {
    expect(verifySession(undefined, SECRET, NOW)).toBeNull();
    expect(verifySession('', SECRET, NOW)).toBeNull();
    expect(verifySession('a.b.c', SECRET, NOW)).toBeNull();
    expect(verifySession('not-a-cookie', SECRET, NOW)).toBeNull();
  });

  it('defaults a missing role to student', () => {
    const { role: _role, ...withoutRole } = session;
    const cookie = signSession(withoutRole as SessionData, SECRET);
    expect(verifySession(cookie, SECRET, NOW)?.role).toBe('student');
  });
});

describe('getSessionSecret / getSessionFromCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('treats a short secret as missing', () => {
    vi.stubEnv('SESSION_SECRET', 'too-short');
    expect(getSessionSecret()).toBeNull();
  });

  it('fails closed when the secret is missing', () => {
    vi.stubEnv('SESSION_SECRET', '');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(getSessionFromCookie(signSession(session, SECRET))).toBeNull();
  });

  it('verifies with the configured secret', () => {
    vi.stubEnv('SESSION_SECRET', SECRET);
    const live = { ...session, expiresAt: Date.now() + 60_000 };
    expect(getSessionFromCookie(signSession(live, SECRET))).toEqual(live);
  });
});
