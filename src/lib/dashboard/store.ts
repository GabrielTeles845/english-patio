/* =========================================================================
   Store da dashboard — reatividade mínima sobre os dados mock de ./data.

   Mesmo padrão mutável do preview (dashboard.html): as ações mutam os arrays
   exportados por ./data e chamam bump(); as telas chamam useDash() para
   re-renderizar (useSyncExternalStore devolvendo um número de versão).
   As REGRAS de negócio das ações são as do preview (linhas citadas); a
   validação de FORMATO de campo (CPF, e-mail, avisos de 2º clique…) fica na
   camada de UI, como lá. Mensagens de erro copiadas verbatim (podem conter
   <b> — a tela decide como renderizar).
   ========================================================================= */

import { useSyncExternalStore } from 'react';
import type { ContractStatus } from './status';
import {
  ACTIVITY,
  type Addr,
  EXIT_REASONS,
  type ExitKey,
  type Kid,
  kidTurma,
  NOTIFS,
  type Par,
  type Resp,
  SALA_COLORS,
  SALAS,
  type Second,
  slugify,
  STUDENTS,
  TEACHERS,
  TURMAS,
  turmaAt,
  turmaById,
  turmaFull,
  type User,
  type UserRole,
  USERS,
  activeKidsIn,
  badChars,
  nrmName,
  salaById,
  schLabel,
  takeTurmaId,
} from './data';

/* ====================== ASSINATURA / VERSÃO ====================== */

let version = 0;
const listeners = new Set<() => void>();

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/* notifica todo mundo que os dados mudaram (equivale aos refreshAll() do preview) */
export function bump(): void {
  version++;
  listeners.forEach((fn) => fn());
}

const getSnapshot = () => version;

