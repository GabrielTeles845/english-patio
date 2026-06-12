// PATCH  /api/templates/:id — renomear / remapear campos (só Diretor).
// DELETE /api/templates/:id — arquivar (soft: archived_at + isActive=false).
// DASHBOARD_API §7.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { contractTemplates, activityLog } from '../../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { templateDTO } from '../../../server/lib/serializers';
import { FieldMapSchema } from '../../../server/lib/templates';

const PatchBody = z.object({
  name: z.string().trim().min(1, 'Campo obrigatório.').max(120, 'Máximo de 120 caracteres.').optional(),
  fieldMap: FieldMapSchema.optional(),
}).refine((d) => d.name !== undefined || d.fieldMap !== undefined, { message: 'Nada para atualizar.' });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Modelos são só do Diretor.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const found = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Modelo não encontrado.');

  if (req.method === 'PATCH') {
    const parsed = PatchBody.safeParse(req.body ?? {});
    if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) set.name = parsed.data.name;
    if (parsed.data.fieldMap !== undefined) set.fieldMap = parsed.data.fieldMap;
    const updated = await db.update(contractTemplates).set(set).where(eq(contractTemplates.id, id)).returning();
    await db.insert(activityLog).values({
      actorType: 'user', actorId: session.user.id, action: 'template_updated',
      targetType: 'template', targetId: id, ip: clientIp(req),
    });
    return ok(res, templateDTO(updated[0]));
  }

  if (req.method === 'DELETE') {
    const updated = await db
      .update(contractTemplates)
      .set({ archivedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(contractTemplates.id, id))
      .returning();
    await db.insert(activityLog).values({
      actorType: 'user', actorId: session.user.id, action: 'template_archived',
      targetType: 'template', targetId: id, ip: clientIp(req),
    });
    return ok(res, templateDTO(updated[0]));
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
}
