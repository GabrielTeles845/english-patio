/* Camada de dados do Registro de atividades (DASHBOARD_API §11). O servidor
   guarda `action` (código) + `detail` (jsonb); aqui traduzimos para a frase
   amigável (com <b>) que a tela renderiza, no mesmo shape ActEntry do mock. */
import { apiFetch } from './api';
import { esc, type ActEntry } from './data';

interface ApiActivity {
  id: number;
  actorType: 'user' | 'system' | 'autentique';
  actorName: string;
  action: string;
  targetType: string | null;
  targetId: number | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

function dayLabel(d: Date): string {
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((a.getTime() - b.getTime()) / 86_400_000);
  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return d.toLocaleDateString('pt-BR');
}
function timeLabel(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

/* action + detail → frase em PT (esc nas partes dinâmicas; <b> é controlado) */
function describe(it: ApiActivity): string {
  const d = it.detail ?? {};
  const name = (k: string) => esc(String(d[k] ?? ''));
  const num = (k: string) => (d[k] != null ? String(d[k]) : '');
  switch (it.action) {
    case 'login': return 'Entrou no painel';
    case 'user_created': return `Cadastrou <b>${name('name')}</b> no painel`;
    case 'user_updated': return 'Editou um usuário do painel';
    case 'user_deactivated': return 'Desativou um acesso ao painel';
    case 'user_reactivated': return 'Reativou um acesso ao painel';
    case 'user_removed': return 'Removeu um acesso ao painel';
    case 'enrollment_created': return `Nova matrícula de <b>${name('student')}</b>`;
    case 'enrollment_updated': return 'Editou os dados de uma matrícula';
    case 'student_deactivated': return `Desligou <b>${name('name') || 'um aluno'}</b>`;
    case 'student_reactivated': return `Reativou <b>${name('name') || 'um aluno'}</b>`;
    case 'student_moved': return `Moveu <b>${name('name') || 'um aluno'}</b> de turma`;
    case 'view_student_pii': return 'Acessou os dados completos de uma matrícula';
    case 'export_students': return `Exportou ${num('count')} matrícula(s) em CSV`;
    case 'import': return `Importou ${num('imported')} matrícula(s) da planilha`;
    case 'contract_sent': return 'Enviou um contrato para assinatura';
    case 'contract_viewed': return 'Contrato visualizado pelo responsável';
    case 'contract_signed': return 'Contrato assinado';
    case 'contract_rejected': return 'Contrato recusado pelo responsável';
    case 'contract_failed': return 'Falha na entrega de um contrato';
    case 'contract_reminder_prepared': return 'Preparou a cobrança de um contrato';
    case 'contract_pdf_download': return 'Baixou o PDF de um contrato';
    case 'announcement_sent': return `Enviou um comunicado${Array.isArray(d.channels) ? ` (${(d.channels as string[]).join(', ')})` : ''}`;
    case 'site_content_saved': return 'Salvou um rascunho do site';
    case 'site_content_published': return 'Publicou textos do site';
    case 'class_created': return 'Criou uma turma na agenda';
    case 'template_created': return 'Importou um modelo de contrato';
    case 'template_updated': return 'Editou um modelo de contrato';
    case 'template_activated': return 'Ativou um modelo de contrato';
    case 'template_archived': return 'Arquivou um modelo de contrato';
    case 'password_reset_requested': return 'Solicitou a redefinição de senha';
    case 'password_reset_done': return 'Redefiniu a própria senha';
    default: return esc(it.action.replace(/_/g, ' '));
  }
}

export async function fetchActivity(): Promise<ActEntry[]> {
  const data = await apiFetch<{ items: ApiActivity[] }>('/activity?pageSize=200');
  return data.items.map((it) => {
    const when = new Date(it.createdAt);
    return { who: it.actorName, a: describe(it), t: timeLabel(when), day: dayLabel(when) } satisfies ActEntry;
  });
}
