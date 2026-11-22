import crypto from 'crypto';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export type UserRole = 'CONSUMER' | 'PRODUCER' | 'AMBASSADOR' | 'ADMIN';

export interface AuthenticatedUser {
  id: number;
  uid: string | null;
  email: string;
  name: string;
  role: UserRole;
  locale: string;
  wilaya: string;
  active: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const SESSION_SECRET =
  process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
export const SESSION_COOKIE_NAME = 'athar_session';

interface SessionPayload {
  userId: number;
  role: UserRole;
  exp: number;
}

export function createSessionToken(userId: number, role: UserRole): string {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(encoded)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (!payload.userId || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  const opts: CookieOptions & { partitioned?: boolean } = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  res.cookie(SESSION_COOKIE_NAME, token, opts);
}

export function clearSessionCookie(res: Response): void {
  const opts: CookieOptions & { partitioned?: boolean } = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    path: '/',
  };
  res.clearCookie(SESSION_COOKIE_NAME, opts);
}

async function resolveUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  const cookieToken =
    typeof req.cookies?.[SESSION_COOKIE_NAME] === 'string'
      ? req.cookies[SESSION_COOKIE_NAME]
      : null;

  // 1. Check custom signed session token (Bearer first, then HttpOnly cookie)
  const candidateSessionToken = bearerToken || cookieToken;
  if (candidateSessionToken) {
    const parsed = verifySessionToken(candidateSessionToken);
    if (parsed) {
      try {
        const [u] = await db
          .select()
          .from(users)
          .where(eq(users.id, parsed.userId))
          .limit(1);
        if (u && u.active) {
          return {
            id: u.id,
            uid: u.uid,
            email: u.email,
            name: u.name,
            role: u.role as UserRole,
            locale: u.locale,
            wilaya: u.wilaya,
            active: u.active,
          };
        }
      } catch (err) {
        console.error('Session user lookup error:', err);
        return null;
      }
    }
  }

  // 2. Check Firebase ID token if Bearer token wasn't a custom session token
  if (bearerToken && bearerToken.split('.').length === 3) {
    try {
      const decoded = await adminAuth.verifyIdToken(bearerToken);
      const email = decoded.email || `${decoded.uid}@firebase.athar.dz`;
      const displayName = decoded.name || email.split('@')[0];

      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let u = existingByEmail;
      if (u) {
        if (!u.uid) {
          const [updated] = await db
            .update(users)
            .set({ uid: decoded.uid })
            .where(eq(users.id, u.id))
            .returning();
          u = updated;
        }
      } else {
        const [upserted] = await db
          .insert(users)
          .values({
            uid: decoded.uid,
            email,
            name: displayName,
            role: 'CONSUMER',
            locale: 'ar',
            wilaya: '16 - Alger',
            active: true,
          })
          .onConflictDoUpdate({
            target: users.uid,
            set: { email, name: displayName },
          })
          .returning();
        u = upserted;
      }

      if (u && u.active) {
        return {
          id: u.id,
          uid: u.uid,
          email: u.email,
          name: u.name,
          role: u.role as UserRole,
          locale: u.locale,
          wilaya: u.wilaya,
          active: u.active,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const user = await resolveUserFromRequest(req);
  if (user) req.user = user;
  next();
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const user = await resolveUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;
  next();
}

export function hasAllowedRole(
  userRole: UserRole | undefined,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!hasAllowedRole(req.user.role, roles)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

/**
 * CSRF protection for cookie-authenticated state-changing requests.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }
  const hasAuthHeader = Boolean(req.headers.authorization?.startsWith('Bearer '));
  const hasSessionCookie = Boolean(req.cookies?.[SESSION_COOKIE_NAME]);
  if (hasSessionCookie && !hasAuthHeader) {
    const requestedWith = req.headers['x-requested-with'];
    const origin = req.headers.origin;
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '') as string;
    const originHost = origin
      ? (() => {
          try {
            return new URL(origin).host;
          } catch {
            return '';
          }
        })()
      : '';
    if (requestedWith !== 'XMLHttpRequest' && (!originHost || originHost !== host)) {
      return res.status(403).json({ error: 'CSRF validation failed' });
    }
  }
  next();
}

// Simple sliding-window in-memory rate limiter for auth endpoints
const rateBuckets = new Map<string, number[]>();

export function authRateLimiter(maxRequests = 25, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const history = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
    if (history.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many authentication attempts. Please try again shortly.',
      });
    }
    history.push(now);
    rateBuckets.set(key, history);
    next();
  };
}
