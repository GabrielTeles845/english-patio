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
import { ApiError } from './api';
import { reloadData, currentPeriod, levelIdForKey } from './dataApi';
import {
  createEnrollmentApi,
  deactivateStudentApi,
  deleteEnrollmentApi,
  moveKidApi,
  reactivateStudentApi,
  setContractStatusApi,
} from './studentsApi';
import type { FormData } from '../../types/enrollment';
import {
  createClassApi,
  updateClassApi,
  deleteClassApi,
  createRoomApi,
  updateRoomApi,
  deactivateRoomApi,
} from './agendaApi';
import {
  ACTIVITY,
  type Addr,
  EXIT_REASONS,
  type ExitKey,
  type Kid,
  NOTIFS,
  type Par,
  type Resp,
  SALA_COLORS,
  SALAS,
  type Second,
  STUDENTS,
  TEACHERS,
  turmaById,
  type User,
  type UserRole,
  USERS,
  activeKidsIn,
  badChars,
  salaById,
  schLabel,
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

export type ActionResult = { ok: true } | { ok: false; error: string; code?: string };
const OK: ActionResult = { ok: true };
const fail = (error: string): ActionResult => ({ ok: false, error });

/* erro da API → ActionResult (preserva o code p/ a UI decidir, ex.: CLASS_FULL) */
function apiFail(err: unknown): ActionResult {
  if (err instanceof ApiError) return { ok: false, error: err.message, code: err.code };
  return { ok: false, error: 'Algo deu errado. Tente de novo.' };
}

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
export async function allocateKid(
  sid: number,
  ki: number,
  tid: number | null,
  opts?: { abrirVagaExtra?: boolean }
): Promise<ActionResult> {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  const k = s.kids[ki];
  if (!k) return fail('Aluno não encontrado.');
  if (k.id == null) return fail('Aluno sem id — recarregue a página.');
  try {
    // capacidade e mudança de nível são validadas no servidor (CLASS_FULL/
    // ROOM_OVERFLOW); a vaga extra vem do fluxo "abrir vaga e alocar".
    await moveKidApi(k.id, tid, { extraSeat: opts?.abrirVagaExtra });
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
}

/* ====================== CRUD DE TURMA ====================== */

export interface TurmaInput {
  sala: string;
  par: Par;
  hora: string;
  nivel: string;
  cap: number;
}

/* POST /api/classes — slot único (409 SLOT_TAKEN) e capacidade validados no servidor */
export async function addTurma(input: TurmaInput): Promise<ActionResult & { id?: number }> {
  const { sala, par, hora, nivel, cap } = input;
  if (!(cap >= 1 && cap <= 7)) return fail('Vagas entre 1 e 7 — o padrão da escola é 7.');
  const levelId = levelIdForKey(nivel);
  if (!levelId) return fail('Nível inválido — recarregue a página.');
  try {
    const r = await createClassApi({ roomId: Number(sala), dayPair: par, startTime: hora, levelId, capacity: cap, period: currentPeriod() });
    await reloadData();
    return { ok: true, id: r.id };
  } catch (err) {
    return apiFail(err);
  }
}

/* PATCH /api/classes/:id — slot único + capacidade >= ocupação validados no servidor */
export async function updateTurma(tid: number, input: TurmaInput): Promise<ActionResult> {
  const { sala, par, hora, nivel, cap } = input;
  const levelId = levelIdForKey(nivel);
  if (!levelId) return fail('Nível inválido — recarregue a página.');
  try {
    await updateClassApi(tid, { roomId: Number(sala), dayPair: par, startTime: hora, levelId, capacity: cap });
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
}

/* DELETE /api/classes/:id — só vazia (422 CLASS_NOT_EMPTY no servidor) */
export async function deleteTurma(tid: number): Promise<ActionResult> {
  try {
    await deleteClassApi(tid);
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
}

/* ====================== CRUD DE SALA ====================== */

/* POST /api/rooms — nome único (409 no servidor); cor livre da paleta */
export async function addSala(n: string): Promise<ActionResult & { id?: string }> {
  if (!n.trim()) return fail('A sala precisa de um nome.');
  n = n.trim();
  if (badChars(n)) return fail('O nome da sala não pode ter sinais de maior/menor, aspas ou & — use só letras e números.');
  const usadas = new Set(SALAS.map((s) => s.c));
  const cor = SALA_COLORS.find((c) => !usadas.has(c)) || SALA_COLORS[SALAS.length % SALA_COLORS.length];
  try {
    const r = await createRoomApi({ name: n, color: cor });
    await reloadData();
    return { ok: true, id: String(r.id) };
  } catch (err) {
    return apiFail(err);
  }
}

/* PATCH /api/rooms/:id — nome obrigatório/único, sem badChars; cor opcional */
export async function updateSala(id: string, input: { n: string; c?: string }): Promise<ActionResult> {
  const n = input.n.trim();
  if (!n) return fail('A sala precisa de um nome.');
  if (badChars(n)) return fail('O nome da sala não pode ter sinais de maior/menor, aspas ou & — use só letras e números.');
  try {
    await updateRoomApi(Number(id), { name: n, ...(input.c ? { color: input.c } : {}) });
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
}

/* POST /api/rooms/:id/deactivate — só sala sem turmas (422 ROOM_HAS_CLASSES no servidor) */
export async function deleteSala(id: string): Promise<ActionResult> {
  try {
    await deactivateRoomApi(Number(id));
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
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

/* PATCH /api/rooms/:id { teacherName }. O professor é da SALA (1 por sala);
   salaId '' = tirar o teacher da sala atual. */
export async function assignTeacher(name: string, salaId: string | ''): Promise<ActionResult> {
  try {
    const old = SALAS.find((s) => s.prof === name);
    if (old && old.id !== salaId) await updateRoomApi(Number(old.id), { teacherName: null });
    if (salaId) await updateRoomApi(Number(salaId), { teacherName: name });
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
}

/* tira o teacher da sala que ele ocupa (não há cadastro de teacher fora da sala). */
export async function removeTeacher(name: string): Promise<ActionResult> {
  try {
    const sala = SALAS.find((s) => s.prof === name);
    if (sala) await updateRoomApi(Number(sala.id), { teacherName: null });
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
}

/* ====================== MATRÍCULAS — CRUD ====================== */

/* POST /api/enrollments — criação manual com o MESMO formulário do site
   (FormData). O backend valida tudo de novo (EnrollmentFormSchema) e devolve os
   erros por campo (400 VALIDATION) ou 422 OUTSIDE_GO; a UI mostra na caixa. Os
   alunos entram sem turma (fila de alocação), igual ao formulário do site. */
export async function createEnrollment(formData: FormData): Promise<ActionResult & { id?: number; fields?: Record<string, string> }> {
  try {
    const r = await createEnrollmentApi(formData, currentPeriod());
    await reloadData();
    return { ok: true, id: r.enrollmentId };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, error: err.message, code: err.code, fields: err.fields };
    return { ok: false, error: 'Algo deu errado ao salvar a matrícula. Tente de novo.' };
  }
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
export async function removeStudent(sid: number): Promise<ActionResult> {
  try {
    await deleteEnrollmentApi(sid);
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
}

/* ====================== DESLIGAR / REATIVAR ====================== */

/* port de confirmExit (l.5579): motivo obrigatório; nota obrigatória quando
   o motivo é "other" (regra do modal, l.5576); data = "hoje" do preview. */
export async function setStudentExit(sid: number, reasonK: ExitKey, note: string): Promise<ActionResult> {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  const r = EXIT_REASONS.find((x) => x.k === reasonK);
  if (!r) return fail('Escolha o motivo do desligamento.');
  note = note.trim();
  if (reasonK === 'other' && !note) return fail('Descreva o motivo do desligamento.');
  try {
    // desligamento é por aluno no backend; aqui desliga todos os kids da família.
    for (const k of s.kids) {
      if (k.id == null) continue;
      try {
        await deactivateStudentApi(k.id, reasonK, note);
      } catch (e) {
        if (!(e instanceof ApiError && e.code === 'ALREADY_INACTIVE')) throw e;
      }
    }
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
}

/* port de reactivateStudent (l.5590): a vaga NÃO fica reservada — se a turma
   lotou nesse meio tempo, o kid volta com tid:null (fila de alocação).
   `bumped` lista quem voltou pela fila, para a tela montar o toast. */
export async function reactivateStudent(sid: number): Promise<ActionResult & { bumped?: string[] }> {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  const bumped: string[] = [];
  try {
    for (const k of s.kids) {
      if (k.id == null) continue;
      try {
        const r = await reactivateStudentApi(k.id);
        if (r.droppedToQueue) bumped.push(k.n.split(' ')[0]); // a turma lotou no meantime
      } catch (e) {
        if (!(e instanceof ApiError && e.code === 'ALREADY_ACTIVE')) throw e;
      }
    }
    await reloadData();
    return { ok: true, bumped };
  } catch (err) {
    return apiFail(err);
  }
}

/* ====================== STATUS DO CONTRATO ====================== */

/* port de markSigned/markSent (l.5514/5521) generalizado: no preview o
   visualizado/assinado chega sozinho pelo webhook do Autentique — o marcar
   manual é backup. O timestamp da mudança é o logAct('agora'/'Hoje') que a
   tela registra junto; o mock não guarda histórico próprio (nem o preview). */
export async function setContractStatus(sid: number, status: ContractStatus): Promise<ActionResult> {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return fail('Matrícula não encontrada.');
  if (s.contractId == null) return fail('Esta matrícula ainda não tem contrato.');
  try {
    await setContractStatusApi(s.contractId, status);
    await reloadData();
    return OK;
  } catch (err) {
    return apiFail(err);
  }
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
