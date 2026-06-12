import { Check, Download, Eye, FileCheck2, FileClock, Inbox, PenLine, UserRound, X, Zap, type LucideIcon } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { WAIcon } from '../../../components/dashboard/ui/icons';
import { isStale, maskCPF, staleDays, STUDENTS, type Student } from '../../../lib/dashboard/data';
import { contractDownload, contractWhatsApp } from './contractActions';

/* Contrato + linha do tempo do Autentique — port de autentiqueTimeline (l.4635)
   e openContractModal (l.4671). Recusado/falha saem do caminho feliz: o passo
   correspondente vira VERMELHO (X). */

const STEP_ICONS: Record<string, LucideIcon> = { in: Inbox, auto: Zap, view: Eye, sign: FileCheck2 };

function AutentiqueTimeline({ s }: { s: Student }) {
  const { toast } = useToast();
  const errAt = s.status === 'rejected' ? 'sign' : s.status === 'failed' ? 'auto' : null;
  const done = (k: string): boolean =>
    k === 'in' ? true
      : k === 'auto' ? s.status !== 'pending'
      : k === 'view' ? s.status === 'viewed' || s.status === 'signed' || s.status === 'rejected'
      : s.status === 'signed';
  const steps = [
    { k: 'in', l: 'Matrícula recebida pelo site', d: `${s.date}${s.hora ? ' às ' + s.hora : ''}` },
    { k: 'auto', l: 'Contrato gerado e enviado ao Autentique', d: s.status === 'pending' ? 'na fila de envio — ou envie agora pelo botão verde' : 'automático · link de assinatura entregue por WhatsApp e e-mail' },
    { k: 'view', l: 'Visualizado pela família', d: done('view') ? 'a família abriu o link de assinatura' : 'ainda não abriu o link' },
    { k: 'sign', l: 'Assinado — validade jurídica', d: done('sign') ? 'o painel foi atualizado sozinho, sem conferência manual' : 'aguardando assinatura' },
  ];
  const ERR: Record<string, { l: string; d: string }> = {
    auto: { l: 'Falha ao entregar o link', d: 'o e-mail/WhatsApp não foi entregue — corrija o contato e reenvie' },
    sign: { l: 'Recusado pela família', d: 'a família não aceitou o contrato — refaça e reenvie se for o caso' },
  };
  return (
    <div className="px-5 pt-4 pb-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-1.5">
        <PenLine className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} /> Assinatura digital · Autentique
      </p>
      {steps.map((st, i) => {
        const isErr = st.k === errAt;
        const on = !isErr && done(st.k);
        const Icon = isErr ? X : on ? Check : STEP_ICONS[st.k];
        const col = isErr ? '#DC2626' : on ? '#16a34a' : 'var(--muted)';
        const bgc = isErr ? 'rgba(220,38,38,.12)' : on ? 'rgba(22,163,74,.12)' : 'var(--hover)';
        return (
          <div key={st.k} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full grid place-content-center shrink-0" style={{ background: bgc, color: col }}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 my-0.5" style={{ background: on && done(steps[i + 1].k) ? '#16a34a55' : 'var(--border)' }} />
              )}
            </div>
            <div className="pb-3 min-w-0">
              <p
                className={`text-sm font-medium leading-tight ${on || isErr ? '' : 'text-[var(--muted)]'}`}
                style={isErr ? { color: '#DC2626' } : undefined}
              >
                {isErr ? ERR[st.k].l : st.l}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{isErr ? ERR[st.k].d : st.d}</p>
            </div>
          </div>
        );
      })}
      {isStale(s) && (
        <div className="flex items-center gap-2.5 rounded-xl p-3 mt-1" style={{ background: 'rgba(220,38,38,.07)' }}>
          <FileClock className="w-4 h-4 shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-xs flex-1 min-w-0" style={{ color: '#DC2626' }}>
            <b>Parado há {staleDays(s)} dias</b> — vale lembrar a família.
          </p>
          <button
            onClick={() => contractWhatsApp(s, toast)}
            className="h-8 px-3 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition hover:brightness-105"
            style={{ background: '#25D366' }}
          >
            <WAIcon className="w-3.5 h-3.5" /> Cobrar
          </button>
        </div>
      )}
    </div>
  );
}

