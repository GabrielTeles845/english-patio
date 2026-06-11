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
