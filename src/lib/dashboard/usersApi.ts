/* Camada de dados de Usuários ligada ao backend (DASHBOARD_API §10).
   Mapeia o userDTO do servidor para o shape `User` que a tela já usa (n/e/r/
   pending/active/last), pra não mexer no markup. */
import { apiFetch } from './api';
import type { User, UserRole } from './data';

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: 'director' | 'supervisor' | 'secretary';
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_FROM_API: Record<ApiUser['role'], UserRole> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  secretary: 'Secretaria',
};
const ROLE_TO_API: Record<UserRole, ApiUser['role']> = {
  Diretor: 'director',
  Supervisor: 'supervisor',
  Secretaria: 'secretary',
};

/* cor estável por id (a lista mock tinha cores fixas; aqui derivamos) */
const PALETTE = ['#0891b2', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#2563eb', '#c026d3', '#0d9488'];
const colorFor = (id: number) => PALETTE[id % PALETTE.length];

function fmtDate(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString('pt-BR');
}

function toUser(u: ApiUser): User {
  return {
    id: u.id,
    n: u.name,
    e: u.email,
    r: ROLE_FROM_API[u.role] ?? 'Secretaria',
    c: colorFor(u.id),
    pending: u.mustChangePassword,
    active: u.isActive,
    last: fmtDate(u.lastLoginAt),
  };
}

export async function listUsers(): Promise<User[]> {
  const data = await apiFetch<ApiUser[]>('/users');
  return data.map(toUser);
}

export async function createUser(input: { n: string; e: string; r: UserRole; tempPassword: string }): Promise<void> {
  await apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify({ name: input.n, email: input.e, role: ROLE_TO_API[input.r], tempPassword: input.tempPassword }),
  });
}

export async function editUser(id: number, input: { n: string; e: string; r: UserRole }): Promise<void> {
  await apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: input.n, email: input.e, role: ROLE_TO_API[input.r] }),
  });
}

export async function deactivateUser(id: number): Promise<void> {
  await apiFetch(`/users/${id}/deactivate`, { method: 'POST' });
}

export async function reactivateUser(id: number): Promise<void> {
  await apiFetch(`/users/${id}/reactivate`, { method: 'POST' });
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch(`/users/${id}`, { method: 'DELETE' });
}
