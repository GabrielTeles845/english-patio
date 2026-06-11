/* Camada de dados das notificações / sino (DASHBOARD_API §12). Mapeia o
   notificationDTO para o shape que o painel do sino já usa. */
import { apiFetch } from './api';
import type { NotifType } from './data';

interface ApiNotif {
  id: number;
  type: NotifType;
  studentId: number | null;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PanelNotif {
  id: number;
  type: NotifType;
  sid: number | null;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

function rel(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86_400) return `há ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function map(n: ApiNotif): PanelNotif {
  return {
    id: n.id,
    type: n.type,
    sid: n.studentId,
    title: n.title,
    desc: n.body ?? '',
    time: rel(n.createdAt),
    unread: n.readAt === null,
  };
}

export async function fetchNotifications(): Promise<PanelNotif[]> {
  const data = await apiFetch<ApiNotif[]>('/notifications');
  return data.map(map);
}

export async function markNotifReadApi(id: number): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllReadApi(): Promise<void> {
  await apiFetch('/notifications/read-all', { method: 'POST' });
}
