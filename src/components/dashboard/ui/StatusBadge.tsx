import { STATUS, type ContractStatus } from '../../../lib/dashboard/status';

/* Badge de status de contrato — DESIGN.md §15.9 (cor própria + fundo
   translúcido, pill 999px com dot). */

export function StatusBadge({ status }: { status: ContractStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
