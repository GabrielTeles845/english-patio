// POST /api/announcements/preview — render do comunicado com variáveis, SEM enviar
// (só Diretor). Usa a 1ª família da audiência como amostra (ou placeholders).
// DASHBOARD_API §8.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { ok, fail, zodFields } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole } from '../../server/lib/rbac';
import { renderTemplate, hasUnclosedVar, resolveAudience } from '../../server/lib/announcements';

const Body = z.object({
  subject: z.string().trim().min(1, 'Campo obrigatório.').max(150, 'Máximo de 150 caracteres.'),
  body: z.string().trim().min(1, 'Campo obrigatório.').max(2000, 'Máximo de 2000 caracteres.'),
  audienceFilter: z.object({
    period: z.string().optional(),
    status: z.enum(['active', 'inactive', 'all']).optional(),
    dayPair: z.enum(['seg-qua', 'ter-qui']).optional(),
    pendingContract: z.boolean().optional(),
  }).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Comunicados são só do Diretor.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(parsed.error));
  const { subject, body } = parsed.data;
  if (hasUnclosedVar(subject) || hasUnclosedVar(body)) {
    return fail(res, 400, 'VALIDATION', 'Variável aberta sem fechar ({{ sem }}).', { body: 'Variável aberta sem fechar.' });
  }

  const audience = await resolveAudience(parsed.data.audienceFilter ?? {});
  const sample = audience[0];
  const vars = sample
    ? { nome_responsavel: sample.responsibleName ?? '', nome_aluno: sample.studentNames.join(' e ') }
    : { nome_responsavel: 'Responsável', nome_aluno: 'Aluno' };

  return ok(res, {
    audienceCount: audience.length,
    subject: renderTemplate(subject, vars),
    body: renderTemplate(body, vars),
    sample: sample ? { responsibleName: sample.responsibleName, studentNames: sample.studentNames } : null,
  });
}
