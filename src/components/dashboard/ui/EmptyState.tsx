import { CloudOff, Inbox, RotateCcw, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/* Empty/Error states — port dos helpers emptyState()/errorState() do preview
   (DESIGN.md §8). Empty distingue "nenhum dado ainda" de "filtro não achou";
   o erro de carregar sempre oferece "Tentar de novo". */

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  sub?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, sub, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="empty-ico">
        <Icon className="w-6 h-6 text-[var(--muted)]" />
      </div>
      <p className="font-heading font-semibold text-[15px]">{title}</p>
      {sub && <p className="text-sm text-[var(--muted)] mt-1 max-w-[360px]">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* CTA com o mesmo visual dos botões primários do app (emptyBtn do preview) */
export function EmptyButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold"
      style={{ background: '#1E3765' }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  sub?: string;
  retryLabel?: string;
  onRetry: () => void;
}

export function ErrorState({
  icon: Icon = CloudOff,
  title = 'Não foi possível carregar esta tela',
  sub = 'Falha de conexão com o servidor. Verifique a internet e tente de novo — se persistir, recarregue a página.',
  retryLabel = 'Tentar de novo',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="empty-ico" style={{ background: 'rgba(220,38,38,.10)' }}>
        <Icon className="w-6 h-6" style={{ color: '#DC2626' }} />
      </div>
      <p className="font-heading font-semibold text-[15px]">{title}</p>
      <p className="text-sm text-[var(--muted)] mt-1 max-w-[380px]">{sub}</p>
      <div className="mt-4">
        <EmptyButton icon={RotateCcw} label={retryLabel} onClick={onRetry} />
      </div>
    </div>
  );
}
