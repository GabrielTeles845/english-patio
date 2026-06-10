// POST /api/auth/logout — DASHBOARD_API §1.
// Stateless: limpa os cookies de sessão/CSRF (não há tabela de sessões).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, fail } from '../../server/lib/http';
import { clearAuthCookies } from '../../server/lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  res.setHeader('Set-Cookie', clearAuthCookies());
  return ok(res, { loggedOut: true });
}
