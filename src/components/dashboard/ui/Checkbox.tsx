/* Checkbox componentizada `.ck` — port 1:1 do preview (DESIGN.md §7).
   18px, radius 6, on = preenchida navy com check branco. Nunca checkbox nativa. */

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, className = '', disabled }: CheckboxProps) {
  const box = (
    <span className={`ck ${checked ? 'on' : ''}`} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex items-center gap-2 disabled:opacity-50 ${className}`}
    >
      {box}
      {label && <span>{label}</span>}
    </button>
  );
}
