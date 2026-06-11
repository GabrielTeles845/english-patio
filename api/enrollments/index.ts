// GET /api/enrollments — lista paginada de matrículas/famílias (tela Alunos).
// RBAC: os 3 papéis leem (director/secretary têm CRUD; supervisor só leitura — §3).
// CPF vem MASCARADO na lista (LGPD §3). Filtros via query (todos opcionais).
// DASHBOARD_API §3.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../server/db/client';
import {
  enrollments,
  students,
  responsibles,
  addresses,
  contracts,
} from '../../server/db/schema';
import { ok, fail } from '../../server/lib/http';
import { getSession } from '../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../server/lib/rbac';
import {
  enrollmentDTO,
  studentDTO,
  responsibleDTO,
} from '../../server/lib/serializers';

function qstr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  // ── filtros ────────────────────────────────────────────────────────────────
  const conds = [];
  const period = qstr(req.query.period);
  if (period) conds.push(eq(enrollments.period, period));

  const media = qstr(req.query.media);
  if (media === 'true') conds.push(eq(enrollments.authorizationMedia, true));
  if (media === 'false') conds.push(eq(enrollments.authorizationMedia, false));

  // status da família = tem >=1 aluno ativo (active) ou nenhum (inactive).
  const status = qstr(req.query.status);
  if (status === 'active') {
    conds.push(sql`EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.is_active = true)`);
  } else if (status === 'inactive') {
    conds.push(sql`NOT EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.is_active = true)`);
  }

  const hasSiblings = qstr(req.query.hasSiblings);
  if (hasSiblings === 'true') {
    conds.push(sql`(SELECT count(*) FROM students s WHERE s.enrollment_id = ${enrollments.id}) > 1`);
  }

  const neighborhood = qstr(req.query.neighborhood);
  if (neighborhood) {
    conds.push(sql`EXISTS (SELECT 1 FROM addresses a WHERE a.enrollment_id = ${enrollments.id} AND a.neighborhood ILIKE ${`%${neighborhood}%`})`);
  }

  const contractStatus = qstr(req.query.contractStatus);
  if (contractStatus) {
    conds.push(sql`EXISTS (SELECT 1 FROM contracts c WHERE c.enrollment_id = ${enrollments.id} AND c.status = ${contractStatus})`);
  }

  const q = qstr(req.query.q);
  if (q) {
    const like = `%${q}%`;
    conds.push(sql`(EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.name ILIKE ${like}) OR EXISTS (SELECT 1 FROM responsibles r WHERE r.enrollment_id = ${enrollments.id} AND r.name ILIKE ${like}))`);
  }

  // filtros derivados da turma do aluno (class_id → classes → rooms). AGENDA_PLAN §7.
  const dayPair = qstr(req.query.dayPair);
  if (dayPair === 'seg-qua' || dayPair === 'ter-qui') {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id WHERE s.enrollment_id = ${enrollments.id} AND cl.day_pair = ${dayPair})`);
  }
  const time = qstr(req.query.time);
  if (time) {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id WHERE s.enrollment_id = ${enrollments.id} AND cl.start_time = ${time})`);
  }
  const level = qstr(req.query.level);
  if (level && Number.isInteger(Number(level))) {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id WHERE s.enrollment_id = ${enrollments.id} AND cl.level_id = ${Number(level)})`);
  }
  const room = qstr(req.query.room);
  if (room && Number.isInteger(Number(room))) {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id WHERE s.enrollment_id = ${enrollments.id} AND cl.room_id = ${Number(room)})`);
  }
  const teacher = qstr(req.query.teacher);
  if (teacher === 'none') {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id JOIN rooms ro ON ro.id = cl.room_id WHERE s.enrollment_id = ${enrollments.id} AND ro.teacher_name IS NULL)`);
  } else if (teacher) {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id JOIN rooms ro ON ro.id = cl.room_id WHERE s.enrollment_id = ${enrollments.id} AND ro.teacher_name = ${teacher})`);
  }

  const where = conds.length ? and(...conds) : undefined;

  // ── página de matrículas (grão = família) + total ────────────────────────────
  const pageRows = await db
    .select()
    .from(enrollments)
    .where(where)
    .orderBy(desc(enrollments.submittedAt), desc(enrollments.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(where);
  const total = totalRows[0]?.c ?? 0;

  const ids = pageRows.map((e) => e.id);
  if (!ids.length) return ok(res, { items: [], page, pageSize, total });

  // ── carrega os filhos só das famílias da página ──────────────────────────────
  const kids = await db.select().from(students).where(inArray(students.enrollmentId, ids));
  const resps = await db.select().from(responsibles).where(inArray(responsibles.enrollmentId, ids));
  const addrs = await db.select().from(addresses).where(inArray(addresses.enrollmentId, ids));
  const ctrs = await db
    .select()
    .from(contracts)
    .where(inArray(contracts.enrollmentId, ids))
    .orderBy(desc(contracts.createdAt));

  const kidsBy = new Map<number, typeof kids>();
  for (const k of kids) (kidsBy.get(k.enrollmentId) ?? kidsBy.set(k.enrollmentId, []).get(k.enrollmentId)!).push(k);
  const legalBy = new Map<number, (typeof resps)[number]>();
  for (const r of resps) if (r.type === 'legal' && !legalBy.has(r.enrollmentId)) legalBy.set(r.enrollmentId, r);
  const neighborhoodBy = new Map<number, string>();
  for (const a of addrs) if (!neighborhoodBy.has(a.enrollmentId)) neighborhoodBy.set(a.enrollmentId, a.neighborhood);
  const contractBy = new Map<number, (typeof ctrs)[number]>(); // o mais recente (já ordenado desc)
  for (const c of ctrs) if (!contractBy.has(c.enrollmentId)) contractBy.set(c.enrollmentId, c);

  const items = pageRows.map((e) => {
    const ks = kidsBy.get(e.id) ?? [];
    const legal = legalBy.get(e.id);
    const contract = contractBy.get(e.id);
    return {
      ...enrollmentDTO(e),
      kids: ks.map(studentDTO),
      kidCount: ks.length,
      responsible: legal ? responsibleDTO(legal) : null,
      neighborhood: neighborhoodBy.get(e.id) ?? null,
      contractStatus: contract?.status ?? null,
    };
  });

  return ok(res, { items, page, pageSize, total });
}
