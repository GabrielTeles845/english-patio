// Regras de Agenda compartilhadas pelas rotas de turma.
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { students } from '../db/schema';

// Os 8 horários reais (1h cada; 15:30→16:45 tem intervalo). AGENDA_PLAN/§10.
export const START_TIMES = [
  '8:30', '9:30', '10:30', '13:30', '14:30', '15:30', '16:45', '17:45',
] as const;

export const DAY_PAIRS = ['seg-qua', 'ter-qui'] as const;

// Ocupação de uma turma = nº de alunos ATIVOS com class_id = X. Alimenta as
// regras CAPACITY_BELOW_OCCUPANCY (editar capacidade) e CLASS_NOT_EMPTY (excluir).
export async function classOccupancy(classId: number): Promise<number> {
  const r = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(students)
    .where(and(eq(students.classId, classId), eq(students.isActive, true)));
  return r[0]?.c ?? 0;
}
