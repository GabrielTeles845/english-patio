// POST /api/account/password — DASHBOARD_API §1.
// Troca a própria senha. Confere a atual, exceto no 1º login (mustChangePassword),
// onde a atual é dispensada. Aplica a política de senha, limpa mustChangePassword
// e seta password_changed_at (o que derruba as outras sessões). → log.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { users, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../../server/lib/password';
import { getSession, csrfValid, sessionCookie } from '../../server/lib/auth';
import { createSessionClaims, signSession } from '../../server/lib/jwt';

const Body = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(1, 'Informe a nova senha.'),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { currentPassword, newPassword } = parsed.data;

  const rows = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const user = rows[0];
  if (!user) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');

  // Fora do 1º acesso, confere a senha atual.
  if (!user.mustChangePassword) {
    if (!currentPassword) {
      return fail(res, 400, 'VALIDATION', 'Informe a senha atual.', {
        currentPassword: 'Informe a senha atual.',
      });
    }
    const okCurrent = await verifyPassword(currentPassword, user.passwordHash);
    if (!okCurrent) {
      return fail(res, 400, 'WRONG_PASSWORD', 'Senha atual incorreta.', {
        currentPassword: 'Senha atual incorreta.',
      });
    }
  }

  const policyError = validatePasswordPolicy(newPassword);
  if (policyError) return fail(res, 400, 'WEAK_PASSWORD', policyError, { newPassword: policyError });

  if (await verifyPassword(newPassword, user.passwordHash)) {
    const msg = 'A nova senha deve ser diferente da atual.';
    return fail(res, 400, 'SAME_PASSWORD', msg, { newPassword: msg });
  }

  const now = new Date();
  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
      passwordChangedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: user.id,
    action: 'password_changed',
    ip: clientIp(req),
  });

  // A troca derruba sessões (password_changed_at > pwdAt do token). Re-emite um
  // token novo pra não deslogar quem acabou de trocar a própria senha.
  const token = await signSession(createSessionClaims({ ...user, passwordChangedAt: now }));
  res.setHeader('Set-Cookie', sessionCookie(token));

  return ok(res, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    mustChangePassword: false,
  });
}