export function ContractModal({ sid, onClose, onOpenDetail }: { sid: number; onClose: () => void; onOpenDetail?: () => void }) {
  const { toast } = useToast();
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return null;
  const names = s.kids.map((k) => k.n);
  const kids = names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0];
  return (
    <Modal title={`Contrato_${s.kids[0].n.split(' ')[0]}.pdf`} size="max-w-lg" onClose={onClose}>
      <AutentiqueTimeline s={s} />
      <div className="p-5" style={{ background: 'var(--hover)' }}>
        <div className="bg-white text-slate-800 rounded-lg shadow-md p-6 sm:p-8 text-[13px] leading-relaxed">
          <p className="text-center font-bold text-sm mb-4">CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</p>
          <p>
            <strong>CONTRATADA:</strong> ENGLISH PATIO LTDA, escola de idiomas com sede em Goiânia/GO.
          </p>
          <p className="mt-2">
            <strong>CONTRATANTE:</strong> {s.resp.n.toUpperCase()} — CPF {maskCPF(s.resp.cpf)}, residente em {s.addr.street}, {s.addr.num}
            {s.addr.comp ? ' - ' + s.addr.comp : ''}, {s.addr.bairro}, {s.addr.city}/{s.addr.uf}, CEP {s.addr.cep}, tel. {s.resp.phone}.
          </p>
          <p className="mt-2">
            <strong>ALUNO(S):</strong> {kids}
          </p>
          <p className="mt-3 text-slate-500">
            <strong>DAS MENSALIDADES.</strong> O pagamento dar-se-á por meio de <strong>boleto bancário</strong> emitido pela contratada;
            um <strong>carnê físico</strong> será entregue ao responsável no ato da matrícula, com <strong>6 parcelas</strong>.
          </p>
          <p className="mt-2 text-slate-500">
            <strong>PARÁGRAFO SEGUNDO.</strong> As mensalidades correspondentes aos meses de Janeiro e Julho são convertidas integralmente
            nas <em>Vacation Classes</em>.
          </p>
          <p className="mt-2 text-slate-500">
            <strong>DA VIGÊNCIA — CLÁUSULA 9ª.</strong> O presente contrato terá vigência de <strong>6 (seis) meses</strong>, iniciando em
            Julho e finalizando em Dezembro de 2026.
          </p>
          <p className="mt-3">
            <strong>FORMATO DAS AULAS:</strong>{' '}
            <span className="inline-block w-3.5 h-3.5 border border-slate-400 rounded-sm text-center leading-[0.85] align-middle">✓</span>{' '}
            Presencial na Sede
          </p>
          <p className="mt-1">
            <strong>AUTORIZAÇÃO DE USO DE IMAGEM:</strong>{' '}
            <span className="inline-block w-3.5 h-3.5 border border-slate-400 rounded-sm text-center leading-[0.85] align-middle">
              {s.media ? '✓' : ' '}
            </span>{' '}
            {s.media ? 'Autorizado' : 'Não autorizado'}
          </p>
          <div className="grid grid-cols-2 gap-6 mt-8 text-center text-[11px]">
            <div>
              <div className="border-t border-slate-300 pt-1">{s.resp.n}</div>
              <p className="text-slate-400">Contratante</p>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-1">ENGLISH PATIO LTDA</div>
              <p className="text-slate-400">Contratada</p>
            </div>
          </div>
          <p className="text-center text-slate-400 text-[11px] mt-4">
            Goiânia, {s.date} · página 1 de 4 (visualização resumida do contrato real)
          </p>
        </div>
      </div>
      <div className="p-5 flex flex-wrap gap-2">
        <button
          onClick={() => contractDownload(s, toast)}
          className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Baixar PDF
        </button>
        <button
          onClick={() => contractWhatsApp(s, toast)}
          className="h-11 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
          style={{ background: '#25D366' }}
        >
          <WAIcon className="w-4 h-4" /> {s.status === 'pending' || s.status === 'failed' ? 'Enviar' : 'Cobrar'}
        </button>
        {onOpenDetail && (
          <button
            onClick={() => {
              onClose();
              onOpenDetail();
            }}
            className="h-11 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: '#1E3765' }}
          >
            <UserRound className="w-4 h-4" /> Ficha do aluno
          </button>
        )}
      </div>
    </Modal>
  );
}
