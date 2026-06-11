/* Escritas da Agenda (turmas/salas) — DASHBOARD_API §5. Funções finas sobre
   apiFetch; o store.ts orquestra (mapeia sala→roomId, nível→levelId, period). */
import { apiFetch } from './api';

export interface ClassBody {
  roomId: number;
  dayPair: 'seg-qua' | 'ter-qui';
  startTime: string;
  levelId: number;
  capacity: number;
  period: string;
}

export async function createClassApi(body: ClassBody): Promise<{ id: number }> {
  return apiFetch('/classes', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateClassApi(
  id: number,
  body: Partial<Omit<ClassBody, 'period'>>,
): Promise<void> {
  await apiFetch(`/classes/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteClassApi(id: number): Promise<void> {
  await apiFetch(`/classes/${id}`, { method: 'DELETE' });
}

export async function createRoomApi(body: { name: string; color: string; teacherName?: string | null }): Promise<{ id: number }> {
  return apiFetch('/rooms', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateRoomApi(id: number, body: { name?: string; color?: string; teacherName?: string | null }): Promise<void> {
  await apiFetch(`/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deactivateRoomApi(id: number): Promise<void> {
  await apiFetch(`/rooms/${id}/deactivate`, { method: 'POST' });
}
