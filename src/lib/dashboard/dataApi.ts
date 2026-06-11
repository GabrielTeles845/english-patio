/* Camada de dados compartilhada da dashboard (DASHBOARD_API §3/§5).
   Carrega matrículas (lista enriquecida) + salas/turmas/níveis da API e
   REESCREVE o conteúdo dos arrays globais de ./data no mesmo shape do mock —
   assim Alunos/Overview/Agenda/Contratos passam a exibir dados reais sem mexer
   no markup. As ESCRITAS migram para a API tela a tela (ver store/*Api). */
import { apiFetch } from './api';
import { bump, useDash } from './store';
import { useEffect } from 'react';
import type { ContractStatus } from './status';
import {
  EXIT_REASONS,
  SALAS,
  STUDENTS,
  TEACHERS,
  TURMAS,
  type ExitKey,
  type Sala,
  type Student,
  type Turma,
} from './data';

/* ---- shapes da API ---- */
interface ApiKid {
  id: number;
  name: string;
  birthDate: string; // YYYY-MM-DD
  classId: number | null;
  atSchoolSince: string | null;
  isActive: boolean;
  exitReason: string | null;
  exitNote: string | null;
  exitDate: string | null;
}
interface ApiResp {
  type: 'legal' | 'second' | 'financial';
  name: string;
  cpf: string | null; // mascarado na lista
  phone: string | null;
  email: string | null;
  relationship: string | null;
  birthDate: string | null;
}
interface ApiAddr {
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}
interface ApiEnrollment {
  id: number;
  financialResponsibleType: 'legal' | 'second' | 'other';
  authorizationMedia: boolean;
  submittedAt: string;
  kids: ApiKid[];
  responsibles: ApiResp[];
  address: ApiAddr | null;
  neighborhood: string | null;
  contractStatus: ContractStatus | null;
}
interface ApiRoom { id: number; name: string; color: string; teacherName: string | null; isActive: boolean }
interface ApiClass { id: number; roomId: number; dayPair: 'seg-qua' | 'ter-qui'; startTime: string; levelId: number; capacity: number; period: string; isActive: boolean }
interface ApiLevel { id: number; key: string }

/* ---- helpers de formato ---- */
function isoToBr(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : '';
}
function ageFromISO(iso: string): number {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
}
function horaFromISO(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}
function fmtCep(cep: string): string {
  const c = (cep || '').replace(/\D/g, '');
  return c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : cep;
}
function exitLabel(key: string | null): string {
  return EXIT_REASONS.find((r) => r.k === key)?.l ?? 'Desligamento';
}

