/* =========================================================================
   Camada de dados MOCK da dashboard — port 1:1 de public/dashboard.html
   ("o preview é a lei", DASHBOARD_PLAN.md §10).

   Tudo aqui é dado + helper PURO (zero DOM). Os nomes de campo são os MESMOS
   do preview (s.kids, k.tid, resp.n, addr.bairro…) para o port das telas ser
   mecânico. Reatividade fica em ./store (as ações mutam estes arrays e dão
   bump()). Linhas citadas referem-se ao dashboard.html.
   ========================================================================= */

import type { ContractStatus } from './status';

/* ====================== TIPOS ====================== */

export type Par = 'seg-qua' | 'ter-qui';
export type FamKey = 'fun' | 'conv' | 'power' | 'sprint';
export type ExitKey =
  | 'adapt'
  | 'financial'
  | 'competitor'
  | 'moved'
  | 'schedule'
  | 'completed'
  | 'other';
export type UserRole = 'Diretor' | 'Supervisor' | 'Secretaria';
export type NotifType = 'stale' | 'rejected' | 'failed' | 'enroll' | 'viewed' | 'signed' | 'email';

export interface ExitReason {
  k: ExitKey;
  ic: string; // nome de ícone lucide
  l: string;
  d: string;
}

export interface Sala {
  id: string;
  n: string;
  c: string; // cor hex
  prof: string | null; // teacher é OPCIONAL (l.1184)
}

export interface Fam {
  n: string;
  c: string;
}

export interface Nivel {
  k: string;
  n: string;
  fam: FamKey;
  ages: [number, number];
}

export interface Turma {
  id: number;
  sala: string; // Sala.id
  par: Par;
  hora: string;
  nivel: string; // Nivel.k
  cap: number;
}

export interface Kid {
  n: string;
  age: number;
  b: string; // nascimento dd/mm/aaaa
  tid: number | null; // turma (null = fila "aguardando turma")
  id?: number; // id real do aluno no banco (presente quando vem da API)
}

export interface Resp {
  n: string;
  cpf: string;
  phone: string;
  email: string;
  rel: string;
  b: string;
}

export interface Second {
  n: string;
  phone: string;
  rel: string;
  cpf?: string;
}

export interface Addr {
  cep: string;
  street: string;
  num: string;
  comp: string;
  bairro: string;
  city: string;
  uf: string;
}

export interface ExitInfo {
  k: ExitKey;
  label: string;
  note: string;
  date: string;
}

export interface Student {
  id: number;
  kids: Kid[];
  resp: Resp;
  second: Second | null;
  fin: string; // nome do responsável financeiro
  addr: Addr;
  pay: string; // sempre 'Boleto' (contrato real)
  status: ContractStatus;
  media: boolean; // autorização de imagem
  since?: string; // "na escola desde" (sempre fev/ago; pode faltar — import da planilha)
  date: string; // data da matrícula (última rematrícula)
  hora?: string; // ex.: '20h14'
  active?: boolean; // ausente/true = ativo; false = desligado
  exit?: ExitInfo;
}

