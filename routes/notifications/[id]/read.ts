// POST /api/notifications/:id/read — marca uma notificação do usuário como lida.
// RBAC: director, secretary. Notificação de outro usuário ⇒ 404 (não vaza existência).
// DASHBOARD_API §12.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../server/db/client';
import { notifications } from '../../../server/db/schema';
import { ok, fail } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { notificationDTO } from '../../../server/lib/serializers';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 404, 'NOTIFICATION_NOT_FOUND', 'Notificação não encontrada.');

  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))
    .limit(1);
  if (!rows.length) return fail(res, 404, 'NOTIFICATION_NOT_FOUND', 'Notificação não encontrada.');

  const current = rows[0];
  if (current.readAt) return ok(res, notificationDTO(current)); // idempotente

  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, id))
    .returning();

  return ok(res, notificationDTO(updated[0]));
}
