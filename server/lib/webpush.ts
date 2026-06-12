// Disparo de Web Push (notificações do navegador/SO). Roda junto com a criação
// das notificações in-app, no mesmo fan-out por papel. No-op silencioso quando
// as chaves VAPID não estão no ambiente — nunca quebra o request que o chamou
// (best-effort, igual ao INSERT das notificações in-app).
import webpush from 'web-push';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { pushSubscriptions, users } from '../db/schema';

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;   // para onde o clique leva (ex.: '/dashboard/alunos')
  tag?: string;   // agrupa avisos do mesmo tipo
  icon?: string;
}

type Role = 'director' | 'supervisor' | 'secretary';

// Lê as chaves uma vez. null = push desligado (sem VAPID configurado).
let configured: boolean | null = null;
function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contato@englishpatio.com.br';
  if (pub && priv) {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
  } else {
    configured = false;
  }
  return configured;
}

// Envia o push para todos os navegadores inscritos de usuários ATIVOS com os
// papéis dados. Limpa inscrições mortas (404/410 = expiraram). Nunca lança.
export async function sendPushToRoles(roles: Role[], payload: PushPayload): Promise<void> {
  try {
    if (!ensureConfigured()) return;

    const subs = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .innerJoin(users, eq(users.id, pushSubscriptions.userId))
      .where(and(inArray(users.role, roles), eq(users.isActive, true)));

    if (!subs.length) return;

    const body = JSON.stringify(payload);
    const dead: number[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) dead.push(s.id); // inscrição expirou
        }
      }),
    );

    if (dead.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, dead));
  } catch {
    // best-effort: nunca derruba o fluxo que criou a notificação in-app.
  }
}
