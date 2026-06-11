// POST /api/auth/forgot — inicia a redefinição de senha. Resposta SEMPRE 200
// (não revela se o e-mail existe). Se houver usuário ativo, cria um token e envia
// o link por e-mail (best-effort). DASHBOARD_API §1.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { users, passwordResetTokens, activityLog } from '../../server/db/schema';
import { ok, fail, clientIp } from '../../server/lib/http';
import { generateResetToken, RESET_TTL_MS } from '../../server/lib/resetToken';
import { sendMail } from '../../server/lib/mailer';

const Body = z.object({ email: z.string().email('E-mail inválido.') });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'E-mail inválido.', { email: 'E-mail inválido.' });
  const email = parsed.data.email.trim();

  const rows = await db.select().from(users).where(and(eq(users.email, email), eq(users.isActive, true))).limit(1);
  if (rows.length) {
    const user = rows[0];
    const { token, hash } = generateResetToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    });
    const base = process.env.APP_URL ?? 'https://english-patio.vercel.app';
    const link = `${base}/dashboard/redefinir?token=${token}`;
    await sendMail({
      to: email,
      subject: 'Redefinição de senha — English Patio',
      html: `<p>Olá, ${user.name}.</p><p>Para redefinir sua senha, acesse o link abaixo (válido por 1 hora):</p><p><a href="${link}">${link}</a></p><p>Se não foi você, ignore este e-mail.</p>`,
    });
    await db.insert(activityLog).values({
      actorType: 'user', actorId: user.id, action: 'password_reset_requested',
      targetType: 'user', targetId: user.id, ip: clientIp(req),
    });
  }

  // resposta idêntica exista ou não o e-mail (anti-enumeração).
  return ok(res, { ok: true });
}
