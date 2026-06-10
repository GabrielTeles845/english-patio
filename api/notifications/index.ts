// GET /api/notifications — central do usuário (RBAC: director, secretary).
// Supervisor não tem sino ⇒ 403 (DASHBOARD_PLAN §4). Filtro opcional ?unread=true.
// DASHBOARD_API §12.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { notifications } from '../../server/db/schema';
import { ok, fail } from '../../server/lib/http';
import { getSession } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { notificationDTO } from '../../server/lib/serializers';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const conds = [eq(notifications.userId, session.user.id)];
  if (req.query.unread === 'true') conds.push(isNull(notifications.readAt));

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conds))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return ok(res, rows.map(notificationDTO));
}
