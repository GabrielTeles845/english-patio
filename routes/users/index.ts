// GET  /api/users — lista de usuários (RBAC: director). DASHBOARD_API §10.
// POST /api/users — cadastra pessoa + senha temporária (RBAC: director).
// Nunca devolve password_hash (ver userDTO).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { users, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { userDTO } from '../../server/lib/serializers';
import { hashPassword, validatePasswordPolicy } from '../../server/lib/password';
import { isFullName } from '../../server/lib/validators';

const CreateBody = z.object({
  name: z.string().trim().min(1, 'Campo obrigatório'),
  email: z.email(),
  role: z.enum(['director', 'supervisor', 'secretary']),
  tempPassword: z.string().min(1, 'Informe a senha temporária.'),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  if (req.method === 'GET') {
    const all = await db.select().from(users).orderBy(asc(users.id));
    return ok(res, all.map(userDTO));
  }

  if (req.method === 'POST') {
    if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

    const parsed = CreateBody.safeParse(req.body ?? {});
    if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
    const { name, role, tempPassword } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    if (!isFullName(name)) {
      return fail(res, 400, 'VALIDATION', 'Digite o nome completo.', { name: 'Digite o nome completo.' });
    }
    const policyError = validatePasswordPolicy(tempPassword);
    if (policyError) return fail(res, 400, 'WEAK_PASSWORD', policyError, { tempPassword: policyError });

    const dupe = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
    if (dupe.length) {
      return fail(res, 409, 'EMAIL_TAKEN', 'Já existe um usuário com esse e-mail.', {
        email: 'Já existe um usuário com esse e-mail.',
      });
    }

    // must_change_password=true (default): troca obrigatória no 1º login.
    // TODO: e-mail de boas-vindas via Resend quando a integração entrar.
    const inserted = await db
      .insert(users)
      .values({ name, email, passwordHash: await hashPassword(tempPassword), role })
      .returning();
    const user = inserted[0];

    await db.insert(activityLog).values({
      actorType: 'user',
      actorId: session.user.id,
      action: 'user_created',
      targetType: 'user',
      targetId: user.id,
      ip: clientIp(req),
    });

    return ok(res, userDTO(user), 201);
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
}
