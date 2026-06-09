/* Status de contrato — espelha o mapa STATUS do preview (DESIGN.md §2.3/§15.9).
   Cores ficam no tailwind.config (status.*). */

export const STATUS = {
  pending: { label: 'Pendente', cls: 'text-status-pending bg-status-pending/15' },
  sent: { label: 'Enviado', cls: 'text-status-sent bg-status-sent/15' },
  viewed: { label: 'Visualizado', cls: 'text-status-viewed bg-status-viewed/15' },
  signed: { label: 'Assinado', cls: 'text-status-signed bg-status-signed/15' },
  rejected: { label: 'Recusado', cls: 'text-status-rejected bg-status-rejected/15' },
  failed: { label: 'Falha no envio', cls: 'text-status-failed bg-status-failed/15' },
} as const;

export type ContractStatus = keyof typeof STATUS;

/* balde "precisa de ação" (fora do caminho feliz) */
export const needsAction = (s: ContractStatus) => s === 'rejected' || s === 'failed';
export const needsSignature = (s: ContractStatus) => s === 'pending' || s === 'sent' || s === 'viewed';
