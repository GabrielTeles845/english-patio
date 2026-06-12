// GET /api/auth/me — DASHBOARD_API §1.
// Usuário + papel + flag mustChangePassword da sessão atual. Renova o cookie
// (renovação deslizante) preservando a vida máxima absoluta do token.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, fail } from '../../server/lib/http';
import { getSession, sessionCookie } from '../../server/lib/auth';
import { signSession } from '../../server/lib/jwt';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');

  // Renovação deslizante: re-emite com o mesmo `mca` (não estende a vida absoluta).
  const token = await signSession(session.claims);
  res.setHeader('Set-Cookie', sessionCookie(token));

  // Chave VAPID pública (Web Push): o front precisa dela para se inscrever.
  // null quando o push não está configurado no ambiente — o front degrada.
  return ok(res, {
    user: session.user,
    mustChangePassword: session.mustChangePassword,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null,
  });
}
