// GET /api/activity — registro de atividades (RBAC: director). Somente leitura.
// Filtros: ?actor (userId, ou 'system'/'autentique'), ?q (busca em ação/ator),
// paginação ?page&?pageSize. DASHBOARD_API §11.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../server/db/client';
import { activityLog, users } from '../server/db/schema';
import { ok, fail } from '../server/lib/http';
import { getSession } from '../server/lib/auth';
import { hasRole } from '../server/lib/rbac';

function actorName(actorType: string, userName: string | null): string {
  if (actorType === 'system') return 'Sistema';
  if (actorType === 'autentique') return 'Autentique';
  return userName ?? '[removido]'; // ator humano apagado (LGPD: trilha preservada)
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const conds = [];
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q) conds.push(or(ilike(activityLog.action, `%${q}%`), ilike(users.name, `%${q}%`)));
  const actor = typeof req.query.actor === 'string' ? req.query.actor : '';
  if (actor === 'system' || actor === 'autentique') {
    conds.push(eq(activityLog.actorType, actor));
  } else if (actor && Number.isInteger(Number(actor))) {
    conds.push(eq(activityLog.actorId, Number(actor)));
  }
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select({
      id: activityLog.id,
      actorType: activityLog.actorType,
      actorUserName: users.name,
      action: activityLog.action,
      targetType: activityLog.targetType,
      targetId: activityLog.targetId,
      detail: activityLog.detail,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.actorId, users.id))
    .where(where)
    .orderBy(desc(activityLog.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.actorId, users.id))
    .where(where);
  const total = totalRows[0]?.c ?? 0;

  const items = rows.map((r) => ({
    id: r.id,
    actorType: r.actorType,
    actorName: actorName(r.actorType, r.actorUserName),
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    detail: r.detail,
    createdAt: r.createdAt,
  }));

  return ok(res, { items, page, pageSize, total });
}
