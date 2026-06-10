import {
  dnum,
  dvNum,
  horaPeriodo,
  isFuture,
  kidTurma,
  nivelByK,
  salaById,
  STUDENTS,
  type Kid,
  type Student,
} from '../../../lib/dashboard/data';
import { STATUS } from '../../../lib/dashboard/status';

/* Filtros + ordenação da tela Alunos — port 1:1 do dashboard.html
   (ALUNO_FILTERS l.2030, kidTurmaOk l.2033, filteredStudents l.2049,
   SORT_VAL l.2083, famGroupRows l.2136). Funções puras: o estado vive na tela. */

export interface AlunoFilters {
  q: string;
  fNivel: string;
  fSala: string;
  fProf: string;
  fHora: string;
  fDia: string;
  fPeriodo: string;
  fStatus: string;
  fActive: string;
  fHood: string;
  fAge: string;
  fMedia: string;
  fSib: string;
  fFrom: string;
  fTo: string;
}

export const ALUNO_FILTER_KEYS = [
  'fNivel', 'fSala', 'fProf', 'fHora', 'fDia', 'fPeriodo',
  'fStatus', 'fActive', 'fHood', 'fAge', 'fMedia', 'fSib',
] as const;

export const emptyFilters = (): AlunoFilters => ({
  q: '', fNivel: '', fSala: '', fProf: '', fHora: '', fDia: '', fPeriodo: '',
  fStatus: '', fActive: '', fHood: '', fAge: '', fMedia: '', fSib: '', fFrom: '', fTo: '',
});

/* nº de filtros ativos — port updateClearBtn (l.2105) */
export function activeFilterCount(f: AlunoFilters): number {
  return (
    ALUNO_FILTER_KEYS.filter((k) => f[k]).length +
    (f.q.trim() ? 1 : 0) +
    (dnum(f.fFrom) ? 1 : 0) +
    (dnum(f.fTo) ? 1 : 0)
  );
}

/* o aluno (kid) passa nos filtros que derivam da TURMA? — a matrícula entra se
   ALGUM aluno dela passar em todos ao mesmo tempo (port l.2033) */
function kidTurmaOk(k: Kid, f: AlunoFilters): boolean {
  const fn = f.fNivel, fsl = f.fSala, fp = f.fProf, fhr = f.fHora, fd = f.fDia, fpe = f.fPeriodo;
  const t = kidTurma(k);
  if (fp === 'none') { if (t && salaById(t.sala)!.prof) return false; }
  else if (fp) { if (!t || salaById(t.sala)!.prof !== fp) return false; }
  if (fsl === 'none') { if (t) return false; }
  else if (fsl) { if (!t || t.sala !== fsl) return false; }
  if (fn) {
    if (!t) return false;
    if (fn.startsWith('fam:')) { if (nivelByK(t.nivel)!.fam !== fn.slice(4)) return false; }
    else if (t.nivel !== fn) return false;
  }
  if (fhr) { if (!t || t.hora !== fhr) return false; }
  if (fd) { if (!t || t.par !== fd) return false; }
  if (fpe) { if (!t || horaPeriodo(t.hora) !== fpe) return false; }
  return true;
}

/* port filteredStudents (l.2049) */
export function filteredStudents(f: AlunoFilters): Student[] {
  const q = f.q.toLowerCase();
  const fst = f.fStatus, fa = f.fActive, fh = f.fHood, fage = f.fAge, fm = f.fMedia, fsib = f.fSib;
  const from = dnum(f.fFrom), to = dnum(f.fTo);
  return STUDENTS.filter((s) => {
    const hay = (s.kids.map((k) => k.n).join(' ') + ' ' + s.resp.n + ' ' + s.addr.bairro).toLowerCase();
    const act =
      fa === '' ? true
        : fa === 'on' ? s.active !== false && !isFuture(s)
        : fa === 'next' ? s.active !== false && isFuture(s)
        : s.active === false;
    const ageOk =
      !fage ||
      s.kids.some((k) =>
        fage === '4-6' ? k.age >= 4 && k.age <= 6
          : fage === '7-9' ? k.age >= 7 && k.age <= 9
          : fage === '10-12' ? k.age >= 10 && k.age <= 12
          : k.age >= 13,
      );
    const mediaOk = !fm || (fm === 'yes' ? s.media !== false : s.media === false);
    const sibOk = !fsib || (fsib === 'multi' ? s.kids.length > 1 : s.kids.length === 1);
    const dateOk = (!from || dvNum(s) >= from) && (!to || dvNum(s) <= to);
    return (
      hay.includes(q) && s.kids.some((k) => kidTurmaOk(k, f)) && (!fst || s.status === fst) && act &&
      (!fh || s.addr.bairro === fh) && ageOk && mediaOk && sibOk && dateOk
    );
  });
}

/* ordenação por coluna (port TABLE_COLS l.2079 + SORT_VAL l.2083) */
export const TABLE_COLS = [
  { k: 'name', l: 'Aluno' },
  { k: 'resp', l: 'Responsável' },
  { k: 'turma', l: 'Turma' },
  { k: 'status', l: 'Contrato' },
  { k: 'active', l: 'Situação' },
  { k: 'since', l: 'Na escola' },
  { k: 'date', l: 'Matrícula' },
] as const;

export type SortKey = (typeof TABLE_COLS)[number]['k'];

export const SORT_VAL: Record<SortKey, (s: Student) => string | number> = {
  name: (s) => s.kids[0].n.toLowerCase(),
  resp: (s) => s.resp.n.toLowerCase(),
  turma: (s) => { const t = kidTurma(s.kids[0]); return t ? salaById(t.sala)!.n + t.par + t.hora : 'zzz'; }, // sem turma vai pro fim
  status: (s) => STATUS[s.status].label,
  active: (s) => (s.active === false ? 2 : isFuture(s) ? 1 : 0),
  since: (s) => (s.since ? s.since.split('/').reverse().join('') : '99999999'), // sem registro vai pro fim
  date: (s) => s.date.split('/').reverse().join('') + (s.hora || ''),
};

/* "Famílias juntas": matrículas do mesmo responsável aparecem adjacentes,
   na posição da primeira que apareceria na ordenação atual (port l.2136) */
export function famGroupRows(rows: Student[]): Student[] {
  const seen = new Set<string>(), out: Student[] = [];
  rows.forEach((r) => {
    if (seen.has(r.resp.cpf)) return;
    seen.add(r.resp.cpf);
    out.push(...rows.filter((x) => x.resp.cpf === r.resp.cpf));
  });
  return out;
}
