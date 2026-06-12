// GET /api/levels — lista os 19 níveis em ordem de evolução (os 3 papéis).
// DASHBOARD_API §5.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc } from 'drizzle-orm';
import { db } from '../server/db/client';
import { levels } from '../server/db/schema';
import { ok, fail } from '../server/lib/http';
import { getSession } from '../server/lib/auth';
import { hasRole, ALL_ROLES } from '../server/lib/rbac';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const all = await db.select().from(levels).orderBy(asc(levels.sortOrder));
  return ok(
    res,
    all.map((l) => ({ id: l.id, key: l.key, name: l.name, family: l.family, sortOrder: l.sortOrder })),
  );
}
