// GET  /api/templates — lista de modelos de contrato (só Diretor).
// POST /api/templates — importar PDF + mapear campos (metadados; o binário do PDF
//        vai pra storage externa, deferida — aqui guardamos pdfUrl). DASHBOARD_API §7.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { contractTemplates, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { templateDTO } from '../../server/lib/serializers';
import { FieldMapSchema } from '../../server/lib/templates';

const CreateBody = z.object({
  name: z.string().trim().min(1, 'Campo obrigatório.').max(120, 'Máximo de 120 caracteres.'),
  pdfUrl: z.string().trim().min(1, 'Envie um PDF.'),
  fieldMap: FieldMapSchema.default([]),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Modelos são só do Diretor.');

  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(contractTemplates)
      .orderBy(desc(contractTemplates.isActive), asc(contractTemplates.name));
    return ok(res, rows.map(templateDTO));
  }

  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = CreateBody.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { name, pdfUrl, fieldMap } = parsed.data;

  const inserted = await db
    .insert(contractTemplates)
    .values({ name, pdfUrl, fieldMap })
    .returning();

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'template_created',
    targetType: 'template', targetId: inserted[0].id, detail: { name }, ip: clientIp(req),
  });

  return ok(res, templateDTO(inserted[0]), 201);
}
