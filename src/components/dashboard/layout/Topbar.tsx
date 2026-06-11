import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Eye,
  FileCheck2,
  FileClock,
  FileX,
  MailCheck,
  MailWarning,
  Menu,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { roleHasBell, useAuth } from '../../../lib/dashboard/auth';
import { fetchNotifications, markAllReadApi, markNotifReadApi, type PanelNotif } from '../../../lib/dashboard/notificationsApi';
import { type NotifType } from '../../../lib/dashboard/data';
import { EmptyState } from '../ui/EmptyState';

/* Topbar — port do header do preview: título da tela + data por extenso,
   sino de notificações (Diretor e Secretaria; Supervisor não tem — PLAN §4).
   Painel do sino = port do renderNotifs/notifClick/markAllRead (l.1706–1747);
   a central de notificações É este painel (PLAN §6.8 — sem rota própria). */

function todayLabel(): string {
  const s = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ícone/cores por tipo (port icon() l.1707–1713) */
const NOTIF_ICON: Record<NotifType, [LucideIcon, string, string]> = {
  enroll: [UserPlus, '#B5860B', 'rgba(245,183,0,.16)'],
  signed: [FileCheck2, '#16a34a', 'rgba(22,163,74,.12)'],
  viewed: [Eye, '#7C3AED', 'rgba(124,58,237,.12)'],
  stale: [FileClock, '#DC2626', 'rgba(220,38,38,.10)'],
  rejected: [FileX, '#DC2626', 'rgba(220,38,38,.10)'],
  failed: [MailWarning, '#EA580C', 'rgba(234,88,12,.12)'],
  email: [MailCheck, '#2F539A', 'rgba(47,83,154,.12)'],
};

export function Topbar({ title, onOpenSidebar }: { title: string; onOpenSidebar: () => void }) {
  const { effectiveRole } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<PanelNotif[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  const hasBell = !!effectiveRole && roleHasBell(effectiveRole);
  const load = useCallback(async () => {
    if (!hasBell) return;
    try {
      setNotifs(await fetchNotifications());
    } catch {
      /* sino é best-effort: falha silenciosa não atrapalha o resto do painel */
    }
  }, [hasBell]);
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notifOpen) return;
    void load(); // recarrega ao abrir o painel
    const close = (ev: MouseEvent) => {
      if (!bellRef.current?.contains(ev.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notifOpen, load]);

  const unread = notifs.filter((n) => n.unread).length;

  /* marca lida (otimista), fecha e abre a ficha do aluno se houver */
  const notifClick = async (n: PanelNotif) => {
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
    setNotifOpen(false);
    try {
      await markNotifReadApi(n.id);
    } catch {
      /* ignora */
    }
    if (n.sid) navigate(`/dashboard/alunos/${n.sid}`);
  };

  const markAll = async () => {
    setNotifs((prev) => prev.map((x) => ({ ...x, unread: false })));
    try {
      await markAllReadApi();
    } catch {
      /* ignora */
    }
  };

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
            <div className="relative" ref={bellRef} data-tour="bell">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2.5 rounded-xl hover:bg-[var(--hover)]"
                data-tip="Notificações"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unread > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold grid place-content-center"
                    style={{ background: 'var(--acc)', color: 'var(--acc-text)' }}
                  >
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] max-w-[88vw] surface rounded-2xl shadow-2xl z-50 overflow-hidden fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="font-heading font-semibold">Notificações</p>
                    <button onClick={markAll} className="text-xs font-medium text-brand-light hover:underline">
                      Marcar como lidas
                    </button>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifs.length === 0 ? (
                      <EmptyState
                        icon={BellOff}
                        title="Nada por aqui ainda"
                        sub="Os eventos de matrícula e contrato aparecem aqui assim que acontecem."
                      />
                    ) : (
                      notifs.map((n) => {
                        const [Icon, c, bg] = NOTIF_ICON[n.type];
                        return (
                          <div
                            key={n.id}
                            onClick={() => notifClick(n)}
                            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--hover)] transition border-b last:border-0"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <div
                              className="w-9 h-9 rounded-xl grid place-content-center shrink-0 mt-0.5"
                              style={{ background: bg, color: c }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-snug">{n.title}</p>
                              <p className="text-xs text-[var(--muted)] truncate">{n.desc}</p>
                              <p className="text-[11px] text-[var(--muted)] mt-0.5">{n.time}</p>
                            </div>
                            {n.unread && <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: 'var(--acc)' }} />}
                          </div>
                        );
                      })
                    )}
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
