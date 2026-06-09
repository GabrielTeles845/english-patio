import { LogOut, Moon, Sun } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { initials, roleAllows, useAuth } from '../../../lib/dashboard/auth';
import { sidebarLogo, useTheme, type SidebarTheme } from '../../../lib/dashboard/theme';
import { NAV_GROUPS } from '../../../lib/dashboard/nav';
import { useToast } from '../ui/Toast';

/* Sidebar — port 1:1 do preview: logo + "Dashboard", 3 grupos de navegação,
   rodapé com theme dots + toggle claro/escuro e avatar+papel+logout.
   Itens fora do papel ficam ocultos (RBAC visual; o servidor é a autoridade). */

const THEME_DOTS: Array<[SidebarTheme, string, string]> = [
  ['blue', 'linear-gradient(135deg,#1E3765,#2F539A)', 'Sidebar azul'],
  ['white', 'linear-gradient(135deg,#fff,#e8edf5)', 'Sidebar branca'],
  ['yellow', 'linear-gradient(135deg,#FFF6DB,#F5B700)', 'Sidebar amarela'],
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { effectiveUser, effectiveRole, logout } = useAuth();
  const { dark, sidebar, setSidebar, toggleDark } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!effectiveUser || !effectiveRole) return null;

  return (
    <>
      <aside
        id="sidebar"
        className={`fixed lg:sticky top-0 z-50 h-screen w-[256px] shrink-0 ${open ? '' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 flex flex-col`}
        style={{ background: 'linear-gradient(180deg,var(--sb-1),var(--sb-2))', color: 'var(--sb-text)' }}
      >
        <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: 'var(--sb-border)' }}>
          <img src={sidebarLogo(sidebar, dark)} alt="English Patio" className="h-10 w-auto" />
          <div className="h-6 w-px mx-3" style={{ background: 'var(--sb-border)' }} />
          <span className="font-heading text-[17px] font-medium tracking-wide" style={{ color: 'var(--sb-strong)' }}>
            Dashboard
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => roleAllows(effectiveRole, i.view));
            if (items.length === 0) return null;
            return (
              <div key={group.title}>
                <p className="px-3 text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--sb-muted)' }}>
                  {group.title}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.view}
                      to={`/dashboard/${item.slug}`}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `nav-item sb-item ${isActive ? 'active' : ''} group relative flex items-center gap-3 px-3 h-10 rounded-xl transition cursor-pointer`
                      }
                    >
                      <span
                        className="bar absolute left-0 top-2 bottom-2 w-1 rounded-full opacity-0 transition"
                        style={{ background: 'var(--sb-accent)' }}
                      />
                      <item.icon className="w-[18px] h-[18px]" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--sb-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {THEME_DOTS.map(([key, bg, tip]) => (
                <button
                  key={key}
                  data-tip={tip}
                  onClick={() => {
                    setSidebar(key);
                    toast('Tema aplicado!');
                  }}
                  className="w-5 h-5 rounded-full transition hover:scale-110"
                  style={{ background: bg, border: `2px solid ${key === sidebar ? 'var(--sb-strong)' : 'var(--sb-border)'}` }}
                />
              ))}
            </div>
            <button
              onClick={(e) => toggleDark(e)}
              data-tip="Modo claro/escuro"
              className="sb-item w-8 h-8 rounded-lg grid place-content-center transition"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="p-3 border-t" style={{ borderColor: 'var(--sb-border)' }}>
          <div className="sb-item flex items-center gap-3 px-2 py-2 rounded-xl">
            <div
              className="w-9 h-9 rounded-full grid place-content-center font-semibold"
              style={{ background: 'var(--sb-accent)', color: 'var(--sb-accent-text)' }}
            >
              {initials(effectiveUser.name)}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--sb-strong)' }}>
                {effectiveUser.name}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--sb-muted)' }}>
                {effectiveUser.role}
              </p>
            </div>
            <button
              data-tip="Sair do painel"
              onClick={() => {
                logout();
                navigate('/dashboard/entrar');
              }}
              className="ml-auto opacity-60 hover:opacity-100"
              style={{ color: 'var(--sb-muted)' }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      {open && <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}
    </>
  );
}
