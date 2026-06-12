// POST /api/enrollments/import — DRY-RUN da planilha (director, secretary).
// Valida + dedup (idempotente) e devolve o relatório, SEM gravar. DASHBOARD_API §4.7.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { enrollments } from '../../../server/db/schema';
import { ok, fail, zodFields } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { analyzeImport } from '../../../server/lib/enrollmentImport';

const Body = z.object({
  csv: z.string().min(1, 'Planilha vazia.'),
  period: z.string().regex(/^\d{4}\.[12]$/, 'Período inválido (ex.: 2026.2).'),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));

  const analysis = analyzeImport(parsed.data.csv);

  // quem já está no banco (submission_id) não reentra (§4.7).
  const okIds = analysis.ok.map((f) => f.submissionId);
  const existing = okIds.length
    ? await db.select({ s: enrollments.submissionId }).from(enrollments).where(inArray(enrollments.submissionId, okIds))
    : [];
  const existingSet = new Set(existing.map((e) => e.s));
  const toImport = analysis.ok.filter((f) => !existingSet.has(f.submissionId));

  return ok(res, {
    toImport: toImport.map((f) => ({ submissionId: f.submissionId, studentNames: f.studentNames, responsible: f.legal.name })),
    toImportCount: toImport.length,
    duplicatesRemoved: analysis.duplicatesRemoved,
    alreadyInDb: existingSet.size,
    needsReview: analysis.needsReview,
  });
}
