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
