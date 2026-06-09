import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, type LucideIcon } from 'lucide-react';

/* Toast — anatomia exata do preview (DESIGN.md §7): card .surface com círculo de
   ícone AMARELO (#F5B700, ícone navy #15294d) à esquerda, entra/sai por
   translateY, auto-dismiss em 2600ms. Nunca verde. Erro de salvar = mesmo toast
   com ícone de alerta. */

interface ToastCtx {
  toast: (msg: string, icon?: LucideIcon) => void;
  toastErr: (msg: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast fora do ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ msg: string; icon: LucideIcon; on: boolean }>({
    msg: '',
    icon: Check,
    on: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((msg: string, icon: LucideIcon = Check) => {
    setState({ msg, icon, on: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState((s) => ({ ...s, on: false })), 2600);
  }, []);

  const toastErr = useCallback((msg: string) => toast(msg, AlertTriangle), [toast]);

  const Icon = state.icon;
  return (
    <Ctx.Provider value={{ toast, toastErr }}>
      {children}
      <div
        className={`fixed bottom-6 right-6 z-[90] transition-transform duration-300 w-max max-w-[92vw] ${state.on ? 'translate-y-0' : 'translate-y-24'}`}
        role="status"
        aria-live="polite"
      >
        <div className="surface flex items-center gap-3 pl-2.5 pr-5 py-2.5 rounded-2xl text-sm font-semibold shadow-2xl">
          <span className="w-8 h-8 rounded-full grid place-content-center shrink-0" style={{ background: '#F5B700' }}>
            <Icon className="w-4 h-4" style={{ color: '#15294d' }} />
          </span>
          <span className="text-[var(--text)]">{state.msg}</span>
        </div>
      </div>
    </Ctx.Provider>
  );
}
