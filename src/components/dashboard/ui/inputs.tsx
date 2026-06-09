import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/* Inputs da dashboard — port do inputCls/passInput/máscaras do preview
   (l.3979–3983 e l.5364–5389). Máscaras sempre que aplicável; senha sempre
   com olhinho (regra do CLAUDE.md). */

export const inputCls =
  'mt-1.5 w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none focus:ring-2 ring-brand-light';

export type MaskKind = 'date' | 'phone' | 'cpf' | 'cep';

export function applyMask(kind: MaskKind, raw: string): string {
  if (kind === 'date') {
    let v = raw.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
    else if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    return v;
  }
  if (kind === 'phone') {
    const v = raw.replace(/\D/g, '').slice(0, 11);
    if (v.length > 7) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
    if (v.length > 2) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length > 0) return '(' + v;
    return v;
  }
  if (kind === 'cpf') {
    const v = raw.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9);
    if (v.length > 6) return v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6);
    if (v.length > 3) return v.slice(0, 3) + '.' + v.slice(3);
    return v;
  }
  const v = raw.replace(/\D/g, '').slice(0, 8);
  return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v;
}

interface MaskedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskKind;
  value: string;
  onChange: (v: string) => void;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(function MaskedInput(
  { mask, value, onChange, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      inputMode="numeric"
      {...rest}
      className={className ?? inputCls}
      value={value}
      onChange={(e) => onChange(applyMask(mask, e.target.value))}
    />
  );
});

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  autoComplete?: string;
}

export function PasswordInput({ label, value, onChange, className = '', autoComplete }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <label className={`block relative ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      <input
        type={show ? 'text' : 'password'}
        className={`${inputCls} pr-10`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 bottom-[9px] p-1 rounded-md text-[var(--muted)] hover:text-brand-light hover:bg-[var(--hover)] transition"
        data-tip="Mostrar/ocultar senha"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </label>
  );
}
