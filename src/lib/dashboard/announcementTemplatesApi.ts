// Cliente dos modelos de comunicado (/api/announcement-templates). Mapeia o DTO
// do servidor {id,name,subject,body,icon,color} para o shape EmailTpl que a tela
// já usa {k,l,s,b,ic,col} — k = id como string.
import { apiFetch } from './api';
import type { EmailTpl } from './data';

interface TplDTO {
  id: number;
  name: string;
  subject: string;
  body: string;
  icon: string;
  color: string;
}

function toTpl(d: TplDTO): EmailTpl {
  return { k: String(d.id), l: d.name, s: d.subject, b: d.body, ic: d.icon, col: d.color };
}

export async function listTemplatesApi(): Promise<EmailTpl[]> {
  const data = await apiFetch<TplDTO[]>('/announcement-templates');
  return data.map(toTpl);
}

export async function createTemplateApi(input: { name: string; subject: string; body: string }): Promise<EmailTpl> {
  const d = await apiFetch<TplDTO>('/announcement-templates', { method: 'POST', body: JSON.stringify(input) });
  return toTpl(d);
}

export async function updateTemplateApi(
  k: string,
  input: { name?: string; subject?: string; body?: string },
): Promise<EmailTpl> {
  const d = await apiFetch<TplDTO>(`/announcement-templates/${k}`, { method: 'PATCH', body: JSON.stringify(input) });
  return toTpl(d);
}

export async function deleteTemplateApi(k: string): Promise<void> {
  await apiFetch(`/announcement-templates/${k}`, { method: 'DELETE' });
}
