// POST /api/contracts/:id/send — envia o contrato via Autentique (director,
// secretary). Guarda autentique_doc_id, status → sent. Os status seguintes vêm
// do webhook (§9). DASHBOARD_API §6.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { contracts, enrollments, responsibles, students, activityLog } from '../../../server/db/schema';
import { ok, fail, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { contractDTO } from '../../../server/lib/serializers';
import { createDocument } from '../../../server/lib/autentique';

const Body = z.object({ channels: z.array(z.enum(['email', 'whatsapp'])).optional() });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.');
  const channels = parsed.data.channels && parsed.data.channels.length ? [...new Set(parsed.data.channels)] : ['email'];

  const found = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Contrato não encontrado.');
  const contract = found[0];
  if (contract.status === 'signed') return fail(res, 422, 'ALREADY_SIGNED', 'Contrato já assinado.');

  // responsável legal (destino da entrega) + nome do aluno (nome do documento).
  const legal = await db.select({ name: responsibles.name, email: responsibles.email, phone: responsibles.phone, type: responsibles.type })
    .from(responsibles).where(eq(responsibles.enrollmentId, contract.enrollmentId));
  const resp = legal.find((r) => r.type === 'legal') ?? legal[0] ?? null;
  const kid = await db.select({ name: students.name }).from(students).where(eq(students.enrollmentId, contract.enrollmentId)).orderBy(asc(students.id)).limit(1);
  const enr = await db.select({ period: enrollments.period }).from(enrollments).where(eq(enrollments.id, contract.enrollmentId)).limit(1);

  const docName = `Contrato ${kid.length ? kid[0].name : ''} ${enr.length ? enr[0].period : ''}`.trim();
  const doc = await createDocument({ name: docName, to: { email: resp?.email, phone: resp?.phone }, channels });

  const sentVia = channels.includes('email') ? 'email' : 'whatsapp';
  const updated = await db
    .update(contracts)
    .set({ status: 'sent', autentiqueDocId: doc.docId, sentVia, sentAt: new Date() })
    .where(eq(contracts.id, id))
    .returning();

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'contract_sent',
    targetType: 'contract', targetId: id, detail: { channels, docId: doc.docId, stub: doc.stub }, ip: clientIp(req),
  });

  return ok(res, contractDTO(updated[0]));
}
