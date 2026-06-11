// GET /api/contracts — lista/grid de contratos (director, secretary). Filtros:
// ?status, ?period, ?q (nome de aluno/responsável), ?stale=true (parado ≥7 dias).
// "Parado" é derivado on-demand (crons fora de escopo). DASHBOARD_API §6.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { contracts, contractStatus, enrollments, students, responsibles } from '../../server/db/schema';
import { ok, fail } from '../../server/lib/http';
import { getSession } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { contractDTO } from '../../server/lib/serializers';
import { isContractStale } from '../../server/lib/contracts';

function qstr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const conds = [];
  const status = qstr(req.query.status);
  if (status && (contractStatus.enumValues as readonly string[]).includes(status)) {
    conds.push(eq(contracts.status, status as (typeof contractStatus.enumValues)[number]));
  }
  const period = qstr(req.query.period);
  if (period) conds.push(eq(enrollments.period, period));
  const q = qstr(req.query.q);
  if (q) {
    const like = `%${q}%`;
    conds.push(sql`(EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.name ILIKE ${like}) OR EXISTS (SELECT 1 FROM responsibles r WHERE r.enrollment_id = ${enrollments.id} AND r.name ILIKE ${like}))`);
  }
  if (qstr(req.query.stale) === 'true') {
    conds.push(sql`((${contracts.status} = 'sent' AND ${contracts.sentAt} <= now() - interval '7 days') OR (${contracts.status} = 'viewed' AND ${contracts.viewedAt} <= now() - interval '7 days'))`);
  }
  const where = conds.length ? and(...conds) : undefined;

  const pageRows = await db
    .select({ contract: contracts, period: enrollments.period })
    .from(contracts)
    .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
    .where(where)
    .orderBy(desc(contracts.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(contracts)
    .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
    .where(where);
  const total = totalRows[0]?.c ?? 0;

  const enrollIds = [...new Set(pageRows.map((r) => r.contract.enrollmentId))];
  const kidsBy = new Map<number, string[]>();
  const legalBy = new Map<number, string>();
  if (enrollIds.length) {
    const kids = await db.select({ e: students.enrollmentId, name: students.name }).from(students).where(inArray(students.enrollmentId, enrollIds));
    for (const k of kids) (kidsBy.get(k.e) ?? kidsBy.set(k.e, []).get(k.e)!).push(k.name);
    const resps = await db.select({ e: responsibles.enrollmentId, name: responsibles.name, type: responsibles.type }).from(responsibles).where(inArray(responsibles.enrollmentId, enrollIds));
    for (const r of resps) if (r.type === 'legal' && !legalBy.has(r.e)) legalBy.set(r.e, r.name);
  }

  const items = pageRows.map((r) => ({
    ...contractDTO(r.contract),
    period: r.period,
    studentNames: kidsBy.get(r.contract.enrollmentId) ?? [],
    responsibleName: legalBy.get(r.contract.enrollmentId) ?? null,
    stale: isContractStale(r.contract),
  }));

  return ok(res, { items, page, pageSize, total });
}
