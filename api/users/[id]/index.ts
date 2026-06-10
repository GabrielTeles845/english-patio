// PATCH /api/users/:id — edita nome/e-mail/papel (RBAC: director). DASHBOARD_API §10.
// E-mail único (409 EMAIL_TAKEN); não rebaixa o último Diretor ativo (422 LAST_DIRECTOR).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, ne, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { users, activityLog } from '../../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { userDTO } from '../../../server/lib/serializers';
import { isFullName } from '../../../server/lib/validators';
import { activeDirectorCount, blocksLastDirector } from '../../../server/lib/users';

const PatchBody = z
  .object({
    name: z.string().trim().min(1, 'Campo obrigatório').optional(),
    email: z.email().optional(),
    role: z.enum(['director', 'supervisor', 'secretary']).optional(),
  })
  .refine((d) => d.name !== undefined || d.email !== undefined || d.role !== undefined, {
    message: 'Nada para atualizar.',
  });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 404, 'USER_NOT_FOUND', 'Usuário não encontrado.');

  const parsed = PatchBody.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { name, role } = parsed.data;

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!rows.length) return fail(res, 404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
  const target = rows[0];

  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (name !== undefined) {
    if (!isFullName(name)) {
      return fail(res, 400, 'VALIDATION', 'Digite o nome completo.', { name: 'Digite o nome completo.' });
    }
    updates.name = name;
  }

  if (parsed.data.email !== undefined) {
    const email = parsed.data.email.trim().toLowerCase();
    const dupe = await db
      .select({ id: users.id })
      .from(users)
      .where(and(sql`lower(${users.email}) = ${email}`, ne(users.id, id)))
      .limit(1);
    if (dupe.length) {
      return fail(res, 409, 'EMAIL_TAKEN', 'Já existe um usuário com esse e-mail.', {
        email: 'Já existe um usuário com esse e-mail.',
      });
    }
    updates.email = email;
  }

  if (role !== undefined && role !== target.role) {
    if (blocksLastDirector(target, await activeDirectorCount(), role)) {
      return fail(res, 422, 'LAST_DIRECTOR', 'Não é possível rebaixar o último Diretor ativo.');
    }
    updates.role = role;
  }

  const updated = await db.update(users).set(updates).where(eq(users.id, id)).returning();

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'user_updated',
    targetType: 'user',
    targetId: id,
    ip: clientIp(req),
  });

  return ok(res, userDTO(updated[0]));
}
