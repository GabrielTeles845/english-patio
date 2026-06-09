import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Menu } from 'lucide-react';
import { roleHasBell, useAuth } from '../../../lib/dashboard/auth';
import { EmptyState } from '../ui/EmptyState';

/* Topbar — port do header do preview: título da tela + data por extenso,
   sino de notificações (Diretor e Secretaria; Supervisor não tem — PLAN §4).
   A central real de notificações chega na Fase 4; o painel já existe com
   o estado vazio. */

function todayLabel(): string {
  const s = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Topbar({ title, onOpenSidebar }: { title: string; onOpenSidebar: () => void }) {
  const { effectiveRole } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const close = (ev: MouseEvent) => {
      if (!bellRef.current?.contains(ev.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notifOpen]);

  return (
    <header className="sticky top-0 z-30 h-16 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="h-full max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        <button onClick={onOpenSidebar} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--hover)]">
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="font-heading font-semibold leading-tight truncate">{title}</p>
          <p className="text-[11px] text-[var(--muted)] leading-tight hidden sm:block">{todayLabel()}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {effectiveRole && roleHasBell(effectiveRole) && (
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2.5 rounded-xl hover:bg-[var(--hover)]"
                data-tip="Notificações"
              >
                <Bell className="w-[18px] h-[18px]" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] max-w-[88vw] surface rounded-2xl shadow-2xl z-50 overflow-hidden fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="font-heading font-semibold">Notificações</p>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    <EmptyState
                      icon={BellOff}
                      title="Nada por aqui ainda"
                      sub="Os eventos de matrícula e contrato aparecem nesta central quando o painel estiver ligado ao banco (Fase 4)."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