/* hook das telas: const v = useDash(); — re-renderiza a cada bump() */
export function useDash(): number {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/* ====================== RESULTADO DAS AÇÕES ====================== */

export type ActionResult = { ok: true } | { ok: false; error: string };
const OK: ActionResult = { ok: true };
const fail = (error: string): ActionResult => ({ ok: false, error });

/* ====================== REGISTRO DE ATIVIDADES ====================== */

/* port de logAct (l.2431): unshift com t:'agora', day:'Hoje'. O `who` vem da
   sessão (no preview era a pessoa simulada pelo "ver painel como…"). */
export function logAct(who: string, html: string): void {
  ACTIVITY.unshift({ who, a: html, t: 'agora', day: 'Hoje' });
  bump();
}

/* ====================== ALOCAÇÃO DE ALUNO EM TURMA ====================== */

/* port de confirmMoverKid (l.2996) + confirmFullAlloc (l.2986).
   tid null = tira da turma (volta para a fila "aguardando turma").
   abrirVagaExtra: turma cheia ganha +1 de cap (8–9) antes de alocar — o
   fluxo "Abrir vaga e alocar" do preview. */
export function allocateKid(
  sid: number,
  ki: number,
  tid: number | null,
  opts?: { abrirVagaExtra?: boolean }
): ActionResult {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  const k = s.kids[ki];
  if (!k) return fail('Aluno não encontrado.');
  if (tid !== null) {
    const t = turmaById(tid);
    if (!t) return fail('Turma não encontrada.');
    if (turmaFull(t)) {
      if (!opts?.abrirVagaExtra) return fail('Essa turma lotou agorinha — escolha outra.');
      t.cap += 1; // vaga extra (l.2990) — cap pode passar de 7 só por aqui
    }
    k.tid = t.id;
  } else {
    k.tid = null;
  }
  bump();
  return OK;
}

/* ====================== CRUD DE TURMA ====================== */

export interface TurmaInput {
  sala: string;
  par: Par;
  hora: string;
  nivel: string;
  cap: number;
}

/* port de agSaveTurma (l.3055): cap 1..7 na criação, slot (sala+par+hora) único */
export function addTurma(input: TurmaInput): ActionResult & { id?: number } {
  const { sala, par, hora, nivel, cap } = input;
  if (!(cap >= 1 && cap <= 7)) return fail('Vagas entre 1 e 7 — o padrão da escola é 7.');
  if (turmaAt(sala, par, hora))
    return fail(`A ${salaById(sala)!.n} já tem turma ${schLabel(par)} às ${hora} — escolha outro horário ou outra sala.`);
  const id = takeTurmaId();
  TURMAS.push({ id, sala, par, hora, nivel, cap });
  bump();
  return { ok: true, id };
}

/* port de agUpdateTurma (l.3110): teto = max(7, cap atual — turma com vaga extra),
   cap nunca menor que a ocupação, slot continua único. (O aviso de mudar o nível
   de turma com alunos é o 2º clique da UI.) */
export function updateTurma(tid: number, input: TurmaInput): ActionResult {
  const t = turmaById(tid);
  if (!t) return fail('Turma não encontrada.');
  const occ = activeKidsIn(tid);
  const { sala, par, hora, nivel, cap } = input;
  const maxCap = Math.max(7, t.cap);
  if (!(cap >= 1 && cap <= maxCap))
    return fail(`Vagas entre 1 e ${maxCap}${maxCap > 7 ? ' (esta turma tem vaga extra aberta)' : ''} — o padrão da escola é 7.`);
  if (cap < occ)
    return fail(`A turma tem ${occ} aluno${occ > 1 ? 's' : ''} — a capacidade não pode ficar menor que isso.`);
  const clash = turmaAt(sala, par, hora);
  if (clash && clash.id !== tid) return fail(`A ${salaById(sala)!.n} já tem turma ${schLabel(par)} às ${hora}.`);
  Object.assign(t, { sala, par, hora, nivel, cap });
  bump();
  return OK;
}

/* port de agDeleteTurma/confirmAgDeleteTurma (l.3130/3145): só turma vazia */
export function deleteTurma(tid: number): ActionResult {
  const i = TURMAS.findIndex((t) => t.id === tid);
  if (i < 0) return fail('Turma não encontrada.');
  if (activeKidsIn(tid) > 0) return fail('Só turmas vazias podem ser excluídas — mova os alunos antes.');
  TURMAS.splice(i, 1);
  bump();
  return OK;
}

/* ====================== CRUD DE SALA ====================== */

/* port de smAddSala (l.3231): nome único, sem badChars, cor livre da paleta */
export function addSala(n: string): ActionResult & { id?: string } {
  if (!n.trim()) return fail('A sala precisa de um nome.');
  n = n.trim();
  if (badChars(n)) return fail('O nome da sala não pode ter sinais de maior/menor, aspas ou & — use só letras e números.');
  if (SALAS.some((s) => s.n.toLowerCase() === n.toLowerCase())) return fail('Já existe uma sala com esse nome.');
  let id = slugify(n);
  while (SALAS.some((s) => s.id === id)) id += '-2';
  const usadas = new Set(SALAS.map((s) => s.c));
  const cor = SALA_COLORS.find((c) => !usadas.has(c)) || SALA_COLORS[SALAS.length % SALA_COLORS.length];
  SALAS.push({ id, n, c: cor, prof: null });
  bump();
  return { ok: true, id };
}

/* port de saveSala (l.3326): nome obrigatório/único, sem badChars; cor opcional */
export function updateSala(id: string, input: { n: string; c?: string }): ActionResult {
  const s = salaById(id);
  if (!s) return fail('Sala não encontrada.');
  const n = input.n.trim();
  if (!n) return fail('A sala precisa de um nome.');
  if (badChars(n)) return fail('O nome da sala não pode ter sinais de maior/menor, aspas ou & — use só letras e números.');
  if (SALAS.some((x) => x.id !== id && x.n.toLowerCase() === n.toLowerCase()))
    return fail(`Já existe uma sala chamada <b>${n}</b>.`);
  s.n = n;
  if (input.c) s.c = input.c;
  bump();
  return OK;
}

/* port de smRemoveSala/confirmSmRemoveSala (l.3245/3262): só sala sem turmas;
   o teacher da sala (se tiver) volta para o cadastro como "sem sala" */
export function deleteSala(id: string): ActionResult {
  const s = salaById(id);
  if (!s) return fail('Sala não encontrada.');
  if (TURMAS.some((t) => t.sala === id)) return fail('Essa sala tem turmas — mova ou exclua as turmas antes.');
  if (s.prof && !TEACHERS.includes(s.prof)) TEACHERS.push(s.prof);
  SALAS.splice(SALAS.findIndex((x) => x.id === id), 1);
  bump();
  return OK;
}

/* ====================== TEACHERS (aba do modal "Salas & teachers") ====================== */

/* port de smAddTeacher (l.3271): nome único, sem badChars; entra "sem sala" */
export function addTeacher(n: string): ActionResult {
  n = n.trim();
  if (!n) return fail('O teacher precisa de um nome.');
  if (badChars(n)) return fail('O nome do teacher não pode ter sinais de maior/menor, aspas ou & — use só letras.');
  if (TEACHERS.some((t) => t.toLowerCase() === n.toLowerCase())) return fail('Esse teacher já está cadastrado.');
  TEACHERS.push(n);
  TEACHERS.sort();
  bump();
  return OK;
}

/* port de smAssignTeacher (l.3218): cada teacher tem no máx. 1 sala; quem é
   deslocado da sala vira "sem sala". salaId '' = tirar da sala. */
export function assignTeacher(name: string, salaId: string | ''): ActionResult {
  if (!TEACHERS.includes(name)) return fail('Teacher não encontrado.');
  const old = SALAS.find((s) => s.prof === name);
  if (old) old.prof = null;
  if (salaId) {
    const sala = salaById(salaId);
    if (!sala) return fail('Sala não encontrada.');
    if (sala.prof && sala.prof !== name && !TEACHERS.includes(sala.prof)) TEACHERS.push(sala.prof); // quem sai vira "sem sala"
    sala.prof = name;
  }
  bump();
  return OK;
}

/* port de confirmSmRemoveTeacher (l.3298): a sala dele (se tiver) fica sem teacher */
export function removeTeacher(name: string): ActionResult {
  const i = TEACHERS.indexOf(name);
  if (i < 0) return fail('Teacher não encontrado.');
  const sala = SALAS.find((s) => s.prof === name);
  if (sala) sala.prof = null;
  TEACHERS.splice(i, 1);
  bump();
  return OK;
}

/* ====================== MATRÍCULAS — CRUD ====================== */

export interface NewStudentInput {
  name: string;
  age: number;
  b: string;
  resp: string;
  cpf: string;
  phone: string;
  email: string;
  hood: string;
  tid: number | null;
}

/* port de submitNewEnrollment (l.4037, só a parte de dados): bloqueia matrícula
   duplicada (mesmo aluno + mesmo responsável) e turma que lotou no meio do
   caminho; defaults iguais aos do preview (l.4072–4078). Formato dos campos e
   avisos de 2º clique (CPF de outro nome, homônimo, idade × nível) são da UI. */
export function addStudent(input: NewStudentInput): (ActionResult & { id?: number }) {
  const { name, age, b, resp, cpf, phone, email, hood, tid } = input;
  const dup = STUDENTS.find(
    (s) => s.kids.some((k) => nrmName(k.n) === nrmName(name)) && nrmName(s.resp.n) === nrmName(resp)
  );
  if (dup)
    return fail(`<b>${name}</b> já tem matrícula com esse responsável — use ⋮ → Editar dados na existente em vez de criar outra.`);
  if (tid) {
    const t = turmaById(tid);
    if (!t || turmaFull(t))
      return fail('A turma escolhida lotou agorinha — escolha outra ou deixe "Sem turma" para alocar depois.');
  }
  const id = Math.max(...STUDENTS.map((s) => s.id)) + 1;
  STUDENTS.unshift({
    id,
    kids: [{ n: name, age, b, tid }],
    resp: { n: resp, cpf, phone, email, rel: 'Responsável', b: '—' },
    second: null,
    fin: resp,
    addr: { cep: '74000-000', street: '—', num: '', comp: '', bairro: hood, city: 'Goiânia', uf: 'GO' },
    pay: 'Boleto',
    status: 'pending',
    media: true,
    active: true,
    date: '03/06/2026', // "hoje" do preview
    hora: '16h05',
  });
  NOTIFS.unshift({ type: 'enroll', sid: id, title: 'Nova matrícula', desc: `${name} · ${hood}`, time: 'agora', unread: true });
  bump();
  return { ok: true, id };
}

export interface StudentPatch {
  kids?: Kid[];
  resp?: Resp;
  second?: Second | null;
  fin?: string;
  media?: boolean;
  addr?: Addr;
  since?: string; // '' ou undefined com a chave presente = remover (l.4266)
}

/* port de saveEditEnrollment (l.4194, só a parte de dados): aplica o patch e
   guarda a regra de vagas — dois irmãos não ocupam a mesma última vaga nem
   entram em turma cheia (delta por turma, l.4236–4242). */
export function updateStudent(sid: number, patch: StudentPatch): ActionResult {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  if (patch.kids && s.active !== false) {
    const delta: Record<number, number> = {};
    patch.kids.forEach((kv, i) => {
      const prev = s.kids[i]?.tid ?? null;
      if (prev !== kv.tid) {
        if (kv.tid) delta[kv.tid] = (delta[kv.tid] || 0) + 1;
        if (prev) delta[prev] = (delta[prev] || 0) - 1;
      }
    });
    for (const [ts, n] of Object.entries(delta)) {
      if (n <= 0) continue;
      const t = turmaById(+ts);
      if (!t) continue;
      const livre = t.cap - activeKidsIn(t.id);
      if (n > livre)
        return fail(
          `A turma ${salaById(t.sala)!.n.replace(' Room', '')} · ${schLabel(t.par)} ${t.hora} não tem vaga suficiente (${livre > 0 ? `só ${livre} livre${livre > 1 ? 's' : ''}` : 'está cheia'}) para ${n > 1 ? 'os ' + n + ' alunos' : 'este aluno'} — escolha outra ou abra vaga extra pela Agenda.`
        );
    }
  }
  if (patch.kids) s.kids = patch.kids;
  if (patch.resp) s.resp = patch.resp;
  if ('second' in patch) s.second = patch.second ?? null;
  if (patch.fin !== undefined) s.fin = patch.fin;
  if (patch.media !== undefined) s.media = patch.media;
  if (patch.addr) s.addr = patch.addr;
  if ('since' in patch) {
    if (!patch.since) delete s.since;
    else s.since = patch.since;
  }
  bump();
  return OK;
}

/* port de confirmDelete (l.4308) — excluir de vez (cadastro errado/teste);
   diferente de desligar: não tem volta. */
export function removeStudent(sid: number): ActionResult {
  const i = STUDENTS.findIndex((x) => x.id === sid);
  if (i < 0) return fail('Matrícula não encontrada.');
  STUDENTS.splice(i, 1);
  bump();
  return OK;
}

/* ====================== DESLIGAR / REATIVAR ====================== */

/* port de confirmExit (l.5579): motivo obrigatório; nota obrigatória quando
   o motivo é "other" (regra do modal, l.5576); data = "hoje" do preview. */
export function setStudentExit(sid: number, reasonK: ExitKey, note: string): ActionResult {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  const r = EXIT_REASONS.find((x) => x.k === reasonK);
  if (!r) return fail('Escolha o motivo do desligamento.');
  note = note.trim();
  if (reasonK === 'other' && !note) return fail('Descreva o motivo do desligamento.');
  s.active = false;
  s.exit = { k: r.k, label: r.l, note, date: '03/06/2026' };
  bump();
  return OK;
}

/* port de reactivateStudent (l.5590): a vaga NÃO fica reservada — se a turma
   lotou nesse meio tempo, o kid volta com tid:null (fila de alocação).
   `bumped` lista quem voltou pela fila, para a tela montar o toast. */
export function reactivateStudent(sid: number): (ActionResult & { bumped?: string[] }) {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  s.active = true;
  delete s.exit;
  const bumped: string[] = [];
  s.kids.forEach((k) => {
    const t = kidTurma(k);
    if (t && activeKidsIn(t.id) > t.cap) {
      bumped.push(`${k.n.split(' ')[0]} (a ${salaById(t.sala)!.n.replace(' Room', '')} · ${schLabel(t.par)} ${t.hora} lotou)`);
      k.tid = null;
    }
  });
  bump();
  return { ok: true, bumped };
}

/* ====================== STATUS DO CONTRATO ====================== */

/* port de markSigned/markSent (l.5514/5521) generalizado: no preview o
   visualizado/assinado chega sozinho pelo webhook do Autentique — o marcar
   manual é backup. O timestamp da mudança é o logAct('agora'/'Hoje') que a
   tela registra junto; o mock não guarda histórico próprio (nem o preview). */
export function setContractStatus(sid: number, status: ContractStatus): ActionResult {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  s.status = status;
  bump();
  return OK;
}

/* ====================== NOTIFICAÇÕES ====================== */

/* port de notifClick (l.1745, só o dado) e markAllRead (l.1747) */
export function markNotifRead(index: number): void {
  const n = NOTIFS[index];
  if (!n) return;
  n.unread = false;
  bump();
}
export function markAllRead(): void {
  NOTIFS.forEach((n) => {
    n.unread = false;
  });
  bump();
}

/* ====================== USUÁRIOS DO PAINEL ====================== */

/* port de submitInvite (l.4341, parte de dados): e-mail único; entra com
   senha provisória (pending) e cor fixa, como no preview (l.4352). */
export function addUser(input: { n: string; e: string; r: UserRole }): (ActionResult & { id?: number }) {
  const { n, e, r } = input;
  if (USERS.some((u) => u.e.toLowerCase() === e.toLowerCase()))
    return fail(`Já existe um usuário com o e-mail <b>${e}</b> — cada acesso tem o seu.`);
  const id = Math.max(...USERS.map((u) => u.id)) + 1;
  USERS.push({ id, n, e, r, c: '#0891b2', pending: true });
  bump();
  return { ok: true, id };
}

/* guarda do último Diretor (l.4406/4414, API §10 LAST_DIRECTOR): conta só os
   ATIVOS — um Diretor desativado não segura o painel. */
const isLastActiveDirector = (u: User): boolean =>
  u.r === 'Diretor' && u.active !== false && USERS.filter((x) => x.r === 'Diretor' && x.active !== false).length === 1;

/* port de saveUser (l.4396): e-mail único + guarda do último Diretor (l.4406) */
export function updateUser(id: number, input: { n: string; e: string; r: UserRole }): ActionResult {
  const u = USERS.find((x) => x.id === id);
  if (!u) return fail('Usuário não encontrado.');
  const { n, e, r } = input;
  if (USERS.some((x) => x.id !== id && x.e.toLowerCase() === e.toLowerCase()))
    return fail(`Já existe outro usuário com o e-mail <b>${e}</b>.`);
  if (r !== 'Diretor' && isLastActiveDirector(u))
    return fail(`${u.n.split(' ')[0]} é a única pessoa com papel Diretor — promova outra antes de mudar o papel.`);
  u.n = n;
  u.e = e;
  u.r = r;
  bump();
  return OK;
}

/* port de openRemoveUser/confirmRemoveUser (l.4412/4434): não remove o último Diretor */
export function removeUser(id: number): ActionResult {
  const i = USERS.findIndex((u) => u.id === id);
  if (i < 0) return fail('Usuário não encontrado.');
  const u: User = USERS[i];
  if (isLastActiveDirector(u))
    return fail(`${u.n.split(' ')[0]} é a única pessoa com papel Diretor — promova outra antes de remover o acesso.`);
  USERS.splice(i, 1);
  bump();
  return OK;
}

/* desativar/reativar acesso (PATCH /api/users/:id, API §10): mesma guarda —
   o painel nunca fica sem nenhum Diretor em atividade. */
export function setUserActive(id: number, active: boolean): ActionResult {
  const u = USERS.find((x) => x.id === id);
  if (!u) return fail('Usuário não encontrado.');
  if (!active && isLastActiveDirector(u))
    return fail(`${u.n.split(' ')[0]} é a única pessoa com papel Diretor — promova outra antes de desativar o acesso.`);
  u.active = active;
  bump();
  return OK;
}
