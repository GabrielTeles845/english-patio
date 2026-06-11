// POST /api/enrollments/import/commit — grava as linhas aprovadas da planilha
// (director, secretary). Idempotente por submission_id. DASHBOARD_API §4.7.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../server/db/client';
import { enrollments, activityLog } from '../../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../../server/lib/http';
import { getSession, csrfValid } from '../../../server/lib/auth';
import { hasRole } from '../../../server/lib/rbac';
import { analyzeImport, insertImportedFamily } from '../../../server/lib/enrollmentImport';

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
  const okIds = analysis.ok.map((f) => f.submissionId);
  const existing = okIds.length
    ? await db.select({ s: enrollments.submissionId }).from(enrollments).where(inArray(enrollments.submissionId, okIds))
    : [];
  const done = new Set(existing.map((e) => e.s));

  let imported = 0, skipped = 0;
  for (const f of analysis.ok) {
    if (done.has(f.submissionId)) { skipped++; continue; }
    await insertImportedFamily(f, parsed.data.period);
    done.add(f.submissionId); // guarda extra contra duplicata na mesma rodada
    imported++;
  }

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'import',
    targetType: 'enrollment', detail: { imported, skipped, needsReview: analysis.needsReview.length }, ip: clientIp(req),
  });

  return ok(res, { imported, skipped, needsReview: analysis.needsReview.length, duplicatesRemoved: analysis.duplicatesRemoved });
}
