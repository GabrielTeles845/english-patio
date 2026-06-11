/* Escritas de aluno/matrícula/contrato (DASHBOARD_API §4/§6). Funções finas
   sobre apiFetch; o store.ts as orquestra (resolve ids reais + reloadData). */
import { apiFetch } from './api';
import type { ContractStatus } from './status';
import type { FormData } from '../../types/enrollment';

/* POST /api/enrollments — criação manual. O `formData` é o MESMO shape do
   formulário do site (src/types/enrollment.ts), que o backend espelha. */
export async function createEnrollmentApi(formData: FormData, period: string): Promise<{ enrollmentId: number; contractId: number }> {
  return apiFetch('/enrollments', {
    method: 'POST',
    body: JSON.stringify({ source: 'manual', period, formData }),
  });
}

/* ----- detalhe da matrícula (GET /enrollments/:id) — CPF revelado + ids reais
   + updatedAt fresco (token de concorrência). Loga view_student_pii no backend. */
export interface DetailStudent { id: number; name: string; birthDate: string; classId: number | null; atSchoolSince: string | null; isActive: boolean }
export interface DetailResp { id: number; type: 'legal' | 'second' | 'financial'; name: string; cpf: string | null; phone: string | null; email: string | null; relationship: string | null; birthDate: string | null }
export interface DetailAddress { cep: string; street: string; number: string; complement: string | null; neighborhood: string; city: string; state: string }
export interface EnrollmentDetail {
  id: number;
  financialResponsibleType: 'legal' | 'second' | 'other';
  authorizationMedia: boolean;
  updatedAt: string;
  students: DetailStudent[];
  responsibles: DetailResp[];
  address: DetailAddress | null;
}
export async function getEnrollmentDetailApi(id: number): Promise<EnrollmentDetail> {
  return apiFetch(`/enrollments/${id}`);
}

/* ----- edição (PATCH /enrollments/:id) — corpo declarativo por papel (§4.3). */
export interface EnrollmentPatch {
  expectedUpdatedAt: string;
  students?: { id: number; name?: string; birthDate?: string; atSchoolSince?: string | null }[];
  legalResponsible?: { name?: string; cpf?: string | null; phone?: string | null; email?: string | null; relationship?: string | null; birthDate?: string | null };
  secondResponsible?: { name: string; cpf?: string | null; phone: string; relationship: string } | null;
  financialResponsibleType?: 'legal' | 'second' | 'other';
  financialResponsible?: { name: string; cpf: string } | null;
  address?: { cep?: string; street?: string; number?: string; complement?: string | null; neighborhood?: string; city?: string };
  authorizationMedia?: boolean;
}
export async function updateEnrollmentApi(id: number, body: EnrollmentPatch): Promise<void> {
  await apiFetch(`/enrollments/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function moveKidApi(
  studentId: number,
  classId: number | null,
  opts?: { extraSeat?: boolean; allowLevelChange?: boolean },
): Promise<void> {
  await apiFetch(`/students/${studentId}/class`, {
    method: 'PATCH',
    body: JSON.stringify({ classId, allowLevelChange: opts?.allowLevelChange ?? true, extraSeat: opts?.extraSeat ?? false }),
  });
}

export async function deactivateStudentApi(studentId: number, reason: string, note: string): Promise<void> {
  await apiFetch(`/students/${studentId}/deactivate`, { method: 'POST', body: JSON.stringify({ reason, note }) });
}

export async function reactivateStudentApi(studentId: number): Promise<{ droppedToQueue: boolean }> {
  return apiFetch(`/students/${studentId}/reactivate`, { method: 'POST' });
}

export async function deleteEnrollmentApi(enrollmentId: number): Promise<void> {
  await apiFetch(`/enrollments/${enrollmentId}`, { method: 'DELETE' });
}

export async function setContractStatusApi(contractId: number, status: ContractStatus): Promise<void> {
  await apiFetch(`/contracts/${contractId}/status`, { method: 'POST', body: JSON.stringify({ status }) });
}

export async function sendContractApi(contractId: number, channels: ('email' | 'whatsapp')[]): Promise<void> {
  await apiFetch(`/contracts/${contractId}/send`, { method: 'POST', body: JSON.stringify({ channels }) });
}

export async function remindContractApi(contractId: number): Promise<{ phone: string; message: string; waLink: string }> {
  return apiFetch(`/contracts/${contractId}/remind`, { method: 'POST' });
}
