// POST /api/users/:id/deactivate — desativa usuário (RBAC: director). DASHBOARD_API §10.
// Não desativa o último Diretor ativo (422 LAST_DIRECTOR). Desativar barra a sessão
// do alvo na requisição seguinte (getSession checa is_active).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../../../server/db/client';
import { users, activityLog } from '../../../server/db/schema';
import { ok, fail, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { userDTO } from '../../../server/lib/serializers';
import { activeDirectorCount, blocksLastDirector } from '../../../server/lib/users';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 404, 'USER_NOT_FOUND', 'Usuário não encontrado.');

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!rows.length) return fail(res, 404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
  const target = rows[0];

  if (blocksLastDirector(target, await activeDirectorCount())) {
    return fail(res, 422, 'LAST_DIRECTOR', 'Não é possível desativar o último Diretor ativo.');
  }

  const updated = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'user_deactivated',
    targetType: 'user',
    targetId: id,
    ip: clientIp(req),
  });

  return ok(res, userDTO(updated[0]));
}
