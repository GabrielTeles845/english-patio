// POST /api/templates/:id/activate — define o modelo ativo (só Diretor). Exige
// todos os campos mapeados (422 UNMAPPED_FIELDS). Só 1 ativo por vez. DASHBOARD_API §7.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, ne } from 'drizzle-orm';
import { db } from '../../../server/db/client';
import { contractTemplates, activityLog } from '../../../server/db/schema';
import { ok, fail, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { templateDTO } from '../../../server/lib/serializers';
import { unmappedCount } from '../../../server/lib/templates';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Modelos são só do Diretor.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const found = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Modelo não encontrado.');
  if (found[0].archivedAt) return fail(res, 422, 'ARCHIVED', 'Modelo arquivado não pode ser ativado.');

  const pending = unmappedCount(found[0].fieldMap);
  if (pending !== 0) {
    return fail(res, 422, 'UNMAPPED_FIELDS', `Posicione os ${pending < 0 ? '' : pending} campos pendentes antes de usar.`.replace('  ', ' '));
  }

  // só 1 ativo: desativa os outros, ativa este.
  await db.update(contractTemplates).set({ isActive: false, updatedAt: new Date() }).where(ne(contractTemplates.id, id));
  const updated = await db.update(contractTemplates).set({ isActive: true, updatedAt: new Date() }).where(eq(contractTemplates.id, id)).returning();

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'template_activated',
    targetType: 'template', targetId: id, ip: clientIp(req),
  });

  return ok(res, templateDTO(updated[0]));
}
