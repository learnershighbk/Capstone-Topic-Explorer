import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'capstone_session';
export const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** HMAC-SHA256 needs at least 32 bytes of secret to be meaningful. */
const MIN_SECRET_LENGTH = 32;

export interface SessionData {
  studentId: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Returns the cookie-signing secret, or null when it is missing or too short.
 * Callers fail closed: without a secret no session can be issued or trusted.
 */
export function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return null;
  }

  return secret;
}

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

const isSessionData = (value: unknown): value is SessionData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.studentId === 'string' &&
    typeof candidate.createdAt === 'number' &&
    typeof candidate.expiresAt === 'number'
  );
};

/** Serializes a session as `<base64url payload>.<base64url HMAC>` so the client cannot alter it. */
export function signSession(session: SessionData, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');

  return `${payload}.${sign(payload, secret)}`;
}

/**
 * Returns the session only if the signature matches and it has not expired.
 * Unsigned cookies issued before signing was introduced are rejected, which
 * forces a one-time re-login.
 */
export function verifySession(
  cookieValue: string | undefined,
  secret: string,
  now: number = Date.now()
): SessionData | null {
  if (!cookieValue) {
    return null;
  }

  const [payload, signature, ...rest] = cookieValue.split('.');

  if (!payload || !signature || rest.length > 0) {
    return null;
  }

  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

    if (!isSessionData(session) || session.expiresAt < now) {
      return null;
    }

    return { ...session, role: session.role ?? 'student' };
  } catch {
    return null;
  }
}

/** Reads and verifies a session cookie using the configured secret. */
export function getSessionFromCookie(cookieValue: string | undefined): SessionData | null {
  const secret = getSessionSecret();

  if (!secret) {
    console.error('[Auth] SESSION_SECRET is missing or shorter than 32 characters');
    return null;
  }

  return verifySession(cookieValue, secret);
}
