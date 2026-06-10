// Regras de gestão de usuários (DASHBOARD_API §10, PLAN §6.10).
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema';

export async function activeDirectorCount(): Promise<number> {
  const r = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, 'director'), eq(users.isActive, true)));
  return r[0]?.c ?? 0;
}

// Guarda do último Diretor: uma operação que rebaixaria/desativaria o ÚNICO Diretor
// ativo é bloqueada (422 LAST_DIRECTOR). Pura, pra ser testável sem banco.
// `activeDirectors` = total de diretores ativos no sistema.
// `newRole`: no PATCH, o papel novo; no deactivate, passe undefined.
export function blocksLastDirector(
  target: { role: string; isActive: boolean },
  activeDirectors: number,
  newRole?: string,
): boolean {
  const targetIsActiveDirector = target.role === 'director' && target.isActive;
  if (!targetIsActiveDirector || activeDirectors > 1) return false;
  return newRole === undefined ? true : newRole !== 'director';
}
