// GET /api/contracts/:id — detalhe do contrato + timeline (director, secretary).
// A timeline são os contract_events (eventos do webhook do Autentique), em ordem.
// DASHBOARD_API §6.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { contracts, contractEvents, enrollments, students, responsibles } from '../../server/db/schema';
import { ok, fail } from '../../server/lib/http';
import { getSession } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { contractDTO, contractEventDTO, studentDTO } from '../../server/lib/serializers';
import { isContractStale } from '../../server/lib/contracts';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const found = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Contrato não encontrado.');
  const c = found[0];

  const enr = await db.select().from(enrollments).where(eq(enrollments.id, c.enrollmentId)).limit(1);
  const kids = await db.select().from(students).where(eq(students.enrollmentId, c.enrollmentId)).orderBy(asc(students.id));
  const legal = await db.select({ name: responsibles.name, phone: responsibles.phone })
    .from(responsibles)
    .where(eq(responsibles.enrollmentId, c.enrollmentId));
  const events = await db
    .select()
    .from(contractEvents)
    .where(eq(contractEvents.contractId, id))
    .orderBy(asc(contractEvents.receivedAt));

  const legalResp = legal.find(() => true) ?? null;

  return ok(res, {
    ...contractDTO(c),
    stale: isContractStale(c),
    period: enr.length ? enr[0].period : null,
    classFormat: enr.length ? enr[0].classFormat : null,
    students: kids.map(studentDTO),
    responsibleName: legalResp?.name ?? null,
    responsiblePhone: legalResp?.phone ?? null,
    timeline: events.map(contractEventDTO),
  });
}
