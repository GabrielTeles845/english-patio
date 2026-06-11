// Tokens de redefinição de senha. Guardamos só o HASH (sha256) — nunca o token
// em claro (DASHBOARD_PLAN §3, schema password_reset_tokens). DASHBOARD_API §1.
import { randomBytes, createHash } from 'node:crypto';

export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}
