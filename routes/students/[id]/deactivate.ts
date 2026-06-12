// POST /api/students/:id/deactivate — desliga um aluno (soft delete, reativável).
// RBAC: director, secretary. Body { reason, note? }; note obrigatória se
// reason="other" (máx 500). Não apaga — marca is_active=false + exit_*.
// DASHBOARD_API §4.4, VALIDACOES §14.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { students, activityLog } from '../../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { studentDTO } from '../../../server/lib/serializers';
import { EXIT_REASONS, todayISODate } from '../../../server/lib/enrollment';

const Body = z.object({
  reason: z.enum(EXIT_REASONS),
  note: z.string().trim().max(500, 'Máximo de 500 caracteres.').optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { reason } = parsed.data;
  const note = parsed.data.note ?? null;
  if (reason === 'other' && !note) {
    return fail(res, 400, 'VALIDATION', 'Descreva o motivo.', { note: 'Descreva o motivo.' });
  }

  const found = await db.select().from(students).where(eq(students.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Aluno não encontrado.');
  if (!found[0].isActive) return fail(res, 422, 'ALREADY_INACTIVE', 'Aluno já está desligado.');

  const updated = await db
    .update(students)
    .set({
      isActive: false,
      exitReason: reason,
      exitNote: note,
      exitDate: todayISODate(),
      updatedAt: new Date(),
    })
    .where(eq(students.id, id))
    .returning();

  await db.insert(activityLog).values({
    actorType: 'user',
    actorId: session.user.id,
    action: 'student_deactivated',
    targetType: 'student',
    targetId: id,
    detail: { reason, name: found[0].name },
    ip: clientIp(req),
  });

  return ok(res, studentDTO(updated[0]));
}
