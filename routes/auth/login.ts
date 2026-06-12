// POST /api/auth/login — DASHBOARD_API §1.
// Body { email, password }. Rate-limit por IP e e-mail; mensagem genérica em
// falha (não revela se o e-mail existe). Sucesso: set-cookie (JWT) + dados.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { users, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { verifyPassword } from '../../server/lib/password';
import { createSessionClaims, signSession } from '../../server/lib/jwt';
import { sessionCookie, csrfCookie } from '../../server/lib/auth';
import { isRateLimited, recordAttempt } from '../../server/lib/rateLimit';

// Hash válido descartável: mantém o custo do bcrypt mesmo quando o e-mail não
// existe, pra não vazar a existência da conta pelo tempo de resposta.
const DUMMY_HASH = '$2b$12$JUm5Frn5.fp9wDeuldOGu.gF/qbeUbedB5PiYrEex9.n1cEh5mzkG';

const Body = z.object({
  email: z.email(),
  password: z.string().min(1, 'Informe a senha.'),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;
  const ip = clientIp(req);

  if (await isRateLimited(email, ip)) {
    return fail(res, 429, 'RATE_LIMITED', 'Muitas tentativas. Tente novamente em alguns minutos.');
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid || !user.isActive) {
    await recordAttempt(email, ip, false);
    return fail(res, 401, 'BAD_CREDENTIALS', 'E-mail ou senha incorretos.');
  }

  await recordAttempt(email, ip, true);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const token = await signSession(createSessionClaims(user));
  const csrf = randomBytes(24).toString('hex');
  res.setHeader('Set-Cookie', [sessionCookie(token), csrfCookie(csrf)]);

  await db.insert(activityLog).values({ actorType: 'user', actorId: user.id, action: 'login', ip });

  return ok(res, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    mustChangePassword: user.mustChangePassword,
  });
}
