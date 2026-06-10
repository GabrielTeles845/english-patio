// PATCH /api/account — DASHBOARD_API §1.
// Edita nome e/ou e-mail próprios. E-mail é único entre usuários (409 EMAIL_TAKEN). → log.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { users, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';

const Body = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome.').optional(),
    email: z.email().optional(),
  })
  .refine((d) => d.name !== undefined || d.email !== undefined, {
    message: 'Nada para atualizar.',
  });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { name, email } = parsed.data;

  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (email !== undefined) {
    const normalized = email.trim().toLowerCase();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);
    if (existing[0] && existing[0].id !== session.user.id) {
      return fail(res, 409, 'EMAIL_TAKEN', 'Já existe um usuário com este e-mail.', {
        email: 'Já existe um usuário com este e-mail.',
      });
    }
    updates.email = normalized;
  }

  await db.update(users).set(updates).where(eq(users.id, session.user.id));

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'account_updated',
    ip: clientIp(req),
  });

  const rows = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const u = rows[0];
  return ok(res, { user: { id: u.id, name: u.name, email: u.email, role: u.role } });
}
