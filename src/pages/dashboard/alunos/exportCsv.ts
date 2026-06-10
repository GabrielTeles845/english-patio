import { isFuture, kidTurma, nivelLabel, salaById, schLabel, type Student } from '../../../lib/dashboard/data';
import { STATUS } from '../../../lib/dashboard/status';

/* Exportar planilha (CSV de verdade) — port de exportCSV (dashboard.html l.4728).
   O caller registra a atividade e mostra o toast. */
export function exportStudentsCSV(rows: Student[]): void {
  /* célula segura: ponto e vírgula/aspas/quebra de linha viram campo entre aspas;
     valor começando com = + - @ ganha apóstrofo para o Excel não executar como fórmula */
  const cell = (v: unknown): string => {
    let s = String(v ?? '');
    if (/^[=+@]|^-[^ \d]/.test(s)) s = "'" + s;
    return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = ['Aluno', 'Idade', 'Nascimento', 'Responsável', 'Telefone', 'Sala', 'Dias e horário', 'Nível', 'Teacher', 'Status contrato', 'Situação', 'Na escola desde', 'Bairro', 'Cidade', 'Matrícula em', 'Hora', 'Desligado em', 'Motivo do desligamento', 'Observações do desligamento'];
  const csv = [head.join(';')]
    .concat(
      rows.flatMap((s) =>
        s.kids.map((k) => {
          const t = kidTurma(k);
          const sala = t ? salaById(t.sala) : null;
          return [
            k.n, k.age, k.b, s.resp.n, s.resp.phone,
            sala ? sala.n : 'Sem turma',
            t ? schLabel(t.par) + ' ' + t.hora : '',
            t ? nivelLabel(t.nivel) : '',
            sala?.prof || '',
            STATUS[s.status].label,
            s.active === false ? 'Inativa' : isFuture(s) ? 'Começa em 2026.2' : 'Estudando',
            s.since || '', s.addr.bairro, s.addr.city, s.date, s.hora || '',
            s.exit?.date || '', s.exit?.label || '', s.exit?.note || '',
          ].map(cell).join(';');
        }),
      ),
    )
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'alunos-english-patio.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
