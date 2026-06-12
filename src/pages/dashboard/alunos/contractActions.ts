/* Orquestração das ações de contrato disparadas por botão (enviar/cobrar/baixar).
   Centraliza o mapa STATUS → AÇÃO para não repetir nas telas Contratos, Alunos
   (menu ⋮), na ficha do aluno e no modal do contrato:

   - pending / failed → ENVIAR (ou reenviar) pelo Autentique (store.sendContract);
   - sent / viewed / rejected → COBRAR: prepara a mensagem e ABRE o WhatsApp
     (store.remindContract devolve o link wa.me);
   - assinado não tem botão verde (caminho encerrado).

   Baixar abre a URL do PDF em nova aba (ou mostra o erro honesto quando o PDF
   ainda não foi gerado). */
import { remindContract, sendContract, downloadContract } from '../../../lib/dashboard/store';
import type { Student } from '../../../lib/dashboard/data';

type Toast = (msg: string) => void;

/* botão verde (WhatsApp) — envia quando ainda não saiu, cobra quando já está com a família */
export async function contractWhatsApp(s: Student, toast: Toast): Promise<void> {
  if (s.status === 'pending' || s.status === 'failed') {
    const res = await sendContract(s.id, ['whatsapp', 'email']);
    if (!res.ok) return toast(res.error);
    toast(s.status === 'pending' ? 'Contrato enviado pelo Autentique — link no WhatsApp e e-mail.' : 'Reenvio feito — link de assinatura reenviado.');
    return;
  }
  const res = await remindContract(s.id);
  if (!res.ok) return toast(res.error);
  if (res.waLink) window.open(res.waLink, '_blank', 'noopener,noreferrer');
  toast(s.status === 'rejected' ? 'WhatsApp aberto para falar com a família.' : 'Cobrança preparada — WhatsApp aberto com o link de assinatura.');
}

/* baixar o PDF do contrato — abre a URL assinada/pública em nova aba */
export async function contractDownload(s: Student, toast: Toast): Promise<void> {
  const res = await downloadContract(s.id);
  if (!res.ok) return toast(res.error);
  if (res.url) window.open(res.url, '_blank', 'noopener,noreferrer');
}
