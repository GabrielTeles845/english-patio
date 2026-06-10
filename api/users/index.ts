// GET /api/users — lista de usuários (RBAC: director). DASHBOARD_API §10.
// Nunca devolve password_hash (ver userDTO). Create/edit/deactivate virão depois.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { users } from '../../server/db/schema';
import { ok, fail } from '../../server/lib/http';
import { getSession } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { userDTO } from '../../server/lib/serializers';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const all = await db.select().from(users).orderBy(asc(users.id));
  return ok(res, all.map(userDTO));
}
