// Regras de Agenda compartilhadas pelas rotas de turma.

// Os 8 horários reais (1h cada; 15:30→16:45 tem intervalo). AGENDA_PLAN/§10.
export const START_TIMES = [
  '8:30', '9:30', '10:30', '13:30', '14:30', '15:30', '16:45', '17:45',
] as const;

export const DAY_PAIRS = ['seg-qua', 'ter-qui'] as const;

// Ocupação de uma turma = nº de alunos com class_id = X. A tabela `students` ainda
// NÃO existe (fatia futura), então por ora a ocupação é sempre 0 — o que mantém
// corretas as regras CAPACITY_BELOW_OCCUPANCY e CLASS_NOT_EMPTY no estado atual.
// Quando `students` entrar, trocar isto por um count real (where class_id = id).
export async function classOccupancy(_classId: number): Promise<number> {
  return 0;
}
