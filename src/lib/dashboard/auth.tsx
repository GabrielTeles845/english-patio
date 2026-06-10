import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/* Auth da dashboard — STUB em memória (DASHBOARD_PLAN.md §8.1, "fallback stub").
   Na Fase 1 real isto vira POST /api/auth/login (cookie JWT httpOnly + CSRF,
   DASHBOARD_API.md §1); a interface do contexto já é a final para o front.
   Papéis e matriz de acesso: DASHBOARD_PLAN.md §4. */

export type Role = 'Diretor' | 'Supervisor' | 'Secretaria';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

/* mesmas pessoas do mock do preview (USERS) */
export const DEMO_USERS: SessionUser[] = [
  { id: 1, name: 'Priscylla Martins', email: 'priscylla@englishpatio.com.br', role: 'Diretor' },
  { id: 2, name: 'Gabriel Teles', email: 'gabriel@englishpatio.com.br', role: 'Diretor' },
  { id: 3, name: 'Camila Nogueira', email: 'camila@englishpatio.com.br', role: 'Supervisor' },
  { id: 4, name: 'Stefany Oliveira', email: 'stefany@englishpatio.com.br', role: 'Secretaria' },
  { id: 5, name: 'Beatriz Souza', email: 'beatriz@englishpatio.com.br', role: 'Secretaria' },
];

/* telas (chaves do preview) liberadas por papel — Diretor acessa tudo */
const ROLE_VIEWS: Record<Exclude<Role, 'Diretor'>, string[]> = {
  Supervisor: ['alunos', 'agenda', 'detalhe', 'config'],
  Secretaria: ['alunos', 'agenda', 'detalhe', 'contratos', 'config', 'notifs'],
};

/* tela inicial por papel (DASHBOARD_PLAN.md §4) */
export const ROLE_HOME: Record<Role, string> = {
  Diretor: 'overview',
  Supervisor: 'agenda',
  Secretaria: 'alunos',
};

export function roleAllows(role: Role, view: string): boolean {
  return role === 'Diretor' || (ROLE_VIEWS[role] ?? []).includes(view);
}

/* Supervisor não tem sino — eventos são de matrícula/contrato (PLAN §4) */
export function roleHasBell(role: Role): boolean {
  return role !== 'Supervisor';
}

/* iniciais das DUAS primeiras palavras — port exato do preview (l.1430) */
export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
}

interface AuthCtx {
  user: SessionUser | null;
  /* "Ver painel como…" — recurso do Diretor (PLAN §6.10); null = papel real */
  viewAs: Role | null;
  /* papel efetivo para o gating visual (o servidor é sempre a autoridade real) */
  effectiveRole: Role | null;
  effectiveUser: SessionUser | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  setViewAs: (role: Role | null) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fora do DashboardAuthProvider');
  return ctx;
}

const SESSION_KEY = 'ep-dash-session';

function readSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const id = JSON.parse(raw) as number;
    return DEMO_USERS.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

/* pessoa de exemplo por papel no "ver painel como…" (ROLE_DEMO do preview) */
const ROLE_DEMO: Record<Role, number> = { Diretor: 1, Supervisor: 3, Secretaria: 4 };

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession);
  const [viewAs, setViewAs] = useState<Role | null>(null);

  const value = useMemo<AuthCtx>(() => {
    const effectiveRole = viewAs ?? user?.role ?? null;
    const effectiveUser =
      viewAs && viewAs !== user?.role ? DEMO_USERS.find((u) => u.id === ROLE_DEMO[viewAs]) ?? user : user;
    return {
      user,
      viewAs,
      effectiveRole,
      effectiveUser,
      login: async (email: string, _password: string) => {
        void _password; // o stub não valida senha — o backend real fará (bcrypt, rate-limit)
        const found = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!found) throw new Error('E-mail ou senha incorretos. Confira e tente de novo.');
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(found.id));
        setUser(found);
        setViewAs(null);
        return found;
      },
      logout: () => {
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
        setViewAs(null);
      },
      setViewAs: (role) => setViewAs(role && role !== user?.role ? role : null),
    };
  }, [user, viewAs]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