export interface Notif {
  type: NotifType;
  sid: number | null;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export interface ActActor {
  role: string;
  c: string;
  ic?: string;
}

export interface ActEntry {
  who: string;
  a: string; // html (negritos <b> como no preview)
  t: string;
  day: string;
}

export interface User {
  id: number;
  n: string;
  e: string;
  r: UserRole;
  c: string;
  pending?: boolean; // senha provisória ainda não trocada
  active?: boolean; // ausente/true = ativo; false = acesso desativado (sem login)
  last?: string; // último acesso (mock — no real vem da sessão)
}

export interface EmailTpl {
  k: string;
  l: string;
  ic: string;
  col: string;
  s: string; // assunto
  b: string; // corpo
}

export interface TplField {
  k: string;
  label: string;
  src: string;
  page: number;
  x: number;
  y: number;
}

export interface TplFieldMapped extends TplField {
  mapped: boolean;
}

export interface Template {
  id: number;
  name: string;
  file: string;
  size: string;
  pages: number;
  by: string;
  date: string;
  active: boolean;
  fields: TplFieldMapped[];
}

export interface PeriodData {
  labels: string[];
  data: number[];
  rema: number[];
  sub: string;
  chip: string;
}

/* ====================== DADOS FICTÍCIOS (Goiânia) ====================== */

/* motivos de desligamento (port l.1172) */
export const EXIT_REASONS: ExitReason[] = [
  { k: 'adapt',      ic: 'puzzle',         l: 'Não se adaptou à escola',     d: 'Metodologia, turma ou ambiente não funcionaram para a criança' },
  { k: 'financial',  ic: 'wallet',         l: 'Questões financeiras',        d: 'A família não consegue manter a mensalidade no momento' },
  { k: 'competitor', ic: 'school',         l: 'Optou por outra escola',      d: 'A família encontrou outra opção de curso de inglês' },
  { k: 'moved',      ic: 'truck',          l: 'Mudança de cidade ou bairro', d: 'A distância tornou inviável continuar frequentando' },
  { k: 'schedule',   ic: 'clock',          l: 'Horários incompatíveis',      d: 'A rotina da família não encaixa mais nos horários das turmas' },
  { k: 'completed',  ic: 'graduation-cap', l: 'Concluiu o curso',            d: 'O aluno alcançou o objetivo e encerrou o ciclo na escola' },
  { k: 'other',      ic: 'pencil-line',    l: 'Outro motivo',                d: 'Descreva abaixo o que aconteceu' },
];

/* 13 salas com nome de cor; teacher + sala andam juntos no semestre (port l.1188) */
export const SALAS: Sala[] = [
  { id: 'green',     n: 'Green Room',     c: '#7CB342', prof: 'Mariana Rios' },
  { id: 'vanilla',   n: 'Vanilla Room',   c: '#D9B777', prof: 'Júlia Tavares' },
  { id: 'peach',     n: 'Peach Room',     c: '#F2997A', prof: 'Letícia Prado' },
  { id: 'purple',    n: 'Purple Room',    c: '#8E5AC8', prof: 'Rafaela Pires' },
  { id: 'blue',      n: 'Blue Room',      c: '#4A7FD4', prof: 'Ana Castro' },
  { id: 'orange',    n: 'Orange Room',    c: '#F08A3C', prof: 'Bruno Costa' },
  { id: 'mint',      n: 'Mint Room',      c: '#4DB89E', prof: 'Carla Mendes' },
  { id: 'yellow',    n: 'Yellow Room',    c: '#E8B931', prof: 'Paula Vieira' },
  { id: 'guava',     n: 'Guava Room',     c: '#E0606E', prof: null },
  { id: 'beige',     n: 'Beige Room',     c: '#B9A189', prof: 'Renata Lopes' },
  { id: 'rose',      n: 'Rose Room',      c: '#E26D9F', prof: null },
  { id: 'turquoise', n: 'Turquoise Room', c: '#31B5C4', prof: 'Camila Duarte' },
  { id: 'lavender',  n: 'Lavender Room',  c: '#A78BDB', prof: null },
];

/* 19 níveis em 4 famílias, em ordem de evolução (port l.1204) */
export const FAMS: Record<FamKey, Fam> = {
  fun: { n: 'Fun Plus', c: '#E8861B' },
  conv: { n: 'Conversation', c: '#E0457B' },
  power: { n: 'Power', c: '#2F539A' },
  sprint: { n: 'Sprint', c: '#7C3AED' },
};
export const NIVEIS: Nivel[] = [
  { k: 'fun-a',     n: 'Fun Plus A',     fam: 'fun',    ages: [4, 5] },
  { k: 'fun-b',     n: 'Fun Plus B',     fam: 'fun',    ages: [5, 6] },
  { k: 'conv-1',    n: 'Conversation 1', fam: 'conv',   ages: [5, 7] },
  { k: 'conv-2',    n: 'Conversation 2', fam: 'conv',   ages: [6, 8] },
  { k: 'conv-3',    n: 'Conversation 3', fam: 'conv',   ages: [7, 9] },
  { k: 'power-1',   n: 'Power 1',        fam: 'power',  ages: [8, 10] },
  { k: 'power-2',   n: 'Power 2',        fam: 'power',  ages: [9, 11] },
  { k: 'power-3',   n: 'Power 3',        fam: 'power',  ages: [10, 12] },
  { k: 'power-4',   n: 'Power 4',        fam: 'power',  ages: [11, 13] },
  { k: 'power-5',   n: 'Power 5',        fam: 'power',  ages: [12, 14] },
  { k: 'power-6',   n: 'Power 6',        fam: 'power',  ages: [13, 15] },
  { k: 'sprint-1a', n: 'Sprint 1A',      fam: 'sprint', ages: [12, 14] },
  { k: 'sprint-1b', n: 'Sprint 1B',      fam: 'sprint', ages: [12, 14] },
  { k: 'sprint-2a', n: 'Sprint 2A',      fam: 'sprint', ages: [13, 15] },
  { k: 'sprint-2b', n: 'Sprint 2B',      fam: 'sprint', ages: [13, 15] },
  { k: 'sprint-3a', n: 'Sprint 3A',      fam: 'sprint', ages: [14, 16] },
  { k: 'sprint-3b', n: 'Sprint 3B',      fam: 'sprint', ages: [14, 16] },
  { k: 'sprint-4a', n: 'Sprint 4A',      fam: 'sprint', ages: [15, 17] },
  { k: 'sprint-4b', n: 'Sprint 4B',      fam: 'sprint', ages: [15, 17] },
];

/* horários reais das aulas (1h cada; 15:30→16:45 tem intervalo) (port l.1227) */
export const HORAS = ['08:30', '09:30', '10:30', '13:30', '14:30', '15:30', '16:45', '17:45'];

/* as turmas do semestre — capacidade padrão (e máxima) de 7 lugares (port l.1230) */
export const TURMAS: Turma[] = [
  { id: 1,  sala: 'green',  par: 'seg-qua', hora: '08:30', nivel: 'fun-a',     cap: 7 },
  { id: 2,  sala: 'green',  par: 'seg-qua', hora: '09:30', nivel: 'conv-1',    cap: 7 },
  { id: 3,  sala: 'green',  par: 'seg-qua', hora: '13:30', nivel: 'conv-2',    cap: 7 },
  { id: 4,  sala: 'green',  par: 'seg-qua', hora: '15:30', nivel: 'conv-1',    cap: 7 },
  { id: 5,  sala: 'green',  par: 'ter-qui', hora: '09:30', nivel: 'conv-2',    cap: 7 },
  { id: 6,  sala: 'green',  par: 'ter-qui', hora: '14:30', nivel: 'conv-3',    cap: 7 },
  { id: 7,  sala: 'blue',   par: 'seg-qua', hora: '10:30', nivel: 'power-1',   cap: 7 },
  { id: 8,  sala: 'blue',   par: 'seg-qua', hora: '14:30', nivel: 'power-2',   cap: 7 },
  { id: 9,  sala: 'blue',   par: 'seg-qua', hora: '16:45', nivel: 'power-3',   cap: 7 },
  { id: 10, sala: 'blue',   par: 'ter-qui', hora: '15:30', nivel: 'power-1',   cap: 7 },
  { id: 11, sala: 'blue',   par: 'ter-qui', hora: '16:45', nivel: 'power-2',   cap: 7 },
  { id: 12, sala: 'peach',  par: 'seg-qua', hora: '14:30', nivel: 'conv-3',    cap: 7 },
  { id: 13, sala: 'peach',  par: 'seg-qua', hora: '16:45', nivel: 'fun-a',     cap: 7 },
  { id: 14, sala: 'peach',  par: 'ter-qui', hora: '13:30', nivel: 'conv-2',    cap: 7 },
  { id: 15, sala: 'peach',  par: 'ter-qui', hora: '15:30', nivel: 'conv-3',    cap: 7 },
  { id: 16, sala: 'mint',   par: 'seg-qua', hora: '15:30', nivel: 'sprint-1a', cap: 7 },
  { id: 17, sala: 'mint',   par: 'seg-qua', hora: '17:45', nivel: 'sprint-2b', cap: 7 },
  { id: 18, sala: 'mint',   par: 'ter-qui', hora: '17:45', nivel: 'sprint-1b', cap: 7 },
  { id: 19, sala: 'purple', par: 'seg-qua', hora: '13:30', nivel: 'power-4',   cap: 7 },
  { id: 20, sala: 'purple', par: 'ter-qui', hora: '14:30', nivel: 'power-5',   cap: 7 },
  { id: 21, sala: 'purple', par: 'ter-qui', hora: '17:45', nivel: 'power-6',   cap: 7 },
  { id: 22, sala: 'orange', par: 'seg-qua', hora: '14:30', nivel: 'sprint-3a', cap: 7 },
  { id: 23, sala: 'orange', par: 'ter-qui', hora: '16:45', nivel: 'sprint-2a', cap: 7 },
  { id: 24, sala: 'yellow', par: 'seg-qua', hora: '16:45', nivel: 'conv-3',    cap: 7 },
  { id: 25, sala: 'yellow', par: 'ter-qui', hora: '10:30', nivel: 'power-1',   cap: 7 },
  { id: 26, sala: 'rose',   par: 'ter-qui', hora: '13:30', nivel: 'conv-1',    cap: 7 },
  { id: 27, sala: 'rose',   par: 'ter-qui', hora: '15:30', nivel: 'conv-2',    cap: 7 },
  { id: 28, sala: 'guava',  par: 'seg-qua', hora: '15:30', nivel: 'power-3',   cap: 7 },
];

/* contador de id de turma (port l.1260) — encapsulado: binding exportado de
   módulo ES não pode ser reatribuído por quem importa, então quem cria turma
   pega o próximo id por esta função (store.addTurma). */
let nextTurmaId = 29;
export const takeTurmaId = (): number => nextTurmaId++;

/* ====================== HELPERS PUROS (port l.1261–1280) ====================== */

export const turmaById = (id: number): Turma | undefined => TURMAS.find((t) => t.id === id);
export const salaById = (id: string): Sala | undefined => SALAS.find((s) => s.id === id);
export const nivelByK = (k: string): Nivel | undefined => NIVEIS.find((n) => n.k === k);
export const nivelLabel = (k: string): string => nivelByK(k)?.n || '—';
export const famC = (k: string): string => {
  const fam = nivelByK(k)?.fam;
  return (fam && FAMS[fam]?.c) || '#64748B';
};
export const horaPeriodo = (h: string): 'm' | 't' => (+h.slice(0, 2) < 12 ? 'm' : 't');
export const kidTurma = (k: Kid | null | undefined): Turma | null =>
  k && k.tid ? turmaById(k.tid) ?? null : null;

/* ocupação só conta alunos ativos (port l.1269) */
export function activeKidsIn(tid: number): number {
  let n = 0;
  STUDENTS.forEach((s) => {
    if (s.active === false) return;
    s.kids.forEach((k) => {
      if (k.tid === tid) n++;
    });
  });
  return n;
}
export const turmaVagas = (t: Turma): number => Math.max(0, t.cap - activeKidsIn(t.id));
export const turmaFull = (t: Turma): boolean => activeKidsIn(t.id) >= t.cap;
export const turmaShort = (t: Turma): string =>
  `${salaById(t.sala)!.n.replace(' Room', '')} · ${t.par === 'seg-qua' ? 'Seg/Qua' : 'Ter/Qui'} ${t.hora}`;

/* fila de alunos ativos sem turma — cadastrou primeiro, atrela depois (port l.1274) */
export function semTurmaKids(): { s: Student; k: Kid; ki: number }[] {
  const out: { s: Student; k: Kid; ki: number }[] = [];
  STUDENTS.forEach((s) => {
    if (s.active === false) return;
    s.kids.forEach((k, i) => {
      if (!k.tid) out.push({ s, k, ki: i });
    });
  });
  return out;
}

/* alunos ativos de uma turma, ordenados por nome (port l.2577) */
export function kidsOfTurma(tid: number): { s: Student; k: Kid; ki: number }[] {
  const out: { s: Student; k: Kid; ki: number }[] = [];
  STUDENTS.forEach((s) => {
    if (s.active === false) return;
    s.kids.forEach((k, ki) => {
      if (k.tid === tid) out.push({ s, k, ki });
    });
  });
  return out.sort((a, b) => (a.k.n < b.k.n ? -1 : 1));
}

/* turma que ocupa o slot sala × dias × hora — para a regra de slot único (port l.2576) */
export const turmaAt = (sala: string, par: Par, hora: string): Turma | undefined =>
  TURMAS.find((t) => t.sala === sala && t.par === par && t.hora === hora);

/* período: matrículas a partir de Mai/2026 são do período aberto 2026.2 (port l.1447) */
export const dvNum = (s: Student): number => parseInt(s.date.split('/').reverse().join(''), 10);
export const isFuture = (s: Student): boolean => dvNum(s) >= 20260501;
/* dd/mm/aaaa → aaaammdd numérico, ou null se não for data (port l.1449) */
export const dnum = (v: string | null | undefined): number | null => {
  const m = (v || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? parseInt(m[3] + m[2] + m[1], 10) : null;
};
/* como dvNum, mas tolera data ausente/quebrada (port l.1277) */
export const dvNumSafe = (s: Student): number => {
  const m = (s.date || '').split('/');
  return m.length === 3 ? parseInt(m[2] + m[1] + m[0], 10) : 0;
};
/* badge NOVO do quadro do Canva: entrou neste semestre ou começa no próximo (port l.1276) */
export const isNovo = (s: Student): boolean =>
  s.since === '02/02/2026' || isFuture(s) || dvNumSafe(s) >= 20260501;
/* selo neutro — decisão 06/Jun: sempre "NOVO" (port l.1280) */
export const novoTag = (): string => 'NOVO';

/* contrato "parado": enviado/visualizado há 7+ dias sem assinatura — ref. 03/06/2026 (port l.1438) */
export const staleDays = (s: Student): number => {
  const [d, m, y] = s.date.split('/').map(Number);
  return Math.max(0, Math.round((new Date(2026, 5, 3).getTime() - new Date(y, m - 1, d).getTime()) / 86400000));
};
export const isStale = (s: Student): boolean =>
  s.active !== false && (s.status === 'sent' || s.status === 'viewed') && staleDays(s) >= 7;
/* "precisa de ação" / "aguardando assinatura" sobre o Student (port l.1441/1443) —
   ATENÇÃO: ./status exporta needsAction/needsSignature sobre o ContractStatus puro;
   estas versões também exigem matrícula ativa (s.active!==false). */
export const needsAction = (s: Student): boolean =>
  s.active !== false && (s.status === 'rejected' || s.status === 'failed');
export const needsSignature = (s: Student): boolean =>
  s.active !== false && (s.status === 'pending' || s.status === 'sent' || s.status === 'viewed');

export const schLabel = (s: Par): string => (s === 'seg-qua' ? 'Seg/Qua' : 'Ter/Qui');
/* CPF mascarado na lista (LGPD), revelado só no detalhe (port l.1451) */
export const maskCPF = (c: string): string => c.slice(0, 4) + '•••.•••' + c.slice(-3);

/* paleta dos avatares (port l.1429) — initials() já existe em ./auth */
export const palette = ['#1E3765', '#2F539A', '#F5B700', '#7C9AD6', '#B5860B', '#16a34a', '#9333ea', '#0891b2', '#dc2626', '#ea580c', '#0d9488', '#65a30d'];

/* paginação — a base tem ~150 alunos (port l.2115) */
export const PAGE_SIZE = 20;

/* id de sala a partir do nome (port l.3360) */
export const slugify = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* escape de HTML p/ strings interpoladas no registro de atividades (port l.5610) */
export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string));

