// GET  /api/announcement-templates — lista os modelos de comunicado (Diretor).
// POST /api/announcement-templates — cria um modelo (Diretor; CSRF).
// Modelos = texto pronto que a Diretora reusa nos comunicados. DASHBOARD_API.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { announcementTemplates } from '../../server/db/schema';
import { ok, fail, zodFields } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';

const CreateBody = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao modelo.'),
  subject: z.string().trim().min(1, 'Preencha o assunto.'),
  body: z.string().trim().min(1, 'Preencha o texto.'),
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

  if (req.method === 'GET') {
    const all = await db.select().from(announcementTemplates).orderBy(asc(announcementTemplates.id));
    return ok(res, all.map(dto));
  }

  if (req.method === 'POST') {
    if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

    const parsed = CreateBody.safeParse(req.body ?? {});
    if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
    const { name, subject, body, icon, color } = parsed.data;

    const dupe = await db
      .select({ id: announcementTemplates.id })
      .from(announcementTemplates)
      .where(sql`lower(${announcementTemplates.name}) = ${name.toLowerCase()}`)
      .limit(1);
    if (dupe.length) {
      return fail(res, 409, 'NAME_TAKEN', 'Já existe um modelo com esse nome.', { name: 'Já existe um modelo com esse nome.' });
    }

    const rows = await db
      .insert(announcementTemplates)
      .values({ name, subject, body, icon: icon || undefined, color: color || undefined })
      .returning();
    return ok(res, dto(rows[0]), 201);
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
}
