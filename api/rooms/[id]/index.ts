// PATCH /api/rooms/:id — renomeia / cor / professor (os 3 papéis).
// Nome único case-insensitive (409 ROOM_NAME_TAKEN). DASHBOARD_API §5, VALIDACOES §11.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { rooms, activityLog } from '../../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../../server/lib/rbac';
import { roomDTO } from '../../../server/lib/serializers';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const PatchBody = z
  .object({
    name: z.string().trim().min(1, 'Campo obrigatório').max(40, 'Máximo de 40 caracteres').optional(),
    color: z.string().regex(HEX_COLOR, 'Cor inválida').optional(),
    teacherName: z.string().trim().max(80).nullish(),
  })
  .refine((d) => d.name !== undefined || d.color !== undefined || d.teacherName !== undefined, {
    message: 'Nada para atualizar.',
  });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 404, 'ROOM_NOT_FOUND', 'Sala não encontrada.');

  const parsed = PatchBody.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));

  const current = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  if (!current.length) return fail(res, 404, 'ROOM_NOT_FOUND', 'Sala não encontrada.');

  const updates: Partial<typeof rooms.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) {
    const dupe = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(sql`lower(${rooms.name}) = lower(${parsed.data.name})`, ne(rooms.id, id)))
      .limit(1);
    if (dupe.length) {
      return fail(res, 409, 'ROOM_NAME_TAKEN', 'Já existe uma sala com esse nome.', {
        name: 'Já existe uma sala com esse nome.',
      });
    }
    updates.name = parsed.data.name;
  }
  if (parsed.data.color !== undefined) updates.color = parsed.data.color;
  if (parsed.data.teacherName !== undefined) {
    updates.teacherName = parsed.data.teacherName ? parsed.data.teacherName : null;
  }

  const updated = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'room_updated',
    targetType: 'room',
    targetId: id,
    ip: clientIp(req),
  });

  return ok(res, roomDTO(updated[0]));
}
