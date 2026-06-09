import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

/* Select customizado — port 1:1 do cselect do preview (dashboard.html l.1487).
   Nunca <select> nativo. O menu abre via portal no <body> com position:fixed
   (lição do preview: fixed dentro de modal com transform abre longe — l.1502). */

export interface CSelectItem {
  v: string;
  l: string;
  dot?: string;
  bold?: boolean;
  pad?: boolean;
}

interface CSelectProps {
  value: string;
  items: CSelectItem[];
  onChange: (v: string) => void;
  icon?: ReactNode;
  block?: boolean;
  ariaLabel?: string;
}

export function CSelect({ value, items, onChange, icon, block, ariaLabel }: CSelectProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = items.find((i) => i.v === value);

  useLayoutEffect(() => {
    if (!open) return;
    const btn = btnRef.current, menu = menuRef.current;
    if (!btn || !menu) return;
    const r = btn.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - 288))}px`;
    menu.style.minWidth = `${r.width}px`;
    const mh = Math.min(menu.scrollHeight, 300);
    if (innerHeight - r.bottom < mh + 14 && r.top > mh + 14) {
      menu.style.top = 'auto';
      menu.style.bottom = `${innerHeight - r.top + 6}px`;
    } else {
      menu.style.bottom = 'auto';
      menu.style.top = `${r.bottom + 6}px`;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (ev: Event) => {
      if (menuRef.current?.contains(ev.target as Node) || btnRef.current?.contains(ev.target as Node)) return;
      setOpen(false);
    };
    const esc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className={`cs relative ${open ? 'open' : ''} ${block ? 'w-full' : ''}`}>
      <button
        type="button"
        ref={btnRef}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`cs-btn ${block ? 'w-full justify-between h-11' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        {icon}
        <span className="truncate">{current?.l ?? ''}</span>
        <ChevronDown className="cs-chev w-4 h-4 text-[var(--muted)] ml-auto" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="cs-menu fixed w-max max-w-[280px] surface rounded-xl shadow-2xl p-1.5"
            style={{ zIndex: 95, maxHeight: 300, overflowY: 'auto' }}
          >
            {items.map((it) => (
              <button
                type="button"
                key={it.v}
                role="option"
                aria-selected={it.v === value}
                onClick={() => {
                  setOpen(false);
                  onChange(it.v);
                }}
                className={`w-full flex items-center justify-between gap-3 text-left text-sm px-3 py-2 ${it.pad ? 'pl-7' : ''} rounded-lg hover:bg-[var(--hover)] transition`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {it.dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.dot }} />}
                  <span className={`truncate ${it.bold ? 'font-semibold' : ''}`}>{it.l}</span>
                </span>
                <Check className={`w-4 h-4 shrink-0 ${it.v === value ? 'text-brand-light' : 'opacity-0'}`} />
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
