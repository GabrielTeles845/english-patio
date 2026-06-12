import { useState } from 'react';
import { Bell, ChevronRight, LifeBuoy, Palette, Pencil, PlayCircle, RotateCcw, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { initials, useAuth } from '../../lib/dashboard/auth';
import { useTheme, type SidebarTheme } from '../../lib/dashboard/theme';
import { useToast } from '../../components/dashboard/ui/Toast';
import { useTour } from '../../components/dashboard/ui/Tour';
import { enablePush, pushState, type PushState } from '../../lib/dashboard/pushApi';
import { AccountModal } from './AccountModal';

/* Configurações — port da tela do preview: Aparência (modo escuro com animação
   circular + 3 temas de sidebar), Minha conta, Segurança e Ajuda/tours. */

const SB_OPTIONS: Array<[SidebarTheme, string, string]> = [
  ['blue', 'Azul', 'linear-gradient(135deg,#1E3765,#2F539A)'],
  ['white', 'Branca', 'linear-gradient(135deg,#ffffff,#eef2f9)'],
  ['yellow', 'Amarela', 'linear-gradient(135deg,#FFF6DB,#F5B700)'],
];

const TOUR_VIEWS = ['overview', 'alunos', 'agenda', 'editor', 'contratos', 'modelos', 'emails', 'usuarios', 'atividade', 'config'];

export default function Config() {
  const { effectiveUser } = useAuth();
  const { dark, sidebar, setSidebar, toggleDark } = useTheme();
  const { toast } = useToast();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifState, setNotifState] = useState<PushState>(() => pushState());
  const [enabling, setEnabling] = useState(false);

  async function enableNotifs() {
    setEnabling(true);
    try {
      const s = await enablePush();
      setNotifState(s);
      if (s === 'granted') toast('Notificações no computador ativadas!');
      else if (s === 'denied') toast('Permissão negada — reative nas configurações do navegador.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível ativar as notificações.');
    } finally {
      setEnabling(false);
    }
  }

  return (
    <section className="fade-in">
      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
      <h1 className="font-heading text-2xl sm:text-3xl font-semibold mb-1">Configurações</h1>
      <p className="text-[var(--muted)] text-sm mb-6">Aparência, conta e segurança do painel</p>
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* aparência */}
        <div className="surface rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl grid place-content-center" style={{ background: 'rgba(245,183,0,.14)' }}>
              <Palette className="w-5 h-5" style={{ color: '#B5860B' }} />
            </div>
            <div>
              <h3 className="font-heading font-semibold">Aparência</h3>
              <p className="text-xs text-[var(--muted)]">Deixe o painel com a sua cara</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Modo escuro</p>
                <p className="text-xs text-[var(--muted)]">Claro por padrão · animação a partir do clique</p>
              </div>
              <button onClick={(e) => toggleDark(e)} className="w-12 h-7 rounded-full relative transition" style={{ background: 'var(--hover)' }}>
                <span
                  className="absolute top-1 w-5 h-5 rounded-full bg-brand transition-all"
                  style={{ left: dark ? '1.5rem' : '0.25rem' }}
                />
              </button>
            </div>
            <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="font-medium text-sm">Tema da sidebar</p>
              <p className="text-xs text-[var(--muted)] mb-3">
                Com claro/escuro, são 6 combinações — as bolinhas no rodapé da sidebar também trocam
              </p>
              <div className="flex gap-4" id="sbThemePicker">
                {SB_OPTIONS.map(([key, label, bg]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSidebar(key);
                      toast('Tema aplicado!');
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`w-16 h-11 rounded-xl border transition ${key === sidebar ? 'ring-2 ring-offset-2' : ''}`}
                      style={{
                        background: bg,
                        borderColor: 'var(--border)',
                        ...(key === sidebar
                          ? ({ '--tw-ring-color': '#2F539A', '--tw-ring-offset-color': 'var(--card)' } as React.CSSProperties)
                          : {}),
                      }}
                    />
                    <span className={`text-xs ${key === sidebar ? 'font-semibold' : 'text-[var(--muted)]'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* conta */}
        <div className="surface rounded-2xl overflow-hidden" data-tour="conta">
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl grid place-content-center" style={{ background: 'rgba(47,83,154,.10)' }}>
              <UserRound className="w-5 h-5 text-brand-light" />
            </div>
            <div>
              <h3 className="font-heading font-semibold">Minha conta</h3>
              <p className="text-xs text-[var(--muted)]">Quem está usando o painel</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full grid place-content-center font-semibold text-[#15294d]" style={{ background: '#FFE17A' }}>
                {effectiveUser ? initials(effectiveUser.name) : ''}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{effectiveUser?.name}</p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {effectiveUser?.email} · {effectiveUser?.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAccountOpen(true)}
              className="mt-4 w-full h-10 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] transition flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Editar e-mail e senha
            </button>
          </div>
        </div>

        {/* segurança */}
        <div className="surface rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl grid place-content-center" style={{ background: 'rgba(22,163,74,.10)' }}>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-heading font-semibold">Segurança</h3>
              <p className="text-xs text-[var(--muted)]">Proteção dos dados dos alunos</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div
              onClick={() => navigate('/dashboard/atividade')}
              className="flex items-center justify-between cursor-pointer hover:bg-[var(--hover)] -mx-2 px-2 py-1.5 rounded-lg transition"
            >
              <div>
                <p className="font-medium text-sm">Registro de atividades</p>
                <p className="text-xs text-[var(--muted)]">Quem fez o quê no painel — toque para ver</p>
              </div>
              <span className="flex items-center gap-1.5">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(22,163,74,.10)', color: '#16a34a' }}>
                  Ativo
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="font-medium text-sm">Autenticação em 2 fatores</p>
                <p className="text-xs text-[var(--muted)]">Código extra no celular ao entrar</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--hover)] text-[var(--muted)]">Em breve</span>
            </div>
          </div>
        </div>

        {/* notificações */}
        <div className="surface rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl grid place-content-center" style={{ background: 'rgba(245,183,0,.14)' }}>
              <Bell className="w-5 h-5" style={{ color: '#B5860B' }} />
            </div>
            <div>
              <h3 className="font-heading font-semibold">Notificações</h3>
              <p className="text-xs text-[var(--muted)]">Avisos no computador, mesmo com o painel fechado</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Notificações no computador</p>
                <p className="text-xs text-[var(--muted)]">Um aviso do sistema a cada matrícula nova ou contrato assinado</p>
              </div>
              {notifState === 'granted' ? (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ background: 'rgba(22,163,74,.10)', color: '#16a34a' }}
                >
                  Ativadas
                </span>
              ) : notifState === 'unsupported' ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--hover)] text-[var(--muted)] whitespace-nowrap">
                  Indisponível
                </span>
              ) : (
                <button
                  onClick={enableNotifs}
                  disabled={enabling}
                  className="h-9 px-4 rounded-xl text-sm font-semibold text-[#15294d] disabled:opacity-60 transition whitespace-nowrap"
                  style={{ background: '#F5B700' }}
                >
                  {enabling ? 'Ativando…' : 'Ativar'}
                </button>
              )}
            </div>
            {notifState === 'denied' && (
              <p className="text-xs mt-3 text-[var(--muted)]">
                As notificações estão bloqueadas neste navegador. Reative no cadeado da barra de endereço.
              </p>
            )}
          </div>
        </div>

        {/* ajuda */}
        <div className="surface rounded-2xl overflow-hidden" data-tour="ajuda">
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl grid place-content-center" style={{ background: 'rgba(124,58,237,.10)' }}>
              <LifeBuoy className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <h3 className="font-heading font-semibold">Ajuda e dicas</h3>
              <p className="text-xs text-[var(--muted)]">Tours guiados por tela</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div
              onClick={() => startTour('config')}
              className="flex items-center justify-between cursor-pointer hover:bg-[var(--hover)] -mx-2 px-2 py-1.5 rounded-lg transition"
            >
              <div>
                <p className="font-medium text-sm">Rever as dicas desta tela</p>
                <p className="text-xs text-[var(--muted)]">O botão "?" no canto faz o mesmo em qualquer tela</p>
              </div>
              <PlayCircle className="w-5 h-5 text-brand-light" />
            </div>
            <div
              onClick={() => {
                localStorage.removeItem('ep-tours-off');
                TOUR_VIEWS.forEach((v) => localStorage.removeItem(`ep-tour-seen-${v}`));
                toast('Dicas reativadas em todas as telas!');
              }}
              className="flex items-center justify-between pt-3 border-t cursor-pointer hover:bg-[var(--hover)] -mx-2 px-2 py-1.5 rounded-lg transition"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <p className="font-medium text-sm">Reativar dicas em todas as telas</p>
                <p className="text-xs text-[var(--muted)]">Volta a mostrar os tours uma vez por tela</p>
              </div>
              <RotateCcw className="w-5 h-5 text-[var(--muted)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
