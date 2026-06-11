// Regras de negócio de matrícula/aluno compartilhadas pelas rotas de escrita
// (DASHBOARD_API §4, VALIDACOES §13/§14).

// Motivos de desligamento (espelho de EXIT_REASONS no front, data.ts).
export const EXIT_REASONS = [
  'adapt',
  'financial',
  'competitor',
  'moved',
  'schedule',
  'completed',
  'other',
] as const;
export type ExitReason = (typeof EXIT_REASONS)[number];

// Teto físico de alunos numa sala: capacidade padrão 7 + até 2 vagas extras (§13).
export const ROOM_MAX_SEATS = 9;

// Data de hoje em YYYY-MM-DD (coluna `date` do Postgres guarda só a data).
export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
