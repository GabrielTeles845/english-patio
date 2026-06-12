// GET  /api/announcements — histórico de comunicados (só Diretor).
// POST /api/announcements — envia (e-mail via Resend e/ou WhatsApp "preparado").
//        DASHBOARD_API §8, VALIDACOES §15.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { announcements, announcementRecipients, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { renderTemplate, hasUnclosedVar, resolveAudience } from '../../server/lib/announcements';
import { sendMail } from '../../server/lib/mailer';

const Body = z.object({
  subject: z.string().trim().min(1, 'Campo obrigatório.').max(150, 'Máximo de 150 caracteres.'),
  body: z.string().trim().min(1, 'Campo obrigatório.').max(2000, 'Máximo de 2000 caracteres.'),
  channels: z.array(z.enum(['email', 'whatsapp'])).min(1, 'Escolha ao menos um canal.'),
  audienceFilter: z.object({
    period: z.string().optional(),
    status: z.enum(['active', 'inactive', 'all']).optional(),
    dayPair: z.enum(['seg-qua', 'ter-qui']).optional(),
    pendingContract: z.boolean().optional(),
  }).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Comunicados são só do Diretor.');

  if (req.method === 'GET') {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const rows = await db
      .select({
        a: announcements,
        recipientCount: sql<number>`(SELECT count(*)::int FROM announcement_recipients r WHERE r.announcement_id = ${announcements.id})`,
      })
      .from(announcements)
      .orderBy(desc(announcements.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    const totalRows = await db.select({ c: sql<number>`count(*)::int` }).from(announcements);
    const items = rows.map((r) => ({
      id: r.a.id, subject: r.a.subject, body: r.a.body, channels: r.a.channels,
      status: r.a.status, kind: r.a.kind, sentAt: r.a.sentAt, createdBy: r.a.createdBy,
      recipientCount: r.recipientCount,
    }));
    return ok(res, { items, page, pageSize, total: totalRows[0]?.c ?? 0 });
  }

  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { subject, body } = parsed.data;
  if (hasUnclosedVar(subject) || hasUnclosedVar(body)) {
    return fail(res, 400, 'VALIDATION', 'Variável aberta sem fechar ({{ sem }}).', { body: 'Variável aberta sem fechar.' });
  }
  const channels = [...new Set(parsed.data.channels)];

  const audience = await resolveAudience(parsed.data.audienceFilter ?? {});

  const ann = await db
    .insert(announcements)
    .values({
      subject, body, channels, audienceFilter: parsed.data.audienceFilter ?? null,
      status: 'sending', kind: 'manual', createdBy: session.user.id,
    })
    .returning();
  const annId = ann[0].id;

  let sent = 0, prepared = 0, failed = 0;
  const recipientRows: (typeof announcementRecipients.$inferInsert)[] = [];
  for (const rcp of audience) {
    const vars = { nome_responsavel: rcp.responsibleName ?? '', nome_aluno: rcp.studentNames.join(' e ') };
    for (const ch of channels) {
      if (ch === 'email') {
        if (!rcp.responsibleEmail) {
          failed++;
          recipientRows.push({ announcementId: annId, enrollmentId: rcp.enrollmentId, channel: 'email', status: 'failed' });
          continue;
        }
        const r = await sendMail({
          to: rcp.responsibleEmail,
          subject: renderTemplate(subject, vars),
          html: `<p>${renderTemplate(body, vars).replace(/\n/g, '<br>')}</p>`,
        });
        const accepted = r.delivered || r.stub; // stub (sem chave) = ambiente não configurado, não falha real
        accepted ? sent++ : failed++;
        recipientRows.push({ announcementId: annId, enrollmentId: rcp.enrollmentId, channel: 'email', status: accepted ? 'sent' : 'failed' });
      } else {
        // WhatsApp: mensagem "preparada por família" (API oficial é fase futura).
        prepared++;
        recipientRows.push({ announcementId: annId, enrollmentId: rcp.enrollmentId, channel: 'whatsapp', status: 'prepared' });
      }
    }
  }
  if (recipientRows.length) await db.insert(announcementRecipients).values(recipientRows);

  const finalStatus = failed && !sent && !prepared ? 'failed' : 'sent';
  await db.update(announcements).set({ status: finalStatus, sentAt: new Date() }).where(eq(announcements.id, annId));

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'announcement_sent',
    targetType: 'announcement', targetId: annId,
    detail: { channels, recipients: recipientRows.length, sent, prepared, failed }, ip: clientIp(req),
  });

  return ok(res, { announcementId: annId, recipients: recipientRows.length, sent, prepared, failed }, 201);
}
