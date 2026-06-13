// POST /api/contracts/:id/remind — prepara a cobrança do contrato por WhatsApp
// (director, secretary). Não envia (API oficial é fase futura): devolve a
// mensagem pronta + link wa.me pro responsável. Grava log. DASHBOARD_API §6.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../../../server/db/client';
import { contracts, responsibles, students, activityLog } from '../../../server/db/schema';
import { ok, fail, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { onlyDigits } from '../../../server/lib/validators';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const found = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Contrato não encontrado.');
  const contract = found[0];
  if (contract.status === 'signed') return fail(res, 422, 'ALREADY_SIGNED', 'Contrato já assinado.');

  const legal = await db.select().from(responsibles).where(eq(responsibles.enrollmentId, contract.enrollmentId));
  const resp = legal.find((r) => r.type === 'legal') ?? legal[0] ?? null;
  if (!resp?.phone) return fail(res, 422, 'NO_PHONE', 'Responsável sem telefone para a cobrança.');

  const kid = await db.select({ name: students.name }).from(students).where(eq(students.enrollmentId, contract.enrollmentId)).limit(1);
  const aluno = kid.length ? kid[0].name : 'seu filho(a)';
  // A mensagem muda conforme o status: cobrar assinatura de quem RECUSOU (ou de
  // quem nem recebeu, por falha de entrega) seria errado e constrangedor.
  const message =
    contract.status === 'rejected'
      ? `Olá, ${resp.name}! Tudo bem? Vimos que houve um problema com o contrato de matrícula de ${aluno}. Podemos conversar para entender e ajustar o que for preciso? Estamos à disposição. — English Patio`
      : contract.status === 'failed'
        ? `Olá, ${resp.name}! Tudo bem? Tivemos uma falha no envio do contrato de matrícula de ${aluno} e vamos reenviar o link de assinatura. Qualquer dúvida, estamos à disposição. — English Patio`
        : `Olá, ${resp.name}! Tudo bem? Notamos que o contrato de matrícula de ${aluno} ainda está pendente de assinatura. Você pode finalizar pelo link que enviamos. Qualquer dúvida, estamos à disposição. — English Patio`;
  const phone = onlyDigits(resp.phone);
  const waLink = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'contract_reminder_prepared',
    targetType: 'contract', targetId: id, ip: clientIp(req),
  });

  return ok(res, { phone, message, waLink });
}
