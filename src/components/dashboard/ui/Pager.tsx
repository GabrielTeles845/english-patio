import { ChevronLeft, ChevronRight } from 'lucide-react';

/* Paginação das listas — port do pager do preview (PAGE_SIZE=20,
   "Mostrando X–Y de Z", em Alunos e Contratos). */

interface PagerProps {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  /* rótulo da unidade, ex. "matrículas" */
  unit: string;
}

export function Pager({ total, page, pageSize, onPage, unit }: PagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="table-foot flex items-center justify-between px-4 py-3 border-t text-sm" style={{ borderColor: 'var(--border)' }}>
      <p className="text-[var(--muted)] text-xs sm:text-sm">
        Mostrando <b>{from}</b>–<b>{to}</b> de <b>{total}</b> {unit}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="w-8 h-8 rounded-lg border border-[var(--border)] grid place-content-center disabled:opacity-40 hover:bg-[var(--hover)] transition"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium px-2">
          {page + 1} / {pages}
        </span>
        <button
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
          className="w-8 h-8 rounded-lg border border-[var(--border)] grid place-content-center disabled:opacity-40 hover:bg-[var(--hover)] transition"
          aria-label="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
