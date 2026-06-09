import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

/* Tema da dashboard — replica o mecanismo do preview (DESIGN.md §15.4):
   classe `dark` + atributo `data-sidebar` no <html>, transição circular do
   claro/escuro via View Transitions. Persistência em ep-dark / ep-sb-theme
   (o preview não persistia o dark; no real persistimos — melhoria assumida). */

export type SidebarTheme = 'blue' | 'white' | 'yellow';

const SB_KEY = 'ep-sb-theme';
const DARK_KEY = 'ep-dark';

const BASE = import.meta.env.BASE_URL;
export const LOGOS = {
  colored: `${BASE}assets/logo-index.webp`,
  blue: `${BASE}assets/logo-sidebar-azul.svg`,
  yellow: `${BASE}assets/logo-sidebar-amarela.svg`,
};

/* logo da sidebar conforme tema (mesma regra do applySidebarTheme do preview) */
export function sidebarLogo(sidebar: SidebarTheme, dark: boolean): string {
  return dark ? LOGOS.blue : sidebar === 'blue' ? LOGOS.blue : LOGOS.colored;
}

interface ThemeCtx {
  dark: boolean;
  sidebar: SidebarTheme;
  setSidebar: (s: SidebarTheme) => void;
  toggleDark: (ev?: { clientX: number; clientY: number }) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme fora do DashboardThemeProvider');
  return ctx;
}

function readStored(): { dark: boolean; sidebar: SidebarTheme } {
  const sb = localStorage.getItem(SB_KEY);
  return {
    dark: localStorage.getItem(DARK_KEY) === '1',
    sidebar: sb === 'white' || sb === 'yellow' ? sb : 'blue',
  };
}

/* Aplica o tema no <html> enquanto a dashboard estiver montada e limpa ao sair —
   o site institucional nunca recebe .dark / data-sidebar. */
export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [{ dark, sidebar }, setState] = useState(readStored);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('dark', dark);
    el.setAttribute('data-sidebar', sidebar);
    return () => {
      el.classList.remove('dark');
      el.removeAttribute('data-sidebar');
    };
  }, [dark, sidebar]);

  const setSidebar = (s: SidebarTheme) => {
    localStorage.setItem(SB_KEY, s);
    setState((st) => ({ ...st, sidebar: s }));
  };

  const toggleDark = (ev?: { clientX: number; clientY: number }) => {
    const run = () =>
      setState((st) => {
        localStorage.setItem(DARK_KEY, st.dark ? '0' : '1');
        return { ...st, dark: !st.dark };
      });
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || !ev) {
      run();
      return;
    }
    const x = ev.clientX, y = ev.clientY;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    doc
      .startViewTransition(() => {
        // o React precisa pintar dentro do snapshot da transição
        flushSyncSafe(run);
      })
      .ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 520, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
  };

  return <Ctx.Provider value={{ dark, sidebar, setSidebar, toggleDark }}>{children}</Ctx.Provider>;
}

function flushSyncSafe(fn: () => void) {
  try {
    flushSync(fn);
  } catch {
    fn();
  }
}
