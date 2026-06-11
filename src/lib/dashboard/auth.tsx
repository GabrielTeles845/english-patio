import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch, ApiError } from './api';

/* Auth da dashboard — ligado ao backend real (DASHBOARD_API §1): POST /api/auth/login
   (cookie JWT httpOnly + CSRF), GET /api/auth/me (restaura sessão) e
   POST /api/auth/logout. Papéis e matriz de acesso: DASHBOARD_PLAN.md §4.
   Os papéis no servidor são em inglês (director/supervisor/secretary); a UI usa
   os rótulos em português — o mapa abaixo converte. */

export type Role = 'Diretor' | 'Supervisor' | 'Secretaria';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: 'director' | 'supervisor' | 'secretary';
}

const ROLE_FROM_API: Record<ApiUser['role'], Role> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  secretary: 'Secretaria',
};

function mapUser(u: ApiUser): SessionUser {
  return { id: u.id, name: u.name, email: u.email, role: ROLE_FROM_API[u.role] ?? 'Secretaria' };
}

/* personas de exemplo para o "Ver painel como…" (Diretor, PLAN §6.10) — cosmético */
export const DEMO_USERS: SessionUser[] = [
  { id: 1, name: 'Priscylla Martins', email: 'priscylla@englishpatio.com.br', role: 'Diretor' },
  { id: 3, name: 'Camila Nogueira', email: 'camila@englishpatio.com.br', role: 'Supervisor' },
  { id: 4, name: 'Stefany Oliveira', email: 'stefany@englishpatio.com.br', role: 'Secretaria' },
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
  /* true enquanto o GET /api/auth/me da carga inicial não respondeu */
  loading: boolean;
  /* "Ver painel como…" — recurso do Diretor (PLAN §6.10); null = papel real */
  viewAs: Role | null;
  /* papel efetivo para o gating visual (o servidor é sempre a autoridade real) */
  effectiveRole: Role | null;
  effectiveUser: SessionUser | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  /* recarrega o usuário do /api/auth/me (após editar conta/senha) */
  refresh: () => Promise<void>;
  setViewAs: (role: Role | null) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fora do DashboardAuthProvider');
  return ctx;
}

const ROLE_DEMO: Record<Role, number> = { Diretor: 1, Supervisor: 3, Secretaria: 4 };

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAs, setViewAs] = useState<Role | null>(null);

  /* restaura a sessão na carga (cookie httpOnly → GET /api/auth/me) */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<{ user: ApiUser }>('/auth/me');
        if (alive) setUser(mapUser(data.user));
      } catch {
        if (alive) setUser(null); // 401 = sem sessão
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthCtx>(() => {
    const effectiveRole = viewAs ?? user?.role ?? null;
    const effectiveUser =
      viewAs && viewAs !== user?.role ? DEMO_USERS.find((u) => u.id === ROLE_DEMO[viewAs]) ?? user : user;
    return {
      user,
      loading,
      viewAs,
      effectiveRole,
      effectiveUser,
      login: async (email: string, password: string) => {
        const data = await apiFetch<{ user: ApiUser }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const mapped = mapUser(data.user);
        setUser(mapped);
        setViewAs(null);
        return mapped;
      },
      logout: async () => {
        try {
          await apiFetch('/auth/logout', { method: 'POST' });
        } catch (err) {
          if (!(err instanceof ApiError)) throw err; // erro de rede real propaga
        }
        setUser(null);
        setViewAs(null);
      },
      refresh: async () => {
        try {
          const data = await apiFetch<{ user: ApiUser }>('/auth/me');
          setUser(mapUser(data.user));
        } catch {
          setUser(null);
        }
      },
      setViewAs: (role) => setViewAs(role && role !== user?.role ? role : null),
    };
  }, [user, loading, viewAs]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
