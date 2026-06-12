// GET /api/enrollments/export?…filtros… — exporta a lista (mesmos filtros) em CSV
// (director, secretary). Grava log export_students (LGPD — quem exportou).
// DASHBOARD_API §4.8.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, asc, desc, inArray } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, addresses, contracts, activityLog } from '../../server/db/schema';
import { fail, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { buildEnrollmentConds, csvCell } from '../../server/lib/enrollmentFilters';
import { maskCpf } from '../../server/lib/serializers';

const HEADER = ['id', 'periodo', 'status', 'alunos', 'responsavel', 'cpf', 'telefone', 'email', 'bairro', 'cidade', 'contrato', 'matriculado_em'];

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  // export muta nada, mas expõe PII em massa: exige CSRF (chamada autenticada).
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const conds = buildEnrollmentConds(req.query as Record<string, unknown>);
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db.select().from(enrollments).where(where).orderBy(desc(enrollments.submittedAt));
  const ids = rows.map((e) => e.id);

  const kidsBy = new Map<number, { name: string; active: boolean }[]>();
  const legalBy = new Map<number, typeof responsibles.$inferSelect>();
  const addrBy = new Map<number, typeof addresses.$inferSelect>();
  const contractBy = new Map<number, string>();
  if (ids.length) {
    const kids = await db.select().from(students).where(inArray(students.enrollmentId, ids)).orderBy(asc(students.id));
    for (const k of kids) (kidsBy.get(k.enrollmentId) ?? kidsBy.set(k.enrollmentId, []).get(k.enrollmentId)!).push({ name: k.name, active: k.isActive });
    const resps = await db.select().from(responsibles).where(inArray(responsibles.enrollmentId, ids));
    for (const r of resps) if (r.type === 'legal' && !legalBy.has(r.enrollmentId)) legalBy.set(r.enrollmentId, r);
    const addrs = await db.select().from(addresses).where(inArray(addresses.enrollmentId, ids));
    for (const a of addrs) if (!addrBy.has(a.enrollmentId)) addrBy.set(a.enrollmentId, a);
    const ctrs = await db.select().from(contracts).where(inArray(contracts.enrollmentId, ids)).orderBy(desc(contracts.createdAt));
    for (const c of ctrs) if (!contractBy.has(c.enrollmentId)) contractBy.set(c.enrollmentId, c.status);
  }

  const lines = [HEADER.join(',')];
  for (const e of rows) {
    const kids = kidsBy.get(e.id) ?? [];
    const legal = legalBy.get(e.id);
    const addr = addrBy.get(e.id);
    const familyStatus = kids.some((k) => k.active) ? 'ativo' : 'inativo';
    lines.push([
      e.id, e.period, familyStatus,
      kids.map((k) => k.name).join(' | '),
      legal?.name ?? '', maskCpf(legal?.cpf ?? null) ?? '', legal?.phone ?? '', legal?.email ?? '',
      addr?.neighborhood ?? '', addr?.city ?? '',
      contractBy.get(e.id) ?? '',
      e.submittedAt.toISOString(),
    ].map(csvCell).join(','));
  }
  const csv = `﻿${lines.join('\r\n')}`; // BOM p/ acentos no Excel

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'export_students',
    targetType: 'enrollment', detail: { count: rows.length }, ip: clientIp(req),
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="matriculas.csv"');
  res.status(200).send(csv);
}
