// POST /api/webhooks/autentique — entrada de eventos do Autentique (sem sessão;
// autenticação por HMAC). Dedup por event_id, idempotente, responde rápido.
// DASHBOARD_API §9, docs/AUTENTIQUE_INTEGRACAO.md §3.
//
// Obs.: o HMAC é verificado sobre o corpo. Em produção é preciso garantir o RAW
// body (config da função na Vercel); aqui usamos JSON.stringify(req.body) como
// representação canônica (consistente entre emissor e verificador nos testes).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { contracts, contractEvents, activityLog } from '../../server/db/schema';
import { ok, fail } from '../../server/lib/http';
import { verifyWebhookSignature, EVENT_TRANSITIONS } from '../../server/lib/autentique';

const STATUS_LABEL: Record<string, string> = {
  viewed: 'Contrato visualizado', signed: 'Contrato assinado',
  rejected: 'Contrato recusado', failed: 'Falha na entrega do contrato',
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const raw = JSON.stringify(req.body ?? {});
  const sigRaw = req.headers['x-autentique-signature'];
  const signature = Array.isArray(sigRaw) ? sigRaw[0] : sigRaw;
  if (!verifyWebhookSignature(raw, signature)) return fail(res, 401, 'BAD_SIGNATURE', 'Assinatura inválida.');

  const payload = (req.body ?? {}) as { eventId?: string; type?: string; documentId?: string };
  const { eventId, type, documentId } = payload;
  if (!eventId || !type || !documentId) return fail(res, 400, 'VALIDATION', 'Payload incompleto.');

  const tr = EVENT_TRANSITIONS[type];
  if (!tr) return ok(res, { ignored: true, reason: 'tipo de evento não tratado' }); // ack

  const c = await db.select().from(contracts).where(eq(contracts.autentiqueDocId, documentId)).limit(1);
  if (!c.length) return ok(res, { ignored: true, reason: 'contrato não encontrado' }); // ack
  const contract = c[0];

  // dedup por event_id (unique). Já processado ⇒ 200 idempotente.
  const inserted = await db
    .insert(contractEvents)
    .values({ contractId: contract.id, eventId, type: type as (typeof contractEvents.$inferInsert)['type'], payload })
    .onConflictDoNothing({ target: contractEvents.eventId })
    .returning({ id: contractEvents.id });
  if (!inserted.length) return ok(res, { duplicate: true });

  await db.update(contracts).set({ status: tr.status, [tr.field]: new Date() }).where(eq(contracts.id, contract.id));

  await db.insert(activityLog).values({
    actorType: 'autentique', action: `contract_${tr.status}`,
    targetType: 'contract', targetId: contract.id, detail: { eventId, type },
  });

  // notifica diretores+secretaria (viewed/signed/rejected/failed). Best-effort.
  try {
    await db.execute(sql`
      INSERT INTO notifications (user_id, type, title)
      SELECT u.id, ${tr.notif}, ${STATUS_LABEL[tr.status]}
      FROM users u WHERE u.is_active = true AND u.role IN ('director', 'secretary')
    `);
  } catch (err) {
    console.error('webhook autentique: falha ao notificar', err);
  }

  return ok(res, { processed: true, status: tr.status });
}
