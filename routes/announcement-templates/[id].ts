// PATCH  /api/announcement-templates/:id — edita um modelo (Diretor; CSRF).
// DELETE /api/announcement-templates/:id — exclui um modelo (Diretor; CSRF).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { announcementTemplates } from '../../server/db/schema';
import { ok, fail, zodFields } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';

const PatchBody = z.object({
  name: z.string().trim().min(1).optional(),
  subject: z.string().trim().min(1).optional(),
  body: z.string().trim().min(1).optional(),
  icon: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
});

function dto(t: typeof announcementTemplates.$inferSelect) {
  return { id: t.id, name: t.name, subject: t.subject, body: t.body, icon: t.icon, color: t.color };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Comunicados são só do Diretor.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  if (req.method === 'PATCH') {
    const parsed = PatchBody.safeParse(req.body ?? {});
    if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
    const data = parsed.data;
    if (Object.keys(data).length === 0) return fail(res, 400, 'VALIDATION', 'Nada para atualizar.');

    if (data.name) {
      const dupe = await db
        .select({ id: announcementTemplates.id })
        .from(announcementTemplates)
        .where(and(sql`lower(${announcementTemplates.name}) = ${data.name.toLowerCase()}`, ne(announcementTemplates.id, id)))
        .limit(1);
      if (dupe.length) {
        return fail(res, 409, 'NAME_TAKEN', 'Já existe um modelo com esse nome.', { name: 'Já existe um modelo com esse nome.' });
      }
    }

    const rows = await db.update(announcementTemplates).set(data).where(eq(announcementTemplates.id, id)).returning();
    if (!rows.length) return fail(res, 404, 'NOT_FOUND', 'Modelo não encontrado.');
    return ok(res, dto(rows[0]));
  }

  if (req.method === 'DELETE') {
    const rows = await db.delete(announcementTemplates).where(eq(announcementTemplates.id, id)).returning({ id: announcementTemplates.id });
    if (!rows.length) return fail(res, 404, 'NOT_FOUND', 'Modelo não encontrado.');
    return ok(res, { deleted: true });
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
}
