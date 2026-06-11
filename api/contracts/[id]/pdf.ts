// GET /api/contracts/:id/pdf — devolve a URL do PDF do contrato (director,
// secretary) e grava log de acesso (LGPD). O binário fica em storage externa
// (Drive/Blob); aqui entregamos a URL assinada/pública. DASHBOARD_API §6.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../../../server/db/client';
import { contracts, activityLog } from '../../../server/db/schema';
import { ok, fail, clientIp } from '../../../server/lib/http';
import { getSession } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const found = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Contrato não encontrado.');
  if (!found[0].pdfUrl) return fail(res, 404, 'NO_PDF', 'PDF ainda não gerado para este contrato.');

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'contract_pdf_download',
    targetType: 'contract', targetId: id, ip: clientIp(req),
  });

  return ok(res, { url: found[0].pdfUrl });
}
