// RBAC server-side (DASHBOARD_PLAN §4, API §0): toda rota revalida o papel da
// sessão — o front esconder a tela não é autoridade. Falha → 403 FORBIDDEN.
import type { Session } from './auth';

export type Role = 'director' | 'supervisor' | 'secretary';

export const ALL_ROLES: readonly Role[] = ['director', 'supervisor', 'secretary'];

export function hasRole(session: Session, roles: readonly Role[]): boolean {
  return roles.includes(session.user.role as Role);
}
