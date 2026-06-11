// POST /api/auth/reset — completa a redefinição com o token. Valida token (hash,
// não usado, não expirado) + política de senha; troca a senha (derruba sessões
// via password_changed_at) e marca o token como usado. DASHBOARD_API §1.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { users, passwordResetTokens, activityLog } from '../../server/db/schema';
import { ok, fail, clientIp } from '../../server/lib/http';
import { hashPassword, validatePasswordPolicy } from '../../server/lib/password';
import { hashToken } from '../../server/lib/resetToken';

const Body = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.');
  const { token, password } = parsed.data;

  const policy = validatePasswordPolicy(password);
  if (policy) return fail(res, 400, 'WEAK_PASSWORD', policy, { password: policy });

  const now = new Date();
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.tokenHash, hashToken(token)),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, now),
    ))
    .limit(1);
  if (!rows.length) return fail(res, 400, 'INVALID_TOKEN', 'Link inválido ou expirado. Solicite um novo.');
  const reset = rows[0];

  await db.update(users).set({
    passwordHash: await hashPassword(password),
    passwordChangedAt: now, // invalida JWTs anteriores
    mustChangePassword: false,
    updatedAt: now,
  }).where(eq(users.id, reset.userId));

  await db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, reset.id));

  await db.insert(activityLog).values({
    actorType: 'user', actorId: reset.userId, action: 'password_reset_done',
    targetType: 'user', targetId: reset.userId, ip: clientIp(req),
  });

  return ok(res, { ok: true });
}
