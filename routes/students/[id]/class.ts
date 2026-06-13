// PATCH /api/students/:id/class — move/aloca um aluno numa turma (ou tira da turma
// com classId=null → fila "aguardando turma"). RBAC: os 3 papéis (Agenda é CRUD
// pros 3 — §4). Regras de vaga e mudança de nível: DASHBOARD_API §4.6, VALIDACOES §13.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { students, classes, activityLog } from '../../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../../server/lib/rbac';
import { studentDTO } from '../../../server/lib/serializers';
import { classOccupancy } from '../../../server/lib/agenda';
import { ROOM_MAX_SEATS } from '../../../server/lib/enrollment';

const Body = z.object({
  classId: z.number().int().positive().nullable(),
  allowLevelChange: z.boolean().optional(),
  extraSeat: z.boolean().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'PATCH') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { classId, allowLevelChange, extraSeat } = parsed.data;

  const found = await db.select().from(students).where(eq(students.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Aluno não encontrado.');
  const student = found[0];
  if (!student.isActive) return fail(res, 422, 'STUDENT_INACTIVE', 'Aluno desligado — reative antes de alocar.');

  const fromClassId = student.classId;

  // classId=null → tira da turma (vai pra fila). Sem checagens de vaga/nível.
  if (classId !== null) {
    const dest = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    if (!dest.length) return fail(res, 404, 'CLASS_NOT_FOUND', 'Turma de destino não encontrada.');
    if (!dest[0].isActive) return fail(res, 422, 'CLASS_INACTIVE', 'Turma de destino está inativa.');

    // mudança de nível exige confirmação (compara com a turma atual do aluno).
    if (fromClassId !== null && fromClassId !== classId) {
      const fromCls = await db
        .select({ levelId: classes.levelId })
        .from(classes)
        .where(eq(classes.id, fromClassId))
        .limit(1);
      if (fromCls.length && fromCls[0].levelId !== dest[0].levelId && !allowLevelChange) {
        return fail(res, 422, 'LEVEL_CHANGE_REQUIRES_CONFIRM', 'O destino muda o nível do aluno — confirme.');
      }
    }

    // vaga: ocupação ignora o próprio aluno (idempotência ao re-alocar na mesma turma).
    const occ = await classOccupancy(classId, id);
    if (occ >= dest[0].capacity) {
      if (!extraSeat) return fail(res, 422, 'CLASS_FULL', 'Turma cheia — abra uma vaga extra para mover.');
      if (dest[0].capacity >= ROOM_MAX_SEATS) {
        return fail(res, 422, 'ROOM_OVERFLOW', 'A turma já está com 9 lugares — passaria do que cabe na sala.');
      }
      // "Abrir vaga extra": sobe o limite da turma em 1 (a UI promete que o
      // limite passa de N para N+1 e a turma deixa de aparecer como cheia).
      await db
        .update(classes)
        .set({ capacity: dest[0].capacity + 1 })
        .where(eq(classes.id, classId));
    }
  }

  const updated = await db
    .update(students)
    .set({ classId, updatedAt: new Date() })
    .where(eq(students.id, id))
    .returning();

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'student_moved',
    targetType: 'student',
    targetId: id,
    detail: { from: fromClassId, to: classId, name: student.name, extraSeat: extraSeat ?? false },
    ip: clientIp(req),
  });

  return ok(res, studentDTO(updated[0]));
}
