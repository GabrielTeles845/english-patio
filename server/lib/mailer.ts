// Envio de e-mail transacional (Resend via fetch — sem SDK). DASHBOARD_PLAN §services.
// Sem RESEND_API_KEY: vira stub (loga e não envia), pra rodar em dev/teste sem
// dependência externa. As rotas tratam o envio como best-effort.
import { randomUUID } from 'node:crypto';

export interface MailResult {
  id: string;
  delivered: boolean;
  stub: boolean;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? 'English Patio <no-reply@englishpatio.com.br>';
  if (!key) {
    console.log('[mailer:stub] e-mail não enviado (RESEND_API_KEY ausente):', opts.subject, '→', opts.to);
    return { id: 'stub', delivered: false, stub: true };
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
    });
    const data = (await r.json().catch(() => ({}))) as { id?: string };
    return { id: data?.id ?? randomUUID(), delivered: r.ok, stub: false };
  } catch (err) {
    console.error('[mailer] falha ao enviar', err);
    return { id: 'error', delivered: false, stub: false };
  }
}
