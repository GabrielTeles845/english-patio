// Regras de contrato compartilhadas. "Parado" (stale) é DERIVADO on-demand
// (os crons saíram do escopo em 10/Jun/2026): contrato em 'sent'/'viewed' há
// ≥7 dias. DASHBOARD_PLAN §5/§7, DASHBOARD_API §6.
export const STALE_DAYS = 7;

export function isContractStale(
  c: { status: string; sentAt: Date | null; viewedAt: Date | null },
  now: Date = new Date(),
): boolean {
  const ref = c.status === 'sent' ? c.sentAt : c.status === 'viewed' ? c.viewedAt : null;
  if (!ref) return false;
  return (now.getTime() - ref.getTime()) / 86_400_000 >= STALE_DAYS;
}

// Estados terminais: uma vez assinado/recusado, o contrato não volta atrás por
// evento atrasado do webhook nem por override manual (assinatura = validade
// jurídica). DASHBOARD_PLAN §5; regra do CLAUDE.md ("signed é caminho encerrado").
export function isTerminalContractStatus(s: string): boolean {
  return s === 'signed' || s === 'rejected';
}

// Transições que o override MANUAL do Diretor (POST /contracts/:id/status) pode
// aplicar — espelha o menu ⋮ do front. signed é terminal; rejected só refaz
// (reenvia). Sair de um estado para fora desta lista é 422 INVALID_TRANSITION.
const ALLOWED_MANUAL: Record<string, readonly string[]> = {
  pending: ['sent', 'signed', 'failed'],
  sent: ['viewed', 'signed', 'rejected', 'failed'],
  viewed: ['signed', 'rejected', 'failed'],
  failed: ['sent', 'signed'],
  rejected: ['sent'],
  signed: [],
};

export function canManualTransition(from: string, to: string): boolean {
  if (from === to) return true; // no-op idempotente
  return (ALLOWED_MANUAL[from] ?? []).includes(to);
}
