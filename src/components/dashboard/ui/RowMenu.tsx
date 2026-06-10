import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/* Menu de ações ⋮ por linha — port do openRowMenu do preview (l.5447).
   Concentra as ações (sem fileira de ícones soltos); cada tela monta os itens
   válidos para o status atual. Posição fixa ancorada no botão que abriu. */

export interface RowMenuItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  /* cor custom (ex.: verde do "Reativar aluno") — sobrepõe danger */
  color?: string;
}

export type RowMenuEntry = RowMenuItem | 'divider';

interface RowMenuProps {
  anchor: DOMRect;
  items: RowMenuEntry[];
  onClose: () => void;
}

export function RowMenu({ anchor, items, onClose }: RowMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mh = m.offsetHeight || 100;
    m.style.left = `${Math.max(10, Math.min(anchor.left - 220, innerWidth - 270))}px`;
    m.style.top = anchor.bottom + mh + 12 > innerHeight ? `${anchor.top - mh - 6}px` : `${anchor.bottom + 6}px`;
  }, [anchor]);

  useEffect(() => {
    const close = (ev: Event) => {
      if (!ref.current?.contains(ev.target as Node)) onClose();
    };
    const esc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', onClose, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  return createPortal(
    <div ref={ref} className="fixed z-[86] w-64 surface rounded-xl shadow-2xl p-1.5" role="menu">
      {items.map((it, i) =>
        it === 'divider' ? (
          <div key={i} className="h-px my-1" style={{ background: 'var(--border)' }} />
        ) : (
          <button
            key={i}
            role="menuitem"
            onClick={() => {
              onClose();
              it.onClick();
            }}
            className="w-full flex items-center gap-2.5 text-left text-sm px-3 py-2 rounded-lg hover:bg-[var(--hover)] transition"
            style={it.color ? { color: it.color } : it.danger ? { color: '#DC2626' } : undefined}
          >
            {it.icon}
            {it.label}
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}