/* ====================== VALIDAÇÕES (port l.1457–1480) ======================
   Espelham src/utils/validators.ts do site, com a data de referência do
   preview (03/06/2026). Puras — as telas usam nos formulários. */

export const onlyDigits = (v: unknown): string => String(v || '').replace(/\D/g, '');
export function validCPF(cpf: string): boolean {
  const c = onlyDigits(cpf);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let d1 = 0;
  for (let i = 0; i < 9; i++) d1 += +c[i] * (10 - i);
  d1 %= 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  if (d1 !== +c[9]) return false;
  let d2 = 0;
  for (let i = 0; i < 10; i++) d2 += +c[i] * (11 - i);
  d2 %= 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  return d2 === +c[10];
}
export const validEmail = (v: unknown): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
export const validPhone = (v: unknown): boolean => {
  const d = onlyDigits(v);
  return d.length === 11 && d[2] === '9';
};
export const validFullName = (v: unknown): boolean =>
  String(v || '')
    .trim()
    .split(/\s+/)
    .filter((p) => !['e', 'de', 'da', 'do', 'dos', 'das'].includes(p.toLowerCase())).length >= 2;
export function parseDateBR(v: unknown): { d: number; m: number; y: number } | null {
  const m = String(v || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > new Date(y, mo, 0).getDate()) return null;
  return { d, m: mo, y };
}
/* idade na data de referência do preview (03/06/2026) */
export function ageAtRef(v: unknown): number | null {
  const p = parseDateBR(v);
  if (!p) return null;
  return 2026 - p.y - (p.m * 100 + p.d > 603 ? 1 : 0);
}
export const validNewPass = (p: string): boolean => p.length >= 10 && /[a-zA-Z]/.test(p) && /\d/.test(p);
/* a quem este CPF pertence em OUTRA matrícula (aviso de nome divergente, l.1475) */
export function cpfOwner(cpf: string, ignoreId?: number): string | null {
  const c = onlyDigits(cpf);
  if (c.length !== 11) return null;
  const s = STUDENTS.find((x) => x.id !== ignoreId && onlyDigits(x.resp.cpf) === c);
  return s ? s.resp.n : null;
}
export const nrmName = (v: unknown): string => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();
/* caracteres que quebrariam HTML/banco — bloqueados nos textos (port l.1479) */
export const badChars = (v: unknown): boolean => /[<>"'&]/.test(String(v || ''));
export const BAD_CHARS_MSG =
  'Remova os caracteres especiais (sinais de maior/menor, aspas e &) dos campos de texto — use só letras, números e pontuação simples.';

/* ====================== MATRÍCULAS ====================== */

/* as 14 matrículas escritas à mão (port l.1282–1300) */
export const STUDENTS: Student[] = [
  { id: 1, kids: [{ n: 'Helena Duarte Lima', age: 8, b: '14/02/2018', tid: 3 }], resp: { n: 'Mariana Duarte Lima', cpf: '047.812.336-19', phone: '(62) 99214-8870', email: 'mariana.duarte@gmail.com', rel: 'Mãe', b: '09/05/1989' }, second: { n: 'Rafael Lima', phone: '(62) 98112-4471', rel: 'Pai' }, fin: 'Mariana Duarte Lima', addr: { cep: '74230-110', street: 'Rua T-55', num: '180', comp: 'Apto 902', bairro: 'Setor Bueno', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'signed', media: true, since: '03/02/2025', date: '02/06/2026', hora: '20h14' },
  /* irmãos em turmas (e salas) diferentes — o caso real que o modelo antigo não representava */
  { id: 2, kids: [{ n: 'Théo Andrade Rocha', age: 10, b: '22/08/2015', tid: 10 }, { n: 'Lara Andrade Rocha', age: 7, b: '30/11/2018', tid: 14 }], resp: { n: 'Patrícia Andrade', cpf: '118.553.701-58', phone: '(62) 99980-1245', email: 'patricia.andrade@hotmail.com', rel: 'Mãe', b: '17/03/1986' }, second: { n: 'Bruno Rocha', phone: '(62) 99771-3380', rel: 'Pai' }, fin: 'Bruno Rocha', addr: { cep: '74115-030', street: 'Av. T-9', num: '1240', comp: '', bairro: 'Jardim Goiás', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'pending', media: true, since: '05/08/2024', date: '31/05/2026', hora: '19h32' },
  { id: 3, kids: [{ n: 'Miguel Ferreira Souza', age: 12, b: '05/01/2014', tid: 9 }], resp: { n: 'Camila Ferreira', cpf: '203.447.882-70', phone: '(62) 98341-6622', email: 'camila.fsouza@gmail.com', rel: 'Mãe', b: '25/07/1984' }, second: null, fin: 'Camila Ferreira', addr: { cep: '74080-010', street: 'Rua 90', num: '455', comp: 'Casa 2', bairro: 'Setor Sul', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'signed', media: false, since: '03/02/2025', date: '30/05/2026', hora: '10h05' },
  { id: 4, kids: [{ n: 'Sofia Mendes Castro', age: 9, b: '19/09/2016', tid: 6 }], resp: { n: 'Juliana Castro', cpf: '355.221.940-49', phone: '(62) 99657-2218', email: 'ju.castro@outlook.com', rel: 'Mãe', b: '12/12/1990' }, second: { n: 'André Mendes', phone: '(62) 98220-9981', rel: 'Pai' }, fin: 'André Mendes', addr: { cep: '74810-100', street: 'Rua C-140', num: '78', comp: '', bairro: 'Jardim América', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'viewed', media: true, date: '29/05/2026', hora: '21h47' },
  { id: 5, kids: [{ n: 'Bernardo Pires Alves', age: 6, b: '09/06/2020', tid: 4 }], resp: { n: 'Fernanda Pires', cpf: '412.889.503-22', phone: '(62) 99102-7755', email: 'fernanda.pires@gmail.com', rel: 'Mãe', b: '28/02/1992' }, second: null, fin: 'Fernanda Pires', addr: { cep: '74663-520', street: 'Rua VP-7D', num: '320', comp: 'Qd 12 Lt 4', bairro: 'Vila São João', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'signed', media: true, date: '28/05/2026', hora: '14h22' },
  { id: 6, kids: [{ n: 'Alice Barbosa Nunes', age: 11, b: '27/06/2015', tid: 11 }], resp: { n: 'Renata Nunes', cpf: '509.334.118-55', phone: '(62) 98876-4400', email: 'renata.nunes@yahoo.com', rel: 'Mãe', b: '05/09/1983' }, second: { n: 'Carlos Barbosa', phone: '(62) 99443-1102', rel: 'Pai' }, fin: 'Renata Nunes', addr: { cep: '74125-160', street: 'Av. Mutirão', num: '2540', comp: 'Apto 1503', bairro: 'Setor Marista', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'signed', media: true, since: '01/08/2022', date: '27/05/2026', hora: '18h39' },
  { id: 7, kids: [{ n: 'Davi Cardoso Melo', age: 13, b: '11/06/2013', tid: 16 }], resp: { n: 'Aline Melo', cpf: '620.778.245-30', phone: '(62) 99320-8845', email: 'aline.melo@gmail.com', rel: 'Mãe', b: '19/11/1981' }, second: null, fin: 'Aline Melo', addr: { cep: '74305-040', street: 'Rua 1136', num: '95', comp: '', bairro: 'Setor Pedro Ludovico', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'rejected', media: false, since: '05/02/2024', date: '26/05/2026', hora: '20h51' },
  { id: 8, kids: [{ n: 'Manuela Teixeira Gomes', age: 7, b: '08/07/2018', tid: 14 }, { n: 'Pedro Teixeira Gomes', age: 9, b: '16/05/2016', tid: 15 }], resp: { n: 'Vanessa Teixeira', cpf: '731.005.667-18', phone: '(62) 98990-3321', email: 'va.teixeira@hotmail.com', rel: 'Mãe', b: '03/06/1988' }, second: { n: 'Marcos Gomes', phone: '(62) 99558-7700', rel: 'Pai' }, fin: 'Marcos Gomes', addr: { cep: '74884-120', street: 'Av. Rio Verde', num: '1180', comp: 'Cond. Jardins', bairro: 'Jardim Atlântico', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'failed', media: true, since: '05/02/2024', date: '25/05/2026', hora: '16h08' },
  { id: 9, kids: [{ n: 'Isabela Ribeiro Dias', age: 14, b: '02/02/2012', tid: 17 }], resp: { n: 'Cristina Dias', cpf: '845.119.302-10', phone: '(62) 99701-2266', email: 'cristina.dias@gmail.com', rel: 'Mãe', b: '21/08/1979' }, second: null, fin: 'Cristina Dias', addr: { cep: '74215-908', street: 'Av. 136', num: '960', comp: 'Sala 408', bairro: 'Setor Sul', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'signed', media: false, active: false, exit: { k: 'moved', label: 'Mudança de cidade ou bairro', note: 'Família se mudou para Anápolis.', date: '28/05/2026' }, since: '06/02/2023', date: '24/05/2026', hora: '19h15' },
  { id: 10, kids: [{ n: 'Arthur Moraes Pinto', age: 8, b: '29/10/2017', tid: 5 }], resp: { n: 'Letícia Moraes', cpf: '956.443.870-54', phone: '(62) 98112-9943', email: 'leticia.moraes@outlook.com', rel: 'Mãe', b: '14/04/1991' }, second: { n: 'Felipe Pinto', phone: '(62) 99887-6610', rel: 'Pai' }, fin: 'Felipe Pinto', addr: { cep: '74070-060', street: 'Rua 22', num: '310', comp: '', bairro: 'Setor Aeroporto', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'pending', media: true, active: false, exit: { k: 'financial', label: 'Questões financeiras', note: '', date: '30/05/2026' }, date: '23/05/2026', hora: '11h26' },
  { id: 11, kids: [{ n: 'Laura Cavalcante Reis', age: 10, b: '12/12/2015', tid: 8 }], resp: { n: 'Daniela Reis', cpf: '063.778.221-62', phone: '(62) 99334-1180', email: 'dani.reis@gmail.com', rel: 'Mãe', b: '30/01/1987' }, second: null, fin: 'Daniela Reis', addr: { cep: '74343-230', street: 'Rua RF-12', num: '140', comp: 'Qd 8', bairro: 'Residencial Forte', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'signed', media: true, since: '07/08/2023', date: '22/05/2026', hora: '20h33' },
  { id: 12, kids: [{ n: 'Gabriel Fonseca Lopes', age: 11, b: '07/08/2014', tid: 11 }], resp: { n: 'Simone Fonseca', cpf: '174.882.605-03', phone: '(62) 98445-2290', email: 'simone.fonseca@yahoo.com', rel: 'Mãe', b: '08/10/1982' }, second: { n: 'Thiago Lopes', phone: '(62) 99221-5544', rel: 'Pai' }, fin: 'Thiago Lopes', addr: { cep: '74150-020', street: 'Av. T-63', num: '880', comp: 'Apto 701', bairro: 'Setor Bueno', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'viewed', media: true, date: '21/05/2026', hora: '17h44' },
  /* três irmãos, três turmas (port l.1297) */
  { id: 13, kids: [{ n: 'Valentina Almeida Prado', age: 9, b: '15/04/2017', tid: 12 }, { n: 'Henrique Almeida Prado', age: 11, b: '20/09/2014', tid: 8 }, { n: 'Cecília Almeida Prado', age: 6, b: '02/01/2020', tid: 2 }], resp: { n: 'Roberta Almeida Prado', cpf: '288.443.190-04', phone: '(62) 99845-7733', email: 'roberta.prado@gmail.com', rel: 'Mãe', b: '11/07/1985' }, second: { n: 'Eduardo Prado', phone: '(62) 99102-8844', rel: 'Pai' }, fin: 'Eduardo Prado', addr: { cep: '74110-100', street: 'Rua 9', num: '520', comp: 'Casa 1', bairro: 'Setor Oeste', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'signed', media: true, since: '06/02/2023', date: '20/05/2026', hora: '19h58' },
  /* mesma mãe da Helena (id 1), em matrícula separada — agrupa ao ordenar por responsável */
  { id: 14, kids: [{ n: 'Lorenzo Duarte Lima', age: 5, b: '09/10/2021', tid: 13 }], resp: { n: 'Mariana Duarte Lima', cpf: '047.812.336-19', phone: '(62) 99214-8870', email: 'mariana.duarte@gmail.com', rel: 'Mãe', b: '09/05/1989' }, second: { n: 'Rafael Lima', phone: '(62) 98112-4471', rel: 'Pai' }, fin: 'Mariana Duarte Lima', addr: { cep: '74230-110', street: 'Rua T-55', num: '180', comp: 'Apto 902', bairro: 'Setor Bueno', city: 'Goiânia', uf: 'GO' }, pay: 'Boleto', status: 'sent', media: true, date: '19/05/2026', hora: '20h41' },
];

/* +~116 matrículas geradas com seed fixa (mesmos dados em todo reload), calibradas para a
   história da Visão geral: ~128 alunos ativos, 150 vagas, 3 turmas cheias, Ter/Qui 14h vazia.
   PORT EXATO de dashboard.html l.1304–1427 — mesma aritmética (LCG >>>0, seed 20260603)
   e mesma ORDEM de chamadas rnd(), para gerar registros idênticos aos do preview. */
(function genStudents() {
  let seed = 20260603;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
  const pad = (n: number | string) => String(n).padStart(2, '0');
  const shuffle = <T,>(a: T[]): T[] => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const GIRLS = ['Alice', 'Maria', 'Laura', 'Valentina', 'Heloísa', 'Júlia', 'Lívia', 'Cecília', 'Maitê', 'Antonella', 'Esther', 'Lorena', 'Sophia', 'Isadora', 'Luna', 'Maya', 'Elisa', 'Aurora', 'Clarice', 'Olívia', 'Beatriz', 'Catarina', 'Melissa', 'Yasmin', 'Stella', 'Rebeca', 'Agatha', 'Marina', 'Vitória', 'Ana Clara', 'Maria Eduarda', 'Ana Luísa', 'Manuela', 'Larissa', 'Bianca', 'Gabriela', 'Rafaela', 'Isabella', 'Emanuelly', 'Pietra', 'Milena', 'Eduarda', 'Sarah', 'Joana', 'Nicole', 'Mariah', 'Liz', 'Helena'];
  const BOYS = ['Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi', 'Théo', 'Gael', 'Ravi', 'Noah', 'Samuel', 'Benício', 'Benjamin', 'Matheus', 'Lucas', 'Pedro', 'Gustavo', 'Felipe', 'Nicolas', 'Caio', 'Vicente', 'Bryan', 'Enzo', 'Murilo', 'Lorenzo', 'Otávio', 'Augusto', 'Emanuel', 'João Pedro', 'João Miguel', 'Antônio', 'Francisco', 'Tomás', 'Rodrigo', 'Vinícius', 'Yuri', 'Ian', 'Levi', 'Anthony', 'Erick', 'Luan', 'Daniel', 'Rafael', 'Henrique', 'Eduardo', 'Isaac', 'Bento', 'Caleb', 'Davi Lucca'];
  const MOMS = ['Adriana', 'Aline', 'Amanda', 'Ana Paula', 'Bruna', 'Carla', 'Carolina', 'Cristiane', 'Daniela', 'Débora', 'Elaine', 'Fabiana', 'Fernanda', 'Flávia', 'Gisele', 'Ingrid', 'Janaína', 'Jéssica', 'Joyce', 'Juliana', 'Karina', 'Kelly', 'Luana', 'Luciana', 'Marcela', 'Márcia', 'Michele', 'Natália', 'Patrícia', 'Paula', 'Priscila', 'Raquel', 'Regina', 'Renata', 'Roberta', 'Rosana', 'Sabrina', 'Sílvia', 'Simone', 'Tatiana', 'Vanessa', 'Viviane'];
  const DADS = ['Alexandre', 'André', 'Antônio', 'Bruno', 'Carlos', 'César', 'Cristiano', 'Daniel', 'Diego', 'Eduardo', 'Fábio', 'Felipe', 'Fernando', 'Gustavo', 'Henrique', 'Hugo', 'Igor', 'João', 'Leandro', 'Leonardo', 'Marcelo', 'Márcio', 'Marcos', 'Murilo', 'Paulo', 'Rafael', 'Renato', 'Ricardo', 'Roberto', 'Rodrigo', 'Sérgio', 'Thiago', 'Vinícius', 'Wagner'];
  const GRANS = ['Maria José', 'Terezinha', 'Aparecida', 'Neusa', 'Marlene'];
  const SUR = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Mendes', 'Barros', 'Freitas', 'Barbosa', 'Pinto', 'Moura', 'Cavalcante', 'Dias', 'Castro', 'Campos', 'Cardoso', 'Teixeira', 'Correia', 'Vieira', 'Moreira', 'Cunha', 'Queiroz', 'Farias', 'Sales', 'Brito', 'Tavares', 'Aguiar', 'Siqueira', 'Xavier', 'Prado', 'Andrade', 'Nogueira', 'Rezende', 'Borges', 'Macedo', 'Pacheco'];
  const HOODS: [string, number][] = [['Setor Bueno', 14], ['Jardim Goiás', 10], ['Setor Marista', 8], ['Setor Sul', 7], ['Jardim América', 6], ['Setor Oeste', 5], ['Jardim Atlântico', 4], ['Setor Pedro Ludovico', 4], ['Setor Aeroporto', 3], ['Setor Campinas', 3], ['Parque Amazônia', 3], ['Setor Coimbra', 2], ['Vila Nova', 2], ['Setor Leste Universitário', 2], ['Jardim Europa', 2], ['Setor Faiçalville', 2], ['Setor Nova Suíça', 2], ['Residencial Granville', 1], ['Vila Jaraguá', 1], ['Setor dos Funcionários', 1]];
  const hoodPool: string[] = [];
  HOODS.forEach(([n, w]) => {
    for (let i = 0; i < w; i++) hoodPool.push(n);
  });
  const APARECIDA = ['Setor Garavelo', 'Jardim Luz', 'Cidade Vera Cruz'];
  const MAILS = ['@gmail.com', '@gmail.com', '@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

  const genCPF = () => {
    const n = [...Array(9)].map(() => int(0, 9));
    let d1 = n.reduce((a, v, i) => a + v * (10 - i), 0) % 11;
    d1 = d1 < 2 ? 0 : 11 - d1;
    let d2 = [...n, d1].reduce((a, v, i) => a + v * (11 - i), 0) % 11;
    d2 = d2 < 2 ? 0 : 11 - d2;
    const s = n.join('') + d1 + d2;
    return s.slice(0, 3) + '.' + s.slice(3, 6) + '.' + s.slice(6, 9) + '-' + s.slice(9);
  };
  const genPhone = () => `(62) 9${int(7, 9)}${int(0, 9)}${int(0, 9)}${int(0, 9)}-${int(0, 9)}${int(0, 9)}${int(0, 9)}${int(0, 9)}`;
  const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.');
  const genStreet = () => pick([`Rua T-${int(25, 68)}`, `Av. T-${int(1, 15)}`, `Rua C-${int(100, 260)}`, `Rua ${int(1, 150)}`, `Av. ${pick([85, 87, 90, 136])}`, `Rua ${int(1000, 1240)}`, 'Alameda das Rosas', 'Av. Rio Verde', 'Av. Mutirão', 'Rua das Orquídeas', 'Av. Perimetral Norte', 'Rua Serra Dourada', 'Av. Castelo Branco', 'Rua Buriti Alegre']);
  const genComp = () => {
    const r = rnd();
    return r < 0.32 ? `Apto ${int(1, 18)}0${int(1, 4)}` : r < 0.55 ? `Qd ${int(1, 40)} Lt ${int(1, 30)}` : r < 0.65 ? `Casa ${int(1, 3)}` : '';
  };
  const genBirth = (age: number) => {
    const m = int(1, 12), d = int(1, 28);
    const y = 2026 - age - (m * 100 + d <= 603 ? 0 : 1);
    return `${pad(d)}/${pad(m)}/${y}`;
  };
  /* horário de chegada da matrícula segue o gráfico (pico 19h–20h) — l.1333
     (no preview esta const local também se chama HORAS, sombreando a global) */
  const HORAS_W: [number, number][] = [[8, 1], [9, 3], [10, 6], [11, 4], [12, 2], [13, 3], [14, 7], [15, 5], [16, 4], [17, 6], [18, 8], [19, 11], [20, 13], [21, 9], [22, 4]];
  const horaPool: number[] = [];
  HORAS_W.forEach(([h, w]) => {
    for (let i = 0; i < w; i++) horaPool.push(h);
  });
  const genHora = () => `${pick(horaPool)}h${pad(int(0, 59))}`;

  interface FamMock {
    resp: Resp;
    second: Second | null;
    fin: string;
    addr: Addr;
    surA: string;
    surB: string;
  }
  const mkFamily = (): FamMock => {
    const surA = pick(SUR);
    let surB = pick(SUR);
    if (surB === surA) surB = pick(SUR);
    const rel = rnd(), isMom = rel < 0.78, isDad = !isMom && rel < 0.94;
    const respFirst = isMom ? pick(MOMS) : isDad ? pick(DADS) : pick(GRANS);
    const respRel = isMom ? 'Mãe' : isDad ? 'Pai' : pick(['Avó', 'Tia']);
    const resp: Resp = {
      n: `${respFirst} ${surB}${rnd() < 0.4 ? ' ' + surA : ''}`,
      cpf: genCPF(),
      phone: genPhone(),
      email: `${slug(respFirst)}.${slug(surB)}${rnd() < 0.25 ? int(2, 99) : ''}${pick(MAILS)}`,
      rel: respRel,
      b: genBirth(int(28, 46)),
    };
    const second: Second | null = rnd() < 0.55 ? { n: `${isMom ? pick(DADS) : pick(MOMS)} ${surA}`, phone: genPhone(), rel: isMom ? 'Pai' : 'Mãe' } : null;
    const inAparecida = rnd() < 0.05;
    const addr: Addr = {
      cep: `74${inAparecida ? 9 : int(0, 6)}${int(0, 9)}${int(0, 9)}-${int(1, 9)}${int(0, 9)}0`,
      street: genStreet(),
      num: String(int(15, 2400)),
      comp: genComp(),
      bairro: inAparecida ? pick(APARECIDA) : pick(hoodPool),
      city: inAparecida ? 'Aparecida de Goiânia' : 'Goiânia',
      uf: 'GO',
    };
    return { resp, second, fin: second && rnd() < 0.3 ? second.n : resp.n, addr, surA, surB };
  };
  /* idade coerente com o nível da turma onde o aluno caiu (l.1361) */
  const ageFor = (tid: number | null | undefined): number => {
    if (!tid) return int(5, 14);
    const nv = NIVEIS.find((n) => n.k === turmaById(tid)!.nivel)!;
    return int(nv.ages[0], nv.ages[1]);
  };
  const mkKid = (fam: FamMock, tid: number | null | undefined, age?: number): Kid => {
    const first = rnd() < 0.5 ? pick(GIRLS) : pick(BOYS);
    const a = age ?? ageFor(tid);
    return { n: `${first} ${fam.surB} ${fam.surA}`, age: a, b: genBirth(a), tid: tid ?? null };
  };

  /* lugares a preencher por turma (alunos ATIVOS gerados, já descontando os 14
     hand-written): fecha em 122 alunos em turma + 6 aguardando = 128 ativos.
     CHEIAS (7/7) com os hand-written: t4, t8 e t11. */
  const SEED_Q: Record<number, number> = { 1: 3, 2: 3, 3: 4, 4: 6, 5: 3, 6: 4, 7: 4, 8: 5, 9: 4, 10: 4, 11: 5, 12: 4, 13: 3, 14: 3, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4, 21: 3, 22: 3, 23: 4, 24: 3, 25: 4, 26: 3, 27: 3, 28: 4 }; // soma 106
  const slotPool: number[] = [];
  Object.entries(SEED_Q).forEach(([id, q]) => {
    for (let i = 0; i < q; i++) slotPool.push(+id);
  });
  shuffle(slotPool);

  /* datas seguem o gráfico de matrículas por mês (Jul/25 → Jun/26) */
  const MONTHS: [string, number, number][] = [['07', 2025, 13], ['08', 2025, 10], ['09', 2025, 8], ['10', 2025, 11], ['11', 2025, 9], ['12', 2025, 6], ['01', 2026, 10], ['02', 2026, 12], ['03', 2026, 10], ['04', 2026, 15], ['05', 2026, 7], ['06', 2026, 5]];
  const datePool: { m: string; y: number }[] = [];
  MONTHS.forEach(([m, y, q]) => {
    for (let i = 0; i < q; i++) datePool.push({ m, y });
  });
  const inactiveDates: { m: string; y: number }[] = [];
  for (let i = 19; i >= 0; i--) inactiveDates.push(datePool.splice(Math.min(i * 3, datePool.length - 1), 1)[0]);
  shuffle(datePool);
  const mkDate = ({ m, y }: { m: string; y: number }) =>
    `${pad(m === '06' && y === 2026 ? int(1, 3) : m === '05' && y === 2026 ? int(2, 26) : int(1, 28))}/${m}/${y}`;
  /* status seguem o funil do Autentique: recentes ainda no meio do fluxo; antigas quase
     todas assinadas — as poucas sent/viewed antigas são os contratos "parados" */
  const statusFor = ({ m, y }: { m: string; y: number }): ContractStatus =>
    y === 2026 && m === '06' ? pick<ContractStatus>(['pending', 'sent', 'sent', 'viewed', 'signed'])
      : y === 2026 && m === '05' ? pick<ContractStatus>(['sent', 'viewed', 'pending', 'signed', 'signed', 'signed'])
      : rnd() < 0.97 ? 'signed' : pick<ContractStatus>(['sent', 'viewed', 'pending']);

  let nextId = 100;
  /* 96 matrículas ativas: 81 de 1 aluno + 14 duplas de irmãos + 1 trio = 112 alunos.
     As datas vão em ordem: quando os lugares das turmas acabam, os ÚLTIMOS alunos
     (matrículas de Mai/Jun, maioria do 2026.2) ficam SEM TURMA → a fila "aguardando
     turma" nasce com gente de verdade, recém-matriculada. */
  const plans = shuffle([3, ...Array(14).fill(2) as number[], ...Array(81).fill(1) as number[]]);
  const dts = datePool.sort((a, b) => a.y * 100 + +a.m - (b.y * 100 + +b.m));
  const actives: Student[] = plans.map((nKids, i) => {
    const fam = mkFamily();
    const dt = dts[i];
    return {
      id: nextId++,
      kids: Array.from({ length: nKids }, () => mkKid(fam, slotPool.length ? slotPool.pop() : null)),
      resp: fam.resp,
      second: fam.second,
      fin: fam.fin,
      addr: fam.addr,
      pay: 'Boleto',
      status: statusFor(dt),
      media: rnd() >= 0.2,
      date: mkDate(dt),
      hora: genHora(),
    };
  });
  /* 5 famílias com matrículas separadas (mesmo responsável → agrupa e ganha badge de família) */
  for (let i = 0; i < 5; i++) {
    const a = actives[20 + i * 13], b = actives[26 + i * 13];
    b.resp = a.resp;
    b.second = a.second;
    b.fin = a.fin;
    b.addr = a.addr;
    /* sobrenome é sempre o par final do nome (primeiro nome pode ser composto, ex. João Pedro) */
    b.kids = b.kids.map((k) => {
      const first = k.n.split(' ').slice(0, -2).join(' ');
      const sur = a.kids[0].n.split(' ').slice(-2).join(' ');
      return { ...k, n: `${first} ${sur}` };
    });
  }

  /* 20 matrículas desligadas (22 alunos), com motivo registrado — guardam a turma
     onde estudavam (histórico), mas não contam na ocupação */
  const EX_NOTES: Record<ExitKey, string[]> = {
    adapt: ['Sentiu dificuldade com a dinâmica da turma.', ''],
    financial: ['Pediram para retornar no próximo semestre.', ''],
    competitor: ['Foram para uma escola bilíngue de período integral.', ''],
    moved: ['Família se mudou de bairro.', 'Mudança para Senador Canedo.'],
    schedule: ['Treinos de futebol passaram para o mesmo horário.', ''],
    completed: ['Encerrou o ciclo com avaliação excelente.', ''],
    other: ['Pausa por questões de saúde na família.', 'Foi morar com o pai em outro estado.', 'Vai estudar fora do país por um ano.'],
  };
  const inactives: Student[] = Array.from({ length: 20 }, (_, i) => {
    const fam = mkFamily();
    const tu = pick(TURMAS);
    const dt = inactiveDates[i];
    const reason = EXIT_REASONS[i % EXIT_REASONS.length];
    const nKids = i < 2 ? 2 : 1;
    return {
      id: nextId++,
      kids: Array.from({ length: nKids }, () => mkKid(fam, tu.id)),
      resp: fam.resp,
      second: fam.second,
      fin: fam.fin,
      addr: fam.addr,
      pay: 'Boleto',
      status: 'signed' as ContractStatus,
      media: rnd() >= 0.2,
      active: false,
      exit: { k: reason.k, label: reason.l, note: pick(EX_NOTES[reason.k]), date: `${pad(int(1, 28))}/${pad(int(2, 5))}/2026` },
      date: mkDate(dt),
      hora: genHora(),
    };
  });

  /* "na escola desde": quando o aluno ENTROU na escola — diferente da data da matrícula,
     que é só a última rematrícula. ~35% fica em branco de propósito: é assim que as
     matrículas importadas da planilha chegam (a planilha não tem essa coluna). */
  /* o semestre sempre começa em FEVEREIRO ou AGOSTO — o "desde" só cai nesses meses */
  const SEM_STARTS: Record<number, [string, string]> = { 2019: ['04/02/2019', '05/08/2019'], 2020: ['03/02/2020', '03/08/2020'], 2021: ['01/02/2021', '02/08/2021'], 2022: ['07/02/2022', '01/08/2022'], 2023: ['06/02/2023', '07/08/2023'], 2024: ['05/02/2024', '05/08/2024'], 2025: ['03/02/2025', '04/08/2025'], 2026: ['02/02/2026', '03/08/2026'] };
  [...actives, ...inactives].forEach((s) => {
    const r = rnd();
    if (r < 0.35) return; // sem registro (fica "—" na lista)
    const [, m, y] = s.date.split('/').map(Number);
    if (r < 0.62) {
      // novato: entrou no semestre da matrícula
      if (y === 2026 && m >= 5) return; // 2026.2 ainda nem começou → em branco
      s.since = SEM_STARTS[y][m >= 5 ? 1 : 0];
      return;
    }
    const y2 = Math.max(2019, y - int(1, 6)); // veterano: até 6 anos de casa
    s.since = y2 >= y ? SEM_STARTS[y][0] : pick(SEM_STARTS[y2]);
  });

  STUDENTS.push(...actives, ...inactives);
  const dv = (s: Student) => s.date.split('/').reverse().join('') + (s.hora || '');
  STUDENTS.sort((a, b) => (dv(a) < dv(b) ? 1 : dv(a) > dv(b) ? -1 : 0)); // mais recentes primeiro
})();

/* ====================== NOTIFICAÇÕES (port l.1695) ====================== */
export const NOTIFS: Notif[] = [
  { type: 'stale',    sid: 12,   title: 'Contrato parado há 13 dias',  desc: 'Gabriel Fonseca Lopes — visualizado e sem assinatura', time: 'hoje, 8h00', unread: true },
  { type: 'rejected', sid: 7,    title: 'Contrato recusado',           desc: 'Davi Cardoso Melo — a família não aceitou; precisa de ação', time: 'hoje, 9h20', unread: true },
  { type: 'failed',   sid: 8,    title: 'Falha no envio do contrato',  desc: 'Manuela e Pedro Teixeira Gomes — link não foi entregue; reenviar', time: 'ontem', unread: true },
  { type: 'enroll',   sid: 1,    title: 'Nova matrícula',              desc: 'Helena Duarte Lima · Setor Bueno', time: 'há 2 horas', unread: true },
  { type: 'viewed',   sid: 4,    title: 'Contrato visualizado',        desc: 'Sofia Mendes Castro — a família abriu o link, falta assinar', time: 'ontem', unread: true },
  { type: 'enroll',   sid: 2,    title: 'Nova matrícula (2 irmãos)',   desc: 'Théo e Lara Andrade Rocha · Jardim Goiás', time: 'ontem', unread: true },
  { type: 'enroll',   sid: 3,    title: 'Nova matrícula',              desc: 'Miguel Ferreira Souza · Setor Sul', time: 'há 3 dias', unread: true },
  { type: 'signed',   sid: 6,    title: 'Contrato assinado',           desc: 'Alice Barbosa Nunes — registrado sozinho pelo Autentique', time: 'há 4 dias', unread: true },
  { type: 'email',    sid: null, title: 'Disparo concluído',           desc: '"Boas-vindas — turma de junho" · 21 enviados', time: 'há 5 dias', unread: false },
];

/* ====================== USUÁRIOS DO PAINEL (port l.2351) ====================== */
export const USERS: User[] = [
  { id: 1, n: 'Priscylla Martins', e: 'priscylla@englishpatio.com.br', r: 'Diretor', c: '#1E3765', last: 'hoje, 8h47' },
  { id: 2, n: 'Gabriel Teles', e: 'gabriel@englishpatio.com.br', r: 'Diretor', c: '#2F539A', last: 'ontem, 22h10' },
  { id: 3, n: 'Camila Nogueira', e: 'camila@englishpatio.com.br', r: 'Supervisor', c: '#C2410C', last: 'ontem, 10h48' },
  { id: 4, n: 'Stefany Oliveira', e: 'stefany@englishpatio.com.br', r: 'Secretaria', c: '#B5860B', last: 'hoje, 9h40' },
  { id: 5, n: 'Beatriz Souza', e: 'beatriz@englishpatio.com.br', r: 'Secretaria', c: '#0d9488', last: 'ontem, 11h26' },
];
export const userById = (id: number): User | undefined => USERS.find((u) => u.id === id);

/* ====================== REGISTRO DE ATIVIDADES (port l.2402–2430) ======================
   Pessoas, o Sistema (rotinas automáticas) e o Autentique (webhook de assinatura).
   Não se edita nem se apaga. */
export const ACT_ACTORS: Record<string, ActActor> = {
  'Priscylla Martins': { role: 'Diretor',            c: '#1E3765' },
  'Gabriel Teles':     { role: 'Diretor',            c: '#2F539A' },
  'Camila Nogueira':   { role: 'Supervisor',         c: '#C2410C' },
  'Stefany Oliveira':  { role: 'Secretaria',         c: '#B5860B' },
  'Beatriz Souza':     { role: 'Secretaria',         c: '#0d9488' },
  'Sistema':           { role: 'Automático',         c: '#64748B', ic: 'zap' },
  'Autentique':        { role: 'Assinatura digital', c: '#7C3AED', ic: 'pen-line' },
};
export const ACTIVITY: ActEntry[] = [
  { who: 'Sistema',           a: 'Avisou: contrato de <b>Gabriel Fonseca Lopes</b> parado há 13 dias sem assinatura', t: '8h00', day: 'Hoje' },
  { who: 'Stefany Oliveira',  a: 'Moveu <b>Sofia Mendes Castro</b> de Green Room · Ter/Qui 09:30 para <b>Green Room · Ter/Qui 14:30</b> (Conversation 3)', t: '9h40', day: 'Hoje' },
  { who: 'Stefany Oliveira',  a: 'Cobrou a assinatura de <b>Davi Cardoso Melo</b> pelo WhatsApp', t: '9h12', day: 'Hoje' },
  { who: 'Stefany Oliveira',  a: 'Exportou o pacote de imagens da agenda (9 salas · Seg/Qua)', t: '15h20', day: 'Ontem' },
  { who: 'Priscylla Martins', a: 'Entrou no painel', t: '8h47', day: 'Hoje' },
  { who: 'Autentique',        a: 'Registrou a assinatura de <b>Helena Duarte Lima</b> — contrato concluído e painel atualizado', t: '10h02', day: 'Hoje' },
  { who: 'Autentique',        a: 'Registrou que a família de <b>Sofia Mendes Castro</b> visualizou o contrato', t: '14h31', day: 'Ontem' },
  { who: 'Sistema',           a: 'Enviou o contrato de <b>Helena Duarte Lima</b> ao Autentique — link entregue por WhatsApp e e-mail', t: '20h14', day: 'Ontem' },
  { who: 'Beatriz Souza',     a: 'Exportou a planilha de alunos (130 matrículas)', t: '11h26', day: 'Ontem' },
  { who: 'Camila Nogueira',   a: 'Criou a turma <b>Power 4 · Mint Room · Seg/Qua 16:45</b>', t: '10h48', day: 'Ontem' },
  { who: 'Priscylla Martins', a: 'Editou os dados da matrícula de <b>Théo e Lara Andrade Rocha</b>', t: '10h05', day: 'Ontem' },
  { who: 'Priscylla Martins', a: 'Enviou o comunicado <b>"Boas-vindas — turma de junho"</b> para 21 famílias', t: '16h40', day: '01/06/2026' },
  { who: 'Stefany Oliveira',  a: 'Marcou o contrato de <b>Bernardo Pires Alves</b> como assinado (carnê entregue na recepção)', t: '14h18', day: '01/06/2026' },
  { who: 'Priscylla Martins', a: 'Importou a planilha de matrículas — 4 novas, 2 repetidas ignoradas', t: '9h33', day: '01/06/2026' },
  { who: 'Priscylla Martins', a: 'Desligou <b>Arthur Moraes Pinto</b> — motivo: questões financeiras', t: '15h02', day: '30/05/2026' },
  { who: 'Autentique',        a: 'Entregou o link de assinatura de <b>Sofia Mendes Castro</b> no WhatsApp', t: '21h47', day: '29/05/2026' },
  { who: 'Gabriel Teles',     a: 'Definiu <b>"Contrato 2026.2 — Presencial"</b> como modelo em uso', t: '10h20', day: '12/05/2026' },
  { who: 'Priscylla Martins', a: 'Convidou <b>Beatriz Souza</b> (Secretaria) para o painel', t: '9h05', day: '12/05/2026' },
];

/* ====================== SALAS & TEACHERS (port l.3156–3160) ====================== */
export const SALA_COLORS = ['#7CB342', '#D9B777', '#F2997A', '#8E5AC8', '#4A7FD4', '#F08A3C', '#4DB89E', '#E8B931', '#E0606E', '#B9A189', '#E26D9F', '#31B5C4', '#A78BDB'];
/* registro de teachers (inclui quem está sem sala) — no preview era lazy
   (let TEACHERS=null + ensureTeachers(), l.3158–3159); aqui já nasce inicializado
   com o mesmo resultado: nomes únicos das salas com prof, em ordem alfabética. */
export const TEACHERS: string[] = [...new Set(SALAS.filter((s) => s.prof).map((s) => s.prof as string))].sort();
export function teacherAlunos(name: string): number {
  let n = 0;
  SALAS.filter((s) => s.prof === name).forEach((s) =>
    TURMAS.filter((t) => t.sala === s.id).forEach((t) => (n += activeKidsIn(t.id)))
  );
  return n;
}

/* ====================== GRÁFICOS — dados por período (port l.3848) ====================== */
export const PERIOD_DATA: Record<'6m' | 'ano' | 'mes', PeriodData> = {
  '6m':  { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'], data: [8, 11, 9, 14, 17, 21], rema: [3, 2, 4, 5, 9, 14], sub: 'Evolução no semestre', chip: '↑ 38%' },
  'ano': { labels: ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'], data: [12, 9, 7, 10, 8, 5, 8, 11, 9, 14, 17, 21], rema: [10, 6, 4, 5, 3, 2, 3, 2, 4, 5, 9, 14], sub: 'Últimos 12 meses (Jul/25 – Jun/26)', chip: '↑ 24%' },
  'mes': { labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'], data: [4, 6, 7, 4], rema: [3, 4, 5, 2], sub: 'Junho, semana a semana', chip: '↑ 18%' },
};

/* ====================== MODELOS DE COMUNICADO (port l.4443) ====================== */
export const EMAIL_TPLS: EmailTpl[] = [
  { k: 'recesso',  l: 'Recesso / Vacation Classes', ic: 'sun',        col: '#F5B700', s: 'Recesso de julho — Vacation Classes 📅', b: 'Olá, {{nome_responsavel}}!\n\nPassando para lembrar que em julho acontecem as Vacation Classes: as mensalidades do mês são convertidas integralmente em vivências divertidas e imersivas.\n\nEm breve mandamos a programação completa. Qualquer dúvida, é só responder este e-mail!\n\nAbraços,\nEquipe English Patio' },
  { k: 'contrato', l: 'Lembrete de contrato',       ic: 'file-clock', col: '#B5860B', s: 'Falta pouco: contrato de {{nome_aluno}}', b: 'Olá, {{nome_responsavel}}!\n\nNotamos que o contrato de {{nome_aluno}} ainda está aguardando assinatura. É rapidinho — qualquer dificuldade, respondemos por aqui ou pelo WhatsApp da escola.\n\nAbraços,\nEquipe English Patio' },
  { k: 'aviso',    l: 'Comunicado geral',           ic: 'megaphone',  col: '#2F539A', s: 'Comunicado — English Patio', b: 'Olá, {{nome_responsavel}}!\n\n[Escreva aqui o seu recado]\n\nAbraços,\nEquipe English Patio' },
];
export const emailTplBy = (k: string): EmailTpl | undefined => EMAIL_TPLS.find((t) => t.k === k);

/* ====================== IMPORTAÇÃO — planilha de exemplo (port l.4766) ====================== */
export const IMPORT_SAMPLE = [
  'Data/Hora,Nome Aluno 1,Data Nasc. Aluno 1,Idade Aluno 1,Nome Aluno 2,Data Nasc. Aluno 2,Idade Aluno 2,Responsável Legal,CPF Responsável,Telefone Responsável,Email Responsável,Parentesco,Data Nasc. Responsável,Segundo Responsável,Tel. Segundo Responsável,Parentesco 2º Resp.,CPF Segundo Responsável,Responsável Financeiro,CPF Responsável Financeiro,CEP,Endereço Completo,Bairro,Cidade,Estado,Formato Aula,Forma Pagamento,Autorização Mídia,Autorização Contrato,Horário Confirmado,Link PDF Contrato',
  '15/05/2026 19:42:10,Maria Fernanda Sousa Cardoso,12/03/2017,9,-,-,-,Juliana Sousa,389.214.557-10,(62) 99318-2244,juliana.sousa@gmail.com,Mãe,04/08/1988,Carlos Cardoso,(62) 98551-7733,Pai,521.336.904-92,Juliana Sousa,389.214.557-10,74333-120,"Rua C-205, 142 - Apto 301",Jardim América,Goiânia,GO,Presencial na Sede,Boleto,Sim,Sim,Sim,https://drive.google.com/file/d/abc123',
  '16/05/2026 10:08:55,Otto Faria Neves,22/09/2018,7,Igor Faria Neves,14/01/2016,10,Camila Faria,654.880.123-70,(62) 99662-8800,camila.faria@hotmail.com,Mãe,19/02/1990,-, -,-,-,Camila Faria,654.880.123-70,74455-200,"Av. T-7, 988",Setor Oeste,Goiânia,GO,Presencial na Sede,Boleto,Não,Sim,Sim,https://drive.google.com/file/d/def456',
  '16/05/2026 21:30:02,Maria Fernanda Sousa Cardoso,12/03/2017,9,-,-,-,Juliana Sousa,389.214.557-10,(62) 99318-2244,juliana.sousa@gmail.com,Mãe,04/08/1988,Carlos Cardoso,(62) 98551-7733,Pai,521.336.904-92,Juliana Sousa,389.214.557-10,74333-120,"Rua C-205, 142 - Apto 301",Jardim América,Goiânia,GO,Presencial na Sede,Boleto,Sim,Sim,Sim,https://drive.google.com/file/d/zzz999',
  '17/05/2026 08:21:14,Otto Faria Neves,22/09/2018,7,Igor Faria Neves,14/01/2016,10,Camila Faria,654.880.123-70,(62) 99662-8801,camila.faria@hotmail.com,Mãe,19/02/1990,-, -,-,-,Camila Faria,654.880.123-70,74455-200,"Av. T-7, 988",Setor Oeste,Goiânia,GO,Presencial na Sede,Boleto,Não,Sim,Sim,https://drive.google.com/file/d/def457',
  '18/05/2026 14:12:40,Larissa Prado Gonçalves,30/06/2015,10,-,-,-,Renato Gonçalves,112.774.469-03,(62) 98123-9050,renato.goncalves@outlook.com,Pai,11/11/1984,-,-,-,-,Renato Gonçalves,112.774.469-03,74140-070,"Rua 56, 75",Setor Marista,Goiânia,GO,Presencial na Sede,Boleto,Sim,Sim,Sim,https://drive.google.com/file/d/ghi789',
  '19/05/2026 16:02:09,Alice Barbosa Nunes,03/05/2017,9,-,-,-,Fernanda Almeida,512.667.039-50,(62) 99812-7745,fernanda.almeida@gmail.com,Mãe,22/09/1991,-,-,-,-,Fernanda Almeida,512.667.039-50,74230-200,"Rua T-36, 410",Setor Bueno,Goiânia,GO,Presencial na Sede,Boleto,Sim,Sim,Sim,https://drive.google.com/file/d/pqr678',
  '02/06/2026 20:14:33,Helena Duarte Lima,14/02/2018,8,-,-,-,Mariana Duarte Lima,047.812.336-19,(62) 99214-8870,mariana.duarte@gmail.com,Mãe,09/05/1989,Rafael Lima,(62) 98112-4471,Pai,-,Mariana Duarte Lima,047.812.336-19,74230-110,"Rua T-55, 180 - Apto 902",Setor Bueno,Goiânia,GO,Presencial na Sede,Boleto,Sim,Sim,Sim,https://drive.google.com/file/d/jkl012',
  '20/05/2026 09:45:21,Benjamin Castro Moura,08/12/2019,6,-,-,-,Paula Castro,778.290.541-93,(62) 99770-1188,paula.castro@gmail.com,Mãe,25/06/1993,-,-,-,-,Paula Castro,778.290.541-93,74810-330,"Av. 136, 1020",Setor Sul,Goiânia,GO,Presencial na Sede,Boleto,Não,Sim,Sim,https://drive.google.com/file/d/mno345',
  '21/05/2026 11:34:55,Vicente Sales Ramos,17/03/2016,10,-,-,-,Tatiane Sales,12345678900,62 9812,tatiane.sales@gmail.com,Mãe,02/05/1989,-,-,-,-,Tatiane Sales,12345678900,74140-010,"Rua 56, 120",Setor Marista,Goiânia,GO,Presencial na Sede,Boleto,Sim,Sim,Sim,https://drive.google.com/file/d/stu901',
].join('\n');

/* ====================== MODELOS DE CONTRATO (port l.5015–5028) ======================
   Os campos da matrícula são carimbados no PDF em posições fixas (como o site faz
   hoje com o pdf-lib); x/y em % da página. */
export const TPL_FIELDS: TplField[] = [
  { k: 'resp-nome',   label: 'Nome do responsável',   src: 'Matrícula → responsável legal',        page: 1, x: 34, y: 22 },
  { k: 'resp-cpf',    label: 'CPF do responsável',    src: 'Matrícula → CPF do responsável',       page: 1, x: 72, y: 22 },
  { k: 'resp-end',    label: 'Endereço completo',     src: 'Matrícula → rua, número, bairro',      page: 1, x: 42, y: 30 },
  { k: 'resp-tel',    label: 'Telefone',              src: 'Matrícula → telefone do responsável',  page: 1, x: 74, y: 38 },
  { k: 'alunos',      label: 'Nome do(s) aluno(s)',   src: 'Matrícula → aluno 1 (e aluno 2)',      page: 1, x: 36, y: 47 },
  { k: 'formato',     label: 'Checkbox do formato',   src: 'Fixo → Presencial na Sede',            page: 2, x: 26, y: 36 },
  { k: 'autorizacao', label: 'Autorização de imagem', src: 'Matrícula → uso de imagem (checkbox)', page: 4, x: 32, y: 34 },
  { k: 'data',        label: 'Data da assinatura',    src: 'Gerada no dia da matrícula',           page: 4, x: 38, y: 76 },
];
export const TEMPLATES: Template[] = [
  { id: 1, name: 'Contrato 2026.2 — Presencial',    file: 'contrato-2026-2.pdf', size: '248 KB', pages: 4, by: 'Priscylla Martins', date: '12/05/2026', active: true,  fields: TPL_FIELDS.map((f) => ({ ...f, mapped: true })) },
  { id: 2, name: 'Contrato 2026.1',                 file: 'contrato-2026-1.pdf', size: '241 KB', pages: 4, by: 'Priscylla Martins', date: '02/12/2025', active: false, fields: TPL_FIELDS.map((f) => ({ ...f, mapped: true })) },
  { id: 3, name: 'Contrato 2025.2 (layout antigo)', file: 'contrato-2025-2.pdf', size: '236 KB', pages: 4, by: 'Gabriel Teles',     date: '01/07/2025', active: false, fields: TPL_FIELDS.map((f) => ({ ...f, mapped: f.k !== 'resp-end' && f.k !== 'autorizacao' })) },
];
export const tplById = (id: number): Template | undefined => TEMPLATES.find((t) => t.id === id);
export const unmappedCount = (t: Template): number => t.fields.filter((f) => !f.mapped).length;

/* texto fake das páginas do PDF no mapeamento (port l.5205) — html estático do preview */
export const TPL_PAGE_TEXT: Record<number, string> = {
  1: `<p class="text-center font-bold text-[11px] mb-3">CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</p>
     <p><strong>CONTRATADA:</strong> ENGLISH PATIO LTDA, escola de idiomas com sede em Goiânia/GO.</p>
     <p class="mt-2"><strong>CONTRATANTE:</strong> ______________________________ , CPF ______________ , residente em _________________________________________ , tel. ______________ .</p>
     <p class="mt-2"><strong>ALUNO(S):</strong> ______________________________________________</p>
     <p class="mt-3 text-slate-400"><strong>DAS MENSALIDADES.</strong> O pagamento dar-se-á por meio de boleto bancário emitido pela contratada; um carnê físico será entregue ao responsável no ato da matrícula, com 6 parcelas.</p>
     <p class="mt-2 text-slate-400"><strong>DA VIGÊNCIA.</strong> O presente contrato terá vigência de 6 (seis) meses…</p>`,
  2: `<p class="text-center font-bold text-[11px] mb-3">CLÁUSULA 4ª — DO FORMATO DAS AULAS</p>
     <p class="text-slate-400">As aulas serão ministradas no formato assinalado abaixo:</p>
     <p class="mt-3"><span class="inline-block w-3 h-3 border border-slate-400 rounded-sm align-middle"></span> Presencial na Sede</p>
     <p class="mt-4 text-slate-400">Parágrafo único: o material didático…</p>`,
  4: `<p class="text-center font-bold text-[11px] mb-3">AUTORIZAÇÕES E ASSINATURAS</p>
     <p><span class="inline-block w-3 h-3 border border-slate-400 rounded-sm align-middle"></span> Autorizo o uso de imagem do(s) aluno(s) nas redes da escola.</p>
     <p class="mt-6 text-slate-400">E por estarem justos e contratados, firmam o presente.</p>
     <p class="mt-4">Goiânia, ______ de ______________ de ________.</p>
     <div class="grid grid-cols-2 gap-4 mt-6 text-center text-[9px]"><div class="border-t border-slate-300 pt-1">Contratante</div><div class="border-t border-slate-300 pt-1">ENGLISH PATIO LTDA</div></div>`,
};
