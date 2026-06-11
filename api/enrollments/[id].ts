// GET /api/enrollments/:id — detalhe completo da matrícula/família (tela Detalhe).
// RBAC: os 3 papéis leem. Revela o CPF inteiro dos responsáveis ⇒ grava log
// `view_student_pii` (LGPD §3). DASHBOARD_API §3.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../../server/db/client';
import {
  enrollments,
  students,
  responsibles,
  addresses,
  contracts,
  activityLog,
} from '../../server/db/schema';
import { ok, fail, clientIp } from '../../server/lib/http';
import { getSession } from '../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../server/lib/rbac';
import {
  enrollmentDTO,
  studentDTO,
  responsibleDTO,
  addressDTO,
  contractDTO,
} from '../../server/lib/serializers';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const found = await db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Matrícula não encontrada.');
  const e = found[0];

  const kids = await db
    .select()
    .from(students)
    .where(eq(students.enrollmentId, id))
    .orderBy(asc(students.id));
  const resps = await db
    .select()
    .from(responsibles)
    .where(eq(responsibles.enrollmentId, id))
    .orderBy(asc(responsibles.id));
  const addr = await db.select().from(addresses).where(eq(addresses.enrollmentId, id)).limit(1);
  const ctrs = await db
    .select()
    .from(contracts)
    .where(eq(contracts.enrollmentId, id))
    .orderBy(desc(contracts.createdAt));

  // Acesso a PII (CPF inteiro) é auditado — quem, quando, qual matrícula (LGPD §3).
  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'view_student_pii',
    targetType: 'enrollment',
    targetId: id,
    ip: clientIp(req),
  });

  return ok(res, {
    ...enrollmentDTO(e),
    students: kids.map(studentDTO),
    responsibles: resps.map((r) => responsibleDTO(r, { revealCpf: true })),
    address: addr.length ? addressDTO(addr[0]) : null,
    contracts: ctrs.map(contractDTO),
    contract: ctrs.length ? contractDTO(ctrs[0]) : null, // o mais recente (atalho p/ a UI)
  });
}
