// POST /api/contracts/:id/status — override MANUAL do status do contrato
// (só Diretor, auditado). No fluxo normal o status vem do webhook do Autentique;
// este é o "marcar como" de backup. DASHBOARD_API §6.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { contracts, contractStatus, activityLog } from '../../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { contractDTO } from '../../../server/lib/serializers';

const Body = z.object({ status: z.enum(contractStatus.enumValues) });

// status → coluna de timestamp da transição (pending não tem)
const FIELD: Record<string, 'sentAt' | 'viewedAt' | 'signedAt' | 'rejectedAt' | 'failedAt' | null> = {
  pending: null, sent: 'sentAt', viewed: 'viewedAt', signed: 'signedAt', rejected: 'rejectedAt', failed: 'failedAt',
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Override manual é só do Diretor.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { status } = parsed.data;

  const found = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Contrato não encontrado.');

  const set: Record<string, unknown> = { status };
  const field = FIELD[status];
  if (field) set[field] = new Date();
  const updated = await db.update(contracts).set(set).where(eq(contracts.id, id)).returning();

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'contract_status_override',
    targetType: 'contract', targetId: id, detail: { status }, ip: clientIp(req),
  });

  return ok(res, contractDTO(updated[0]));
}