/* ---- mapeadores API → shape do mock ---- */
function toStudent(e: ApiEnrollment): Student {
  const legal = e.responsibles.find((r) => r.type === 'legal');
  const second = e.responsibles.find((r) => r.type === 'second');
  const financial = e.responsibles.find((r) => r.type === 'financial');
  const finName =
    e.financialResponsibleType === 'other' ? financial?.name ?? ''
    : e.financialResponsibleType === 'second' ? second?.name ?? legal?.name ?? ''
    : legal?.name ?? '';
  const anyActive = e.kids.some((k) => k.isActive);
  const exitKid = e.kids.find((k) => !k.isActive && k.exitReason);
  return {
    id: e.id,
    kids: e.kids.map((k) => ({ id: k.id, n: k.name, age: ageFromISO(k.birthDate), b: isoToBr(k.birthDate), tid: k.classId })),
    resp: {
      n: legal?.name ?? '', cpf: legal?.cpf ?? '', phone: legal?.phone ?? '', email: legal?.email ?? '',
      rel: legal?.relationship ?? '', b: legal?.birthDate ? isoToBr(legal.birthDate) : '—',
    },
    second: second ? { n: second.name, phone: second.phone ?? '', rel: second.relationship ?? '', cpf: second.cpf ?? undefined } : null,
    fin: finName,
    addr: e.address
      ? { cep: fmtCep(e.address.cep), street: e.address.street, num: e.address.number, comp: e.address.complement ?? '', bairro: e.address.neighborhood, city: e.address.city, uf: e.address.state }
      : { cep: '', street: '', num: '', comp: '', bairro: e.neighborhood ?? '', city: '', uf: 'GO' },
    pay: 'Boleto',
    status: (e.contractStatus ?? 'pending') as ContractStatus,
    media: e.authorizationMedia,
    since: e.kids[0]?.atSchoolSince ? isoToBr(e.kids[0].atSchoolSince) : undefined,
    date: isoToBr(e.submittedAt),
    hora: horaFromISO(e.submittedAt),
    active: anyActive,
    exit: exitKid
      ? { k: exitKid.exitReason as ExitKey, label: exitLabel(exitKid.exitReason), note: exitKid.exitNote ?? '', date: isoToBr(exitKid.exitDate) }
      : undefined,
  };
}
function toSala(r: ApiRoom): Sala {
  return { id: String(r.id), n: r.name, c: r.color, prof: r.teacherName ?? null };
}
function toTurma(c: ApiClass, levelKey: Map<number, string>): Turma {
  return { id: c.id, sala: String(c.roomId), par: c.dayPair, hora: c.startTime, nivel: levelKey.get(c.levelId) ?? '', cap: c.capacity };
}

function replace<T>(arr: T[], next: T[]): void {
  arr.splice(0, arr.length, ...next);
}

/* ---- carga ---- */
async function fetchAllEnrollments(): Promise<ApiEnrollment[]> {
  const out: ApiEnrollment[] = [];
  for (let page = 1; page < 100; page++) {
    const data = await apiFetch<{ items: ApiEnrollment[]; total: number }>(`/enrollments?pageSize=100&page=${page}`);
    out.push(...data.items);
    if (out.length >= data.total || data.items.length === 0) break;
  }
  return out;
}

export async function loadDashboardData(): Promise<void> {
  const [enr, rooms, classes, levels] = await Promise.all([
    fetchAllEnrollments(),
    apiFetch<ApiRoom[]>('/rooms'),
    apiFetch<ApiClass[]>('/classes'),
    apiFetch<ApiLevel[]>('/levels'),
  ]);
  const levelKey = new Map(levels.map((l) => [l.id, l.key]));
  // turmas: usa só o período mais recente (a grade da Agenda é de um semestre)
  const latest = classes.reduce((mx, c) => (c.period > mx ? c.period : mx), '');
  const curClasses = latest ? classes.filter((c) => c.period === latest) : classes;

  replace(SALAS, rooms.map(toSala));
  replace(TURMAS, curClasses.map((c) => toTurma(c, levelKey)));
  replace(STUDENTS, enr.map(toStudent));
  replace(TEACHERS, [...new Set(rooms.map((r) => r.teacherName).filter((p): p is string => !!p))].sort());
  bump();
}

/* ---- singleton de carga + hook ---- */
let loadPromise: Promise<void> | null = null;
let ready = false;

export function dataIsReady(): boolean {
  return ready;
}
export function ensureData(): Promise<void> {
  if (!loadPromise) {
    loadPromise = loadDashboardData()
      .catch((err) => {
        console.error('Falha ao carregar dados da dashboard', err);
      })
      .finally(() => {
        ready = true;
        bump();
      });
  }
  return loadPromise;
}
/* recarrega após uma escrita (não usa o cache do singleton) */
export async function reloadData(): Promise<void> {
  try {
    await loadDashboardData();
  } finally {
    ready = true;
    bump();
  }
}

/* hook das telas que dependem da base — dispara a carga e re-renderiza no bump */
export function useDashboardData(): { ready: boolean } {
  useDash();
  useEffect(() => {
    void ensureData();
  }, []);
  return { ready: dataIsReady() };
}
