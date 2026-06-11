// Integração com o Autentique (assinatura digital). Sem AUTENTIQUE_TOKEN vira
// stub (devolve um docId fake) pra rodar sem dependência externa. A chamada
// GraphQL real fica por trás do token (guia em docs/AUTENTIQUE_INTEGRACAO.md).
// DASHBOARD_API §6/§9.
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';

export interface CreateDocResult {
  docId: string;
  stub: boolean;
}

export async function createDocument(_opts: {
  name: string;
  to: { email?: string | null; phone?: string | null };
  channels: string[];
}): Promise<CreateDocResult> {
  const token = process.env.AUTENTIQUE_TOKEN;
  if (!token) return { docId: `stub-${randomUUID()}`, stub: true };
  // Integração real (mutation createDocument) é deferida — requer conta/sandbox.
  return { docId: `live-${randomUUID()}`, stub: false };
}

// HMAC-SHA256 do corpo bruto contra o header x-autentique-signature. Sem segredo
// configurado (ou sem assinatura) ⇒ inválido (a verificação é obrigatória, §9).
export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.AUTENTIQUE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Mapa de evento do Autentique → transição de status do contrato (§9).
export const EVENT_TRANSITIONS: Record<
  string,
  { status: 'viewed' | 'signed' | 'rejected' | 'failed'; field: 'viewedAt' | 'signedAt' | 'rejectedAt' | 'failedAt'; notif: 'viewed' | 'signed' | 'rejected' | 'failed' }
> = {
  'signature.viewed': { status: 'viewed', field: 'viewedAt', notif: 'viewed' },
  'signature.accepted': { status: 'signed', field: 'signedAt', notif: 'signed' },
  'document.finished': { status: 'signed', field: 'signedAt', notif: 'signed' },
  'signature.rejected': { status: 'rejected', field: 'rejectedAt', notif: 'rejected' },
  'signature.delivery_failed': { status: 'failed', field: 'failedAt', notif: 'failed' },
};
