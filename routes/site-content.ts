// GET   /api/site-content — todos os textos do site por página/campo (só Diretor).
// PATCH /api/site-content — salva rascunho (action=save) ou publica (action=publish).
//   Salvar grava em draft_value; publicar move draft_value→value, grava published_at
//   e limpa o rascunho. "Pendência" = draft_value não nulo. DASHBOARD_API §13.
// (Escape anti-XSS é na renderização do site, não no armazenamento.)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../server/db/client';
import { siteContent, activityLog } from '../server/db/schema';
import { ok, fail, clientIp } from '../server/lib/http';
import { getSession, csrfValid } from '../server/lib/auth';
import { hasRole } from '../server/lib/rbac';

// Tetos por tipo de campo (VALIDACOES §17), derivados do fieldKey.
function capFor(fieldKey: string): number {
  if (/sub(titulo|title)/i.test(fieldKey)) return 200;
  if (/(titulo|title)/i.test(fieldKey)) return 120;
  return 600;
}

function dto(r: typeof siteContent.$inferSelect) {
  return {
    pageKey: r.pageKey,
    fieldKey: r.fieldKey,
    value: r.value,
    draftValue: r.draftValue,
    pending: r.draftValue !== null,
    publishedAt: r.publishedAt,
    updatedAt: r.updatedAt,
  };
}

const Body = z.object({
  action: z.enum(['save', 'publish']),
  items: z.array(z.object({
    pageKey: z.string().min(1),
    fieldKey: z.string().min(1),
    value: z.string().optional(),
  })).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Editor de site é só do Diretor.');

  if (req.method === 'GET') {
    const rows = await db.select().from(siteContent).orderBy(asc(siteContent.pageKey), asc(siteContent.fieldKey));
    return ok(res, rows.map(dto));
  }

  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.');
  const { action, items } = parsed.data;
  const now = new Date();

  if (action === 'save') {
    if (!items || !items.length) return fail(res, 400, 'VALIDATION', 'Nada para salvar.');
    // valida tamanhos por campo
    const fields: Record<string, string> = {};
    items.forEach((it, i) => {
      if (it.value === undefined) fields[`items.${i}.value`] = 'Campo obrigatório.';
      else if (it.value.length > capFor(it.fieldKey)) fields[`items.${i}.value`] = `Máximo de ${capFor(it.fieldKey)} caracteres.`;
    });
    if (Object.keys(fields).length) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', fields);

    for (const it of items) {
      await db
        .insert(siteContent)
        .values({ pageKey: it.pageKey, fieldKey: it.fieldKey, value: '', draftValue: it.value!, updatedBy: session.user.id, updatedAt: now })
        .onConflictDoUpdate({
          target: [siteContent.pageKey, siteContent.fieldKey],
          set: { draftValue: it.value!, updatedBy: session.user.id, updatedAt: now },
        });
    }
    await db.insert(activityLog).values({
      actorType: 'user', actorId: session.user.id, action: 'site_content_saved',
      targetType: 'site_content', detail: { count: items.length }, ip: clientIp(req),
    });
    return ok(res, { saved: items.length });
  }

  // action === 'publish' — move draft_value→value (itens informados, ou todas as pendências)
  // value = draft_value (na própria linha) — move sem reler.
  const publishSet = { value: sql`${siteContent.draftValue}`, draftValue: null, publishedAt: now, updatedBy: session.user.id, updatedAt: now };
  let published = 0;
  if (items && items.length) {
    for (const it of items) {
      const r = await db
        .update(siteContent)
        .set(publishSet)
        .where(and(eq(siteContent.pageKey, it.pageKey), eq(siteContent.fieldKey, it.fieldKey), isNotNull(siteContent.draftValue)))
        .returning({ id: siteContent.id });
      published += r.length;
    }
  } else {
    const r = await db
      .update(siteContent)
      .set(publishSet)
      .where(isNotNull(siteContent.draftValue))
      .returning({ id: siteContent.id });
    published = r.length;
  }
  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'site_content_published',
    targetType: 'site_content', detail: { count: published }, ip: clientIp(req),
  });
  return ok(res, { published });
}
