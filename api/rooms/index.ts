// GET /api/rooms — lista as salas (os 3 papéis).
// POST /api/rooms — cria sala (os 3 papéis). Nome único case-insensitive, máx 40.
// DASHBOARD_API §5, VALIDACOES §11.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { rooms, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../server/lib/rbac';
import { roomDTO } from '../../server/lib/serializers';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const CreateBody = z.object({
  name: z.string().trim().min(1, 'Campo obrigatório').max(40, 'Máximo de 40 caracteres'),
  color: z.string().regex(HEX_COLOR, 'Cor inválida'),
  teacherName: z.string().trim().max(80).nullish(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  if (req.method === 'GET') {
    const all = await db.select().from(rooms).orderBy(asc(rooms.id));
    return ok(res, all.map(roomDTO));
  }

  if (req.method === 'POST') {
    if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

    const parsed = CreateBody.safeParse(req.body ?? {});
    if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
    const { name, color } = parsed.data;
    const teacherName = parsed.data.teacherName ? parsed.data.teacherName : null;

    const dupe = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(sql`lower(${rooms.name}) = lower(${name})`)
      .limit(1);
    if (dupe.length) {
      return fail(res, 409, 'ROOM_NAME_TAKEN', 'Já existe uma sala com esse nome.', {
        name: 'Já existe uma sala com esse nome.',
      });
    }

    const inserted = await db.insert(rooms).values({ name, color, teacherName }).returning();
    const room = inserted[0];

    await db.insert(activityLog).values({
      actorType: 'user',
      actorId: session.user.id,
      action: 'room_created',
      targetType: 'room',
      targetId: room.id,
      ip: clientIp(req),
    });

    return ok(res, roomDTO(room), 201);
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
}
