import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { applyMask, inputCls } from './inputs';

/* Datepicker próprio — port do calendário do preview (dashboard.html l.5392).
   Nunca date input nativo. Modo dias ↔ anos (grade de 12), seleção pinta navy. */

const DP_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface DateInputProps {
  value: string;
  onChange: (v: string) => void;
  startYear?: number;
  placeholder?: string;
  className?: string;
}

/* input dd/mm/aaaa com máscara + botão de calendário */
export function DateInput({ value, onChange, startYear = 2018, placeholder = 'dd/mm/aaaa', className }: DateInputProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="relative">
      <input
        className={className ?? `${inputCls} pr-10`}
        value={value}
        placeholder={placeholder}
        inputMode="numeric"
        onChange={(e) => onChange(applyMask('date', e.target.value))}
      />
      <button
        type="button"
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="absolute right-2 bottom-[9px] p-1 rounded-md text-[var(--muted)] hover:text-brand-light hover:bg-[var(--hover)] transition"
        data-tip="Abrir calendário"
      >
        <CalendarDays className="w-4 h-4" />
      </button>
      {open && btnRef.current && (
        <DatePickerPopover
          anchor={btnRef.current.getBoundingClientRect()}
          value={value}
          startYear={startYear}
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

interface PopoverProps {
  anchor: DOMRect;
  value: string;
  startYear: number;
  onPick: (v: string) => void;
  onClose: () => void;
}

export function DatePickerPopover({ anchor, value, startYear, onPick, onClose }: PopoverProps) {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const [mode, setMode] = useState<'days' | 'years'>('days');
  const [month, setMonth] = useState(m ? +m[2] - 1 : 0);
  const [year, setYear] = useState(m ? +m[3] : startYear);
  const [yearBase, setYearBase] = useState((m ? +m[3] : startYear) - 5);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const dp = ref.current;
    if (!dp) return;
    const h = dp.offsetHeight || 320;
    dp.style.left = `${Math.max(10, Math.min(anchor.left - 120, innerWidth - 292))}px`;
    dp.style.top = `${anchor.bottom + h + 12 > innerHeight ? anchor.top - h - 8 : anchor.bottom + 8}px`;
  }, [anchor, mode, month, year, yearBase]);

  useEffect(() => {
    const close = (ev: Event) => {
      if (!ref.current?.contains(ev.target as Node)) onClose();
    };
    const esc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  const nav = (d: number) => {
    if (mode === 'years') {
      setYearBase((b) => b + d * 12);
      return;
    }
    let mo = month + d, y = year;
    if (mo < 0) { mo = 11; y--; }
    if (mo > 11) { mo = 0; y++; }
    setMonth(mo);
    setYear(y);
  };

  const firstDow = new Date(year, month, 1).getDay();
  const nDays = new Date(year, month + 1, 0).getDate();
  const sel = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  return createPortal(
    <div ref={ref} className="fixed z-[89] w-[280px] surface rounded-2xl shadow-2xl p-3">
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)} className="w-8 h-8 rounded-lg grid place-content-center hover:bg-[var(--hover)] transition">
          <ChevronLeft className="w-4 h-4 text-[var(--muted)]" />
        </button>
        <button
          onClick={() => {
            setMode((md) => (md === 'days' ? 'years' : 'days'));
            setYearBase(year - 5);
          }}
          className="font-heading font-semibold text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--hover)] transition"
        >
          {mode === 'years' ? `${yearBase} – ${yearBase + 11}` : `${DP_MONTHS[month]} ${year}`}
        </button>
        <button onClick={() => nav(1)} className="w-8 h-8 rounded-lg grid place-content-center hover:bg-[var(--hover)] transition">
          <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
        </button>
      </div>
      {mode === 'years' ? (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {Array.from({ length: 12 }, (_, i) => {
            const y = yearBase + i;
            return (
              <button
                key={y}
                onClick={() => {
                  setYear(y);
                  setMode('days');
                }}
                className={`h-9 rounded-lg text-sm font-medium transition ${y === year ? 'text-white' : 'hover:bg-[var(--hover)]'}`}
                style={y === year ? { background: '#1E3765' } : undefined}
              >
                {y}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-0.5 mt-1 text-center text-[10px] font-bold text-[var(--muted)] uppercase">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 mt-1 place-items-center">
            {Array.from({ length: firstDow }, (_, i) => (
              <span key={`e${i}`} />
            ))}
            {Array.from({ length: nDays }, (_, i) => {
              const d = i + 1;
              const isSel = !!sel && +sel[1] === d && +sel[2] === month + 1 && +sel[3] === year;
              return (
                <button
                  key={d}
                  onClick={() => onPick(`${String(d).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`)}
                  className={`h-8 w-8 rounded-lg text-[13px] font-medium transition ${isSel ? 'text-white' : 'hover:bg-[var(--hover)]'}`}
                  style={isSel ? { background: '#1E3765' } : undefined}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
