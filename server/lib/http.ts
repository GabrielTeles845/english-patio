// Helpers de resposta/entrada compartilhados por todas as rotas /api.
// Envelope único (DASHBOARD_API §0): sucesso { ok:true, data } · erro { ok:false, error }.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ZodError } from 'zod';

export function ok(res: VercelResponse, data: unknown, status = 200): void {
  res.status(status).json({ ok: true, data });
}

export function fail(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): void {
  res.status(status).json({
    ok: false,
    error: fields ? { code, message, fields } : { code, message },
  });
}

// Achata os erros do Zod no formato { campo: "mensagem" } do envelope (§0).
export function zodFields(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// IP do cliente atrás do proxy da Vercel (rate-limit + auditoria).
export function clientIp(req: VercelRequest): string | null {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  if (Array.isArray(xff) && xff.length) return xff[0];
  return req.socket?.remoteAddress ?? null;
}
