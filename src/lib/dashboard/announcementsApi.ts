/* Comunicados (DASHBOARD_API §8) — só Diretor no backend. Envia e-mail de
   verdade (Resend) e/ou prepara WhatsApp por família, registra o histórico e
   resolve a audiência no servidor. As variáveis {{nome_responsavel}}/{{nome_aluno}}
   são renderizadas por destinatário no backend. */
import { apiFetch } from './api';

export type AnnChannel = 'email' | 'whatsapp';

/* filtro de público resolvido no servidor (resolveAudience). Sem período = base
   inteira (mesma que a tela carrega); dayPair/pendingContract já implicam ativos. */
export interface AudienceFilter {
  status?: 'active' | 'inactive' | 'all';
  dayPair?: 'seg-qua' | 'ter-qui';
  pendingContract?: boolean;
}

export interface AnnouncementItem {
  id: number;
  subject: string;
  body: string;
  channels: AnnChannel[];
  status: string;
  kind: string;
  sentAt: string | null;
  createdBy: number | null;
  recipientCount: number;
}

/* GET /api/announcements — histórico paginado (mais recentes primeiro). */
export async function listAnnouncementsApi(page = 1, pageSize = 20): Promise<{ items: AnnouncementItem[]; page: number; pageSize: number; total: number }> {
  return apiFetch(`/announcements?page=${page}&pageSize=${pageSize}`);
}

/* POST /api/announcements — envia. Devolve as contagens reais por canal. */
export interface SendAnnouncementResult {
  announcementId: number;
  recipients: number;
  sent: number;
  prepared: number;
  failed: number;
}
export async function sendAnnouncementApi(body: {
  subject: string;
  body: string;
  channels: AnnChannel[];
  audienceFilter?: AudienceFilter;
}): Promise<SendAnnouncementResult> {
  return apiFetch('/announcements', { method: 'POST', body: JSON.stringify(body) });
}
