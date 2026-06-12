// GET /api/classes — lista turmas (os 3 papéis). Filtros opcionais ?period e ?dayPair.
// POST /api/classes — cria turma (os 3 papéis). Slot único (409 SLOT_TAKEN),
// sem professor (vem da sala). DASHBOARD_API §5, VALIDACOES §10.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import { classes, rooms, levels, activityLog } from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../server/lib/rbac';
import { classDTO } from '../../server/lib/serializers';
import { START_TIMES, DAY_PAIRS } from '../../server/lib/agenda';

const CreateBody = z.object({
  roomId: z.number().int().positive(),
  dayPair: z.enum(DAY_PAIRS),
  startTime: z.enum(START_TIMES),
  levelId: z.number().int().positive(),
  capacity: z.number().int().min(1, 'Mínimo de 1').max(7, 'Máximo de 7').optional(),
  period: z.string().regex(/^\d{4}\.[12]$/, 'Período inválido (ex.: 2026.2)'),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  if (req.method === 'GET') {
    const conds = [];
    const period = typeof req.query.period === 'string' ? req.query.period : undefined;
    const dayPair = typeof req.query.dayPair === 'string' ? req.query.dayPair : undefined;
    if (period) conds.push(eq(classes.period, period));
    if (dayPair === 'seg-qua' || dayPair === 'ter-qui') conds.push(eq(classes.dayPair, dayPair));

    const all = await db
      .select()
      .from(classes)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(asc(classes.id));
    // ocupação = 0 enquanto não há tabela `students` (ver server/lib/agenda.ts).
    return ok(res, all.map((c) => classDTO(c, 0)));
  }

  if (req.method === 'POST') {
    if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

    const parsed = CreateBody.safeParse(req.body ?? {});
    if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
    const { roomId, dayPair, startTime, levelId, period } = parsed.data;
    const capacity = parsed.data.capacity ?? 7;

    const room = await db.select({ id: rooms.id, isActive: rooms.isActive }).from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (!room.length || !room[0].isActive) {
      return fail(res, 400, 'VALIDATION', 'Sala inválida ou inativa.', { roomId: 'Sala inválida ou inativa.' });
    }
    const level = await db.select({ id: levels.id }).from(levels).where(eq(levels.id, levelId)).limit(1);
    if (!level.length) {
      return fail(res, 400, 'VALIDATION', 'Nível inválido.', { levelId: 'Nível inválido.' });
    }

    const slot = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(eq(classes.roomId, roomId), eq(classes.dayPair, dayPair), eq(classes.startTime, startTime), eq(classes.period, period)))
      .limit(1);
    if (slot.length) {
      return fail(res, 409, 'SLOT_TAKEN', 'Já existe turma nesse horário/sala.');
    }

    const inserted = await db
      .insert(classes)
      .values({ roomId, dayPair, startTime, levelId, capacity, period })
      .returning();

    await db.insert(activityLog).values({
      actorType: 'user',
      actorId: session.user.id,
      action: 'class_created',
      targetType: 'class',
      targetId: inserted[0].id,
      ip: clientIp(req),
    });

    return ok(res, classDTO(inserted[0], 0), 201);
  }

  return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
}
