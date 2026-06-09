import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, type LucideIcon } from 'lucide-react';

/* Modal — port do openModal/modalHeader do preview (dashboard.html l.3950):
   card .surface rounded-2xl, header sticky com X, RODAPÉ STICKY (botões sempre
   visíveis ao rolar), fecha no clique fora e no Esc. Nunca alert/confirm nativo. */

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /* fileira de botões — vira o rodapé sticky */
  footer?: ReactNode;
  size?: 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl';
}

export function Modal({ title, onClose, children, footer, size = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const esc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[88] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`surface rounded-2xl w-full ${size} max-h-[90vh] overflow-y-auto fade-in`} role="dialog" aria-label={title}>
        <div
          className="flex items-center justify-between px-5 h-14 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <h3 className="font-heading font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--hover)]" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
        {footer && (
          <div
            className="flex gap-2 px-5 pb-5 pt-3 sticky bottom-0 z-10"
            style={{ background: 'var(--card)', boxShadow: '0 -10px 14px -14px rgba(0,0,0,.4)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* Confirmação de ação destrutiva em modal próprio dizendo a consequência —
   regra transversal (PLAN §12); nunca confirm() nativo. */
interface ConfirmModalProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  /* navy para confirmações não destrutivas (ex. vaga extra) */
  tone?: 'danger' | 'primary';
}

export function ConfirmModal({ title, icon: Icon, children, confirmLabel, onConfirm, onClose, tone = 'danger' }: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-[var(--border)] font-medium text-sm">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl text-white font-semibold text-sm"
            style={{ background: tone === 'danger' ? '#DC2626' : '#1E3765' }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="p-5">
        {Icon && (
          <div
            className="w-12 h-12 rounded-2xl grid place-content-center mb-4"
            style={{ background: tone === 'danger' ? 'rgba(220,38,38,.10)' : 'var(--hover)' }}
          >
            <Icon className="w-5 h-5" style={{ color: tone === 'danger' ? '#DC2626' : '#2F539A' }} />
          </div>
        )}
        <div className="text-sm text-[var(--muted)] space-y-2">{children}</div>
      </div>
    </Modal>
  );
}
