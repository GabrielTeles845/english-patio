// POST /api/notifications/subscribe — registra a inscrição de Web Push do
// navegador atual (RBAC: director, secretary — quem tem sino). Upsert pelo
// endpoint (único por navegador), reapontando para o usuário logado se outro
// fizer login no mesmo navegador. DASHBOARD_API.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { pushSubscriptions } from '../../server/db/schema';
import { ok, fail, zodFields } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';

// Formato do PushSubscription.toJSON() do navegador.
const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));

  const { endpoint, keys } = parsed.data;
  const uaRaw = req.headers['user-agent'];
  const userAgent = (Array.isArray(uaRaw) ? uaRaw[0] : uaRaw) ?? null;

  await db
    .insert(pushSubscriptions)
    .values({ userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    });

  return ok(res, { subscribed: true });
}
