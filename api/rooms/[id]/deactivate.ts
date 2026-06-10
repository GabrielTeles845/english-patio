// POST /api/rooms/:id/deactivate — desativa a sala (os 3 papéis).
// Só se não houver turmas vinculadas (422 ROOM_HAS_CLASSES). DASHBOARD_API §5, VALIDACOES §11.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../../server/db/client';
import { rooms, classes, activityLog } from '../../../server/db/schema';
import { ok, fail, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../../server/lib/rbac';
import { roomDTO } from '../../../server/lib/serializers';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 404, 'ROOM_NOT_FOUND', 'Sala não encontrada.');

  const current = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  if (!current.length) return fail(res, 404, 'ROOM_NOT_FOUND', 'Sala não encontrada.');

  const linked = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(classes)
    .where(eq(classes.roomId, id));
  if ((linked[0]?.c ?? 0) > 0) {
    return fail(res, 422, 'ROOM_HAS_CLASSES', 'Mova as turmas antes de desativar a sala.');
  }

  const updated = await db
    .update(rooms)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(rooms.id, id))
    .returning();

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'room_deactivated',
    targetType: 'room',
    targetId: id,
    ip: clientIp(req),
  });

  return ok(res, roomDTO(updated[0]));
}
