// Cookies de sessão/CSRF e resolução da sessão a partir do request.
// As duas checagens de revogação (API §0) vivem aqui: is_active e
// password_changed_at posterior à emissão do token.
import type { VercelRequest } from '@vercel/node';
import { serialize, parse } from 'cookie';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema';
import { verifySession, type SessionClaims } from './jwt';

export const SESSION_COOKIE = 'ep_session';
export const CSRF_COOKIE = 'ep_csrf';

const ABSOLUTE_TTL_SECONDS = 12 * 60 * 60;
// secure só em produção (preview/prod da Vercel são HTTPS); em dev local, http.
const SECURE = process.env.NODE_ENV === 'production';

export function readCookie(req: VercelRequest, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  return parse(header)[name];
}

export function sessionCookie(token: string): string {
  return serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: ABSOLUTE_TTL_SECONDS,
  });
}

// CSRF em double-submit: legível pelo front (httpOnly:false) p/ ecoar no header.
// A *exigência* do header x-csrf-token entra junto com as mutações protegidas.
export function csrfCookie(value: string): string {
  return serialize(CSRF_COOKIE, value, {
    httpOnly: false,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: ABSOLUTE_TTL_SECONDS,
  });
}

export function clearAuthCookies(): string[] {
  const expire = { secure: SECURE, sameSite: 'lax' as const, path: '/', maxAge: 0 };
  return [
    serialize(SESSION_COOKIE, '', { httpOnly: true, ...expire }),
    serialize(CSRF_COOKIE, '', { httpOnly: false, ...expire }),
  ];
}

export interface Session {
  user: { id: number; name: string; email: string; role: string };
  mustChangePassword: boolean;
  claims: SessionClaims;
}

export async function getSession(req: VercelRequest): Promise<Session | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;

  const claims = await verifySession(token);
  if (!claims) return null;

  const rows = await db.select().from(users).where(eq(users.id, claims.sub)).limit(1);
  const u = rows[0];
  if (!u || !u.isActive) return null; // (1) desativação barra na requisição seguinte

  // (2) JWT emitido antes de password_changed_at é recusado (trocar senha derruba sessões).
  const dbPwdAt = u.passwordChangedAt ? Math.floor(u.passwordChangedAt.getTime() / 1000) : 0;
  if (dbPwdAt > claims.pwdAt) return null;

  return {
    user: { id: u.id, name: u.name, email: u.email, role: u.role },
    mustChangePassword: u.mustChangePassword,
    claims,
  };
}
