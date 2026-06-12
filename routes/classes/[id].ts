// PATCH  /api/classes/:id — edita turma (slot/nível/capacidade). Slot único
//        (409 SLOT_TAKEN); capacidade nunca < ocupação (422 CAPACITY_BELOW_OCCUPANCY).
// DELETE /api/classes/:id — exclui só se vazia (422 CLASS_NOT_EMPTY).
// DASHBOARD_API §5, VALIDACOES §10.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { classes, rooms, levels, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../server/lib/rbac';
import { classDTO } from '../../server/lib/serializers';
import { START_TIMES, DAY_PAIRS, classOccupancy } from '../../server/lib/agenda';

const PatchBody = z
  .object({
    roomId: z.number().int().positive().optional(),
    dayPair: z.enum(DAY_PAIRS).optional(),
    startTime: z.enum(START_TIMES).optional(),
    levelId: z.number().int().positive().optional(),
    capacity: z.number().int().min(1, 'Mínimo de 1').max(7, 'Máximo de 7').optional(),
    period: z.string().regex(/^\d{4}\.[12]$/, 'Período inválido (ex.: 2026.2)').optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), { message: 'Nada para atualizar.' });

function parseId(req: VercelRequest): number | null {
  const id = Number(req.query.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  }

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = parseId(req);
  if (id === null) return fail(res, 404, 'CLASS_NOT_FOUND', 'Turma não encontrada.');

  const currentRows = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
  if (!currentRows.length) return fail(res, 404, 'CLASS_NOT_FOUND', 'Turma não encontrada.');
  const current = currentRows[0];

  if (req.method === 'DELETE') {
    if ((await classOccupancy(id)) > 0) {
      return fail(res, 422, 'CLASS_NOT_EMPTY', 'A turma tem alunos. Mova-os antes de excluir.');
    }
    await db.delete(classes).where(eq(classes.id, id));
    await db.insert(activityLog).values({
      actorType: 'user', actorId: session.user.id, action: 'class_deleted',
      targetType: 'class', targetId: id, ip: clientIp(req),
    });
    return ok(res, { id });
  }

  // PATCH
  const parsed = PatchBody.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { roomId, dayPair, startTime, levelId, capacity, period } = parsed.data;

  if (roomId !== undefined) {
    const room = await db.select({ isActive: rooms.isActive }).from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (!room.length || !room[0].isActive) {
      return fail(res, 400, 'VALIDATION', 'Sala inválida ou inativa.', { roomId: 'Sala inválida ou inativa.' });
    }
  }
  if (levelId !== undefined) {
    const level = await db.select({ id: levels.id }).from(levels).where(eq(levels.id, levelId)).limit(1);
    if (!level.length) return fail(res, 400, 'VALIDATION', 'Nível inválido.', { levelId: 'Nível inválido.' });
  }

  // Se algum campo do slot mudou, revalida unicidade do slot (excluindo a própria turma).
  if (roomId !== undefined || dayPair !== undefined || startTime !== undefined || period !== undefined) {
    const slot = {
      roomId: roomId ?? current.roomId,
      dayPair: dayPair ?? current.dayPair,
      startTime: startTime ?? current.startTime,
      period: period ?? current.period,
    };
    const clash = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(
        eq(classes.roomId, slot.roomId),
        eq(classes.dayPair, slot.dayPair),
        eq(classes.startTime, slot.startTime),
        eq(classes.period, slot.period),
        ne(classes.id, id),
      ))
      .limit(1);
    if (clash.length) return fail(res, 409, 'SLOT_TAKEN', 'Já existe turma nesse horário/sala.');
  }

  if (capacity !== undefined) {
    const occ = await classOccupancy(id);
    if (capacity < occ) {
      return fail(res, 422, 'CAPACITY_BELOW_OCCUPANCY', 'A capacidade não pode ser menor que os alunos já na turma.');
    }
  }

  const updates: Partial<typeof classes.$inferInsert> = { updatedAt: new Date() };
  if (roomId !== undefined) updates.roomId = roomId;
  if (dayPair !== undefined) updates.dayPair = dayPair;
  if (startTime !== undefined) updates.startTime = startTime;
  if (levelId !== undefined) updates.levelId = levelId;
  if (capacity !== undefined) updates.capacity = capacity;
  if (period !== undefined) updates.period = period;

  const updated = await db.update(classes).set(updates).where(eq(classes.id, id)).returning();

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'class_updated',
    targetType: 'class', targetId: id, ip: clientIp(req),
  });

  return ok(res, classDTO(updated[0], await classOccupancy(id)));
}
