// POST /api/students/:id/reactivate — religa um aluno desligado. Limpa exit_*.
// Vaga NÃO fica reservada: se a turma do aluno lotou (ou sumiu/desativou) no
// meantime, ele volta com class_id=null (fila "aguardando turma") — nunca estoura
// a capacidade. DASHBOARD_API §4.5.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../../../server/db/client';
import { students, classes, activityLog } from '../../../server/db/schema';
import { ok, fail, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { studentDTO } from '../../../server/lib/serializers';
import { classOccupancy } from '../../../server/lib/agenda';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const found = await db.select().from(students).where(eq(students.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Aluno não encontrado.');
  if (found[0].isActive) return fail(res, 422, 'ALREADY_ACTIVE', 'Aluno já está ativo.');

  // a turma anterior ainda cabe? (existe, ativa, e com vaga). Senão, fila.
  let keepClassId = found[0].classId;
  let droppedToQueue = false;
  if (keepClassId !== null) {
    const cls = await db.select().from(classes).where(eq(classes.id, keepClassId)).limit(1);
    if (!cls.length || !cls[0].isActive) {
      droppedToQueue = true;
    } else {
      const occ = await classOccupancy(keepClassId);
      if (occ >= cls[0].capacity) droppedToQueue = true;
    }
    if (droppedToQueue) keepClassId = null;
  }

  const updated = await db
    .update(students)
    .set({
      isActive: true,
      exitReason: null,
      exitNote: null,
      exitDate: null,
      classId: keepClassId,
      updatedAt: new Date(),
    })
    .where(eq(students.id, id))
    .returning();

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'student_reactivated',
    targetType: 'student',
    targetId: id,
    detail: { droppedToQueue, name: found[0].name },
    ip: clientIp(req),
  });

  return ok(res, { ...studentDTO(updated[0]), droppedToQueue });
}
