// Render de variáveis dos comunicados (DASHBOARD_API §8). Variáveis suportadas:
// {{nome_responsavel}} e {{nome_aluno}}.
export interface CommVars {
  nome_responsavel?: string;
  nome_aluno?: string;
}

export function renderTemplate(text: string, vars: CommVars): string {
  return text
    .replace(/{{\s*nome_responsavel\s*}}/g, vars.nome_responsavel ?? '')
    .replace(/{{\s*nome_aluno\s*}}/g, vars.nome_aluno ?? '');
}

// `{{` sem `}}` (ou vice-versa) depois de remover as variáveis válidas = erro (§8).
export function hasUnclosedVar(text: string): boolean {
  const stripped = text.replace(/{{\s*\w+\s*}}/g, '');
  return stripped.includes('{{') || stripped.includes('}}');
}

// ── Resolução de audiência ────────────────────────────────────────────────────
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { enrollments, responsibles, students } from '../db/schema';

export interface AudienceFilter {
  period?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface CommRecipient {
  enrollmentId: number;
  responsibleName: string | null;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  studentNames: string[];
}

// Famílias-alvo do comunicado: aplica o filtro e junta responsável legal + alunos.
export async function resolveAudience(filter: AudienceFilter): Promise<CommRecipient[]> {
  const conds = [];
  if (filter.period) conds.push(eq(enrollments.period, filter.period));
  const status = filter.status ?? 'active';
  if (status === 'active') {
    conds.push(sql`EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.is_active = true)`);
  } else if (status === 'inactive') {
    conds.push(sql`NOT EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.is_active = true)`);
  }
  const enrs = await db.select({ id: enrollments.id }).from(enrollments).where(conds.length ? and(...conds) : undefined);
  const ids = enrs.map((e) => e.id);
  if (!ids.length) return [];

  const resps = await db
    .select({ e: responsibles.enrollmentId, name: responsibles.name, email: responsibles.email, phone: responsibles.phone, type: responsibles.type })
    .from(responsibles)
    .where(inArray(responsibles.enrollmentId, ids));
  const kids = await db.select({ e: students.enrollmentId, name: students.name }).from(students).where(inArray(students.enrollmentId, ids));

  const legalBy = new Map<number, { name: string; email: string | null; phone: string | null }>();
  for (const r of resps) if (r.type === 'legal' && !legalBy.has(r.e)) legalBy.set(r.e, { name: r.name, email: r.email, phone: r.phone });
  const kidsBy = new Map<number, string[]>();
  for (const k of kids) (kidsBy.get(k.e) ?? kidsBy.set(k.e, []).get(k.e)!).push(k.name);

  return ids.map((id) => {
    const l = legalBy.get(id);
    return {
      enrollmentId: id,
      responsibleName: l?.name ?? null,
      responsibleEmail: l?.email ?? null,
      responsiblePhone: l?.phone ?? null,
      studentNames: kidsBy.get(id) ?? [],
    };
  });
}
