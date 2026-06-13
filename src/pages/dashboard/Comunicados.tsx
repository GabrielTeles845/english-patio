import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  FileClock,
  FileText,
  Info,
  Lightbulb,
  Mail,
  MailCheck,
  Megaphone,
  Pencil,
  Plus,
  Send,
  Settings2,
  Sun,
  Trash2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { sendAnnouncement, useDash } from '../../lib/dashboard/store';
import { listAnnouncementsApi, type AnnChannel, type AnnouncementItem, type AudienceFilter } from '../../lib/dashboard/announcementsApi';
import { currentPeriod } from '../../lib/dashboard/dataApi';
import {
  listTemplatesApi,
  createTemplateApi,
  updateTemplateApi,
  deleteTemplateApi,
} from '../../lib/dashboard/announcementTemplatesApi';
import { ApiError } from '../../lib/dashboard/api';
import {
  esc,
  kidTurma,
  needsSignature,
  STUDENTS,
  type EmailTpl,
  type Par,
} from '../../lib/dashboard/data';
import { CSelect, type CSelectItem } from '../../components/dashboard/ui/CSelect';
import { Modal } from '../../components/dashboard/ui/Modal';
import { EmptyState } from '../../components/dashboard/ui/EmptyState';
import { useToast } from '../../components/dashboard/ui/Toast';
import { WAIcon } from '../../components/dashboard/ui/icons';
import { inputCls } from '../../components/dashboard/ui/inputs';
import { LOGOS } from '../../lib/dashboard/theme';
import { NtBox } from './alunos/common';

/* Tela COMUNICADOS — port 1:1 da seção data-view="emails" do dashboard.html
   (markup l.786–858; JS: renderEmails l.2338, modelos+variáveis l.4443–4540,
   canais l.4543–4559, sendComm l.4561, pré-visualização l.4569–4627).
   Composição com variáveis {{nome_responsavel}}/{{nome_aluno}}, canais
   e-mail/WhatsApp/ambos (WhatsApp = mensagem preparada por família), público
   via cselect, preview "como a família recebe", envio com trava de duplo-clique
   + toast + logAct, histórico e a seção de automáticos. */

type Channel = 'email' | 'wa' | 'both';

/* ícones dos modelos — o preview guarda o NOME lucide (EMAIL_TPLS[].ic) */
const TPL_ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  'file-clock': FileClock,
  megaphone: Megaphone,
  'file-text': FileText,
};
const TplIcon = ({ t, className = 'w-4 h-4' }: { t: EmailTpl; className?: string }) => {
  const Icon = TPL_ICONS[t.ic] ?? FileText;
  return <Icon className={className} style={{ color: t.col }} />;
};

/* canais do servidor (AnnChannel[]) → ícone da tela ('email'|'wa'|'both') */
const chanOf = (channels: AnnChannel[]): Channel => {
  const email = channels.includes('email'), wa = channels.includes('whatsapp');
  return email && wa ? 'both' : wa ? 'wa' : 'email';
};
/* tempo relativo do envio (agora / há N min / há N h / há N dias / data) */
function relTime(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000), h = Math.round(diff / 3600000), d = Math.round(diff / 86400000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  if (h < 24) return `há ${h} h`;
  if (d < 30) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

/* estado da composição sobrevive à ida e volta de tela — cache de módulo,
   mesmo papel do estado global do preview (defaults l.817/825) */
const cache = {
  subject: 'Recesso de julho — calendário atualizado 📅',
  body: 'Olá, {{nome_responsavel}}! Passando para avisar sobre o calendário de julho...',
  channel: 'email' as Channel,
  to: 'all',
};

/* ícone do canal no histórico (port chIcon l.2344) */
function ChIcon({ ch }: { ch: Channel }) {
  if (ch === 'wa')
    return (
      <span style={{ color: '#1faa53' }}>
        <WAIcon className="w-4 h-4" />
      </span>
    );
  if (ch === 'both')
    return (
      <span className="flex items-center gap-0.5">
        <Mail className="w-3.5 h-3.5 text-brand-light" />
        <span style={{ color: '#1faa53' }}>
          <WAIcon className="w-3.5 h-3.5" />
        </span>
      </span>
    );
  return <Mail className="w-4 h-4 text-brand-light" />;
}

/* pill "Ativo" dos automáticos */
const AtivoPill = () => (
  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(22,163,74,.10)', color: '#16a34a' }}>
    Ativo
  </span>
);

type ModalState =
  | { t: 'preview' }
  | { t: 'manage' }
  | { t: 'edit'; k: string | null }
  | { t: 'del'; k: string }
  | null;

export default function Comunicados() {
  useDash();
  const { toast } = useToast();

  const [subject, setSubjectState] = useState(cache.subject);
  const [body, setBodyState] = useState(cache.body);
  const [channel, setChannelState] = useState<Channel>(cache.channel);
  const [to, setToState] = useState(cache.to);
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [tpls, setTpls] = useState<EmailTpl[]>([]);
  const [hist, setHist] = useState<AnnouncementItem[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /* histórico real (GET /api/announcements). 403 (papel sem acesso) = sem itens. */
  const loadHist = async () => {
    try {
      const r = await listAnnouncementsApi(1, 20);
      setHist(r.items);
    } catch {
      setHist([]);
    } finally {
      setHistLoading(false);
    }
  };
  /* modelos reais (GET /api/announcement-templates). */
  const reloadTpls = async () => {
    try {
      setTpls(await listTemplatesApi());
    } catch {
      setTpls([]);
    }
  };
  useEffect(() => {
    loadHist();
    reloadTpls();
  }, []);

  const setSubject = (v: string) => {
    cache.subject = v;
    setSubjectState(v);
  };
  const setBody = (v: string) => {
    cache.body = v;
    setBodyState(v);
  };
  const setChannel = (v: Channel) => {
    cache.channel = v;
    setChannelState(v);
  };
  const setTo = (v: string) => {
    cache.to = v;
    setToState(v);
  };

  /* público (port l.3937): contagens por FAMÍLIA (= unidade do envio no servidor)
     derivadas da base já carregada; o servidor resolve a mesma audiência. */
  const actE = STUDENTS.filter((s) => s.active !== false);
  const famDay = (par: Par) => actE.filter((s) => s.kids.some((k) => kidTurma(k)?.par === par)).length;
  const nPend = actE.filter(needsSignature).length;
  const toItems: CSelectItem[] = [
    { v: 'all', l: `Todos os responsáveis (${actE.length})` },
    { v: 'sq', l: `Apenas turmas de Seg/Qua (${famDay('seg-qua')})` },
    { v: 'tq', l: `Apenas turmas de Ter/Qui (${famDay('ter-qui')})` },
    { v: 'pend', l: `Contratos pendentes (${nPend})` },
  ];
  const audienceN = to === 'sq' ? famDay('seg-qua') : to === 'tq' ? famDay('ter-qui') : to === 'pend' ? nPend : actE.length;

  /* mapeia a escolha da tela para o que o backend espera */
  const channelsOf = (ch: Channel): AnnChannel[] => (ch === 'email' ? ['email'] : ch === 'wa' ? ['whatsapp'] : ['email', 'whatsapp']);
  const audienceOf = (v: string): AudienceFilter => {
    // escopa SEMPRE ao período corrente: sem isso o backend resolveria a
    // audiência sobre todos os semestres e o comunicado atingiria famílias
    // antigas (a contagem da tela é só do período atual).
    const period = currentPeriod();
    return v === 'sq'
      ? { period, dayPair: 'seg-qua' }
      : v === 'tq'
        ? { period, dayPair: 'ter-qui' }
        : v === 'pend'
          ? { period, pendingContract: true }
          : { period, status: 'active' };
  };

  /* port applyEmailTpl (l.4455) */
  const applyTpl = (k: string) => {
    const t = tpls.find((x) => x.k === k);
    if (!t) return;
    setSubject(t.s);
    setBody(t.b);
    toast('Modelo aplicado — ajuste o texto e envie.');
  };

  /* port insertVar (l.4535): insere onde o cursor estiver */
  const insertVar = (token: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? body.length;
    const next = body.slice(0, pos) + token + body.slice(pos);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = pos + token.length;
    });
  };

  /* envio real (POST /api/announcements) + trava de duplo-clique ("Enviando…") */
  const sendComm = async () => {
    if (sending) return;
    const subj = subject.trim(), msg = body.trim();
    if (!subj) return toast('Escreva um assunto para o comunicado.');
    if (!msg) return toast('Escreva a mensagem do comunicado.');
    if (!audienceN) return toast('Ninguém nessa audiência ainda — escolha outro público.');
    setSending(true);
    const res = await sendAnnouncement({ subject: subj, body: msg, channels: channelsOf(channel), audienceFilter: audienceOf(to) });
    setSending(false);
    if (!res.ok || !res.result) return toast(res.ok ? 'Não foi possível enviar o comunicado.' : res.error);
    const { sent, prepared, failed, recipients } = res.result;
    await loadHist();
    if (!recipients) return toast('Ninguém nessa audiência — nada foi enviado.');
    if (failed && !sent && !prepared) return toast('Não foi possível entregar — confira os contatos das famílias.');
    const fam = (n: number) => `${n} ${n === 1 ? 'responsável' : 'responsáveis'}`;
    const conv = (n: number) => `${n} ${n === 1 ? 'conversa' : 'conversas'} de WhatsApp`;
    toast(
      channel === 'email'
        ? `Comunicado enviado por e-mail para ${fam(sent)}!`
        : channel === 'wa'
          ? `${conv(prepared)} na fila!`
          : `E-mails enviados (${sent}) e ${conv(prepared)} preparadas!`,
    );
  };

  /* port commTexts (l.4569): variáveis viram dados de exemplo no preview */
  const previewTexts = () => ({
    subj: subject,
    body: body.replace(/\{\{nome_responsavel\}\}/g, 'Mariana').replace(/\{\{nome_aluno\}\}/g, 'Helena'),
  });

  return (
    <section className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold">Comunicados</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">
            Escreva o aviso uma vez — cada família recebe por e-mail, WhatsApp ou os dois
          </p>
        </div>
      </div>
      <div className="grid lg:grid-cols-5 gap-4 items-start">
        {/* escrever aviso */}
        <div className="surface rounded-2xl overflow-hidden lg:col-span-3">
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl grid place-content-center" style={{ background: 'rgba(47,83,154,.10)' }}>
              <Send className="w-5 h-5 text-brand-light" />
            </div>
            <div>
              <h3 className="font-heading font-semibold">Escrever comunicado</h3>
              <p className="text-xs text-[var(--muted)]">Cada responsável recebe com o próprio nome, no canal que você escolher</p>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <span className="text-sm font-medium">
                Comece por um modelo <span className="font-normal text-xs text-[var(--muted)]">(opcional — já vem escrito)</span>
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {tpls.map((t) => (
                  <button
                    key={t.k}
                    onClick={() => applyTpl(t.k)}
                    className="flex items-center gap-2 h-9 px-3 rounded-xl border border-[var(--border)] text-[13px] font-medium hover:bg-[var(--hover)] transition"
                  >
                    <TplIcon t={t} />
                    {t.l}
                  </button>
                ))}
                <button
                  onClick={() => setModal({ t: 'manage' })}
                  data-tip="Criar, editar ou excluir modelos de comunicado"
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-dashed border-[var(--border)] text-[13px] font-medium text-[var(--muted)] hover:bg-[var(--hover)] transition"
                >
                  <Settings2 className="w-4 h-4" />
                  Gerenciar modelos
                </button>
              </div>
            </div>
            <div className="h-px mb-4" style={{ background: 'var(--border)' }} />
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-sm font-medium">Para quem vai</span>
                <div className="mt-1.5">
                  <CSelect value={to} items={toItems} onChange={setTo} block ariaLabel="Para quem vai o comunicado" />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Por onde vai</span>
                <div className="mt-1.5 flex items-center bg-[var(--hover)] rounded-xl p-1 w-fit">
                  {(
                    [
                      ['email', <Mail key="i" className="w-4 h-4" />, 'E-mail'],
                      [
                        'wa',
                        <span key="i" style={{ color: '#1faa53' }}>
                          <WAIcon className="w-4 h-4" />
                        </span>,
                        'WhatsApp',
                      ],
                      ['both', null, 'Ambos'],
                    ] as const
                  ).map(([ch, icon, label]) => (
                    <button
                      key={ch}
                      onClick={() => setChannel(ch)}
                      className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13px] font-medium transition ${channel === ch ? 'bg-[var(--card)] shadow-sm' : 'text-[var(--muted)]'}`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <label className="block mb-3">
              <span className="text-sm font-medium">Assunto</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none focus:ring-2 ring-brand-light"
              />
            </label>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">Mensagem</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => insertVar('{{nome_responsavel}}')}
                  data-tip="Insere o nome do responsável onde o cursor estiver"
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg transition hover:brightness-95"
                  style={{ background: 'rgba(245,183,0,.16)', color: '#B5860B' }}
                >
                  + nome do responsável
                </button>
                <button
                  onClick={() => insertVar('{{nome_aluno}}')}
                  data-tip="Insere o nome do aluno onde o cursor estiver"
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg transition hover:brightness-95"
                  style={{ background: 'rgba(47,83,154,.12)', color: '#2F539A' }}
                >
                  + nome do aluno
                </button>
              </div>
            </div>
            <textarea
              ref={bodyRef}
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-sm outline-none focus:ring-2 ring-brand-light resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setModal({ t: 'preview' })}
                data-tour="prevbtn"
                className="h-10 px-4 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Ver como chega
              </button>
              {/* botão de envio muda com o canal (port setCommChannel l.4550) */}
              <button
                onClick={sendComm}
                disabled={sending}
                className="h-10 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-70"
                style={{ background: channel === 'wa' ? '#25D366' : 'linear-gradient(135deg,#1E3765,#2F539A)' }}
              >
                {channel === 'wa' ? <WAIcon className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {sending ? 'Enviando…' : channel === 'wa' ? 'Preparar WhatsApp' : channel === 'both' ? 'Enviar e-mail + WhatsApp' : 'Enviar e-mail'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* últimos envios */}
          <div className="surface rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 rounded-xl grid place-content-center" style={{ background: 'rgba(22,163,74,.10)' }}>
                <MailCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Últimos envios</h3>
                <p className="text-xs text-[var(--muted)]">O que já foi mandado</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {histLoading ? (
                <div className="grid place-content-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-brand-light animate-spin" />
                </div>
              ) : !hist.length ? (
                <EmptyState
                  icon={Megaphone}
                  title="Nenhum comunicado enviado"
                  sub="O histórico de e-mails e mensagens enviados à comunidade vai ficar aqui."
                />
              ) : (
                hist.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--hover)' }}>
                    <div className="w-9 h-9 rounded-lg grid place-content-center bg-[var(--card)]">
                      <ChIcon ch={chanOf(e.channels)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.subject}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {e.recipientCount} {e.recipientCount === 1 ? 'família' : 'famílias'} · {relTime(e.sentAt)}
                      </p>
                    </div>
                    {e.status === 'failed' ? (
                      <Info className="w-4 h-4" style={{ color: '#DC2626' }} />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* automáticos */}
          <div className="surface rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 rounded-xl grid place-content-center" style={{ background: 'rgba(124,58,237,.10)' }}>
                <Zap className="w-5 h-5" style={{ color: '#7C3AED' }} />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Automáticos</h3>
                <p className="text-xs text-[var(--muted)]">O sistema manda sozinho, sem você fazer nada</p>
              </div>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Confirmação de matrícula recebida</span>
                <AtivoPill />
              </div>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span data-tip="Assim que a matrícula chega, o Autentique manda o link de assinatura por WhatsApp e e-mail">
                  Contrato → Autentique (link por WhatsApp + e-mail)
                </span>
                <AtivoPill />
              </div>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span data-tip="Contrato enviado há 7 dias sem assinatura gera aviso no sininho">
                  Aviso de contrato parado (7 dias sem assinar)
                </span>
                <AtivoPill />
              </div>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span>Recuperação de senha do painel</span>
                <AtivoPill />
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal?.t === 'preview' && <PreviewModal channel={channel} {...previewTexts()} onClose={() => setModal(null)} />}
      {modal?.t === 'manage' && (
        <ManageModal
          tpls={tpls}
          onClose={() => setModal(null)}
          onEdit={(k) => setModal({ t: 'edit', k })}
          onDelete={(k) => setModal({ t: 'del', k })}
        />
      )}
      {modal?.t === 'edit' && (
        <TplEditModal
          k={modal.k}
          tpls={tpls}
          draftSubject={subject}
          draftBody={body}
          onBack={() => setModal({ t: 'manage' })}
          onSaved={async (msg) => {
            await reloadTpls();
            setModal({ t: 'manage' });
            toast(msg);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.t === 'del' && (
        <TplDeleteModal
          k={modal.k}
          tpls={tpls}
          onBack={() => setModal({ t: 'manage' })}
          onDeleted={async (msg) => {
            await reloadTpls();
            setModal({ t: 'manage' });
            toast(msg);
          }}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}

/* ====================== "VER COMO CHEGA" (port openCommPreview l.4616) ====================== */

function PreviewModal({ channel, subj, body, onClose }: { channel: Channel; subj: string; body: string; onClose: () => void }) {
  return (
    <Modal
      title="Como a família recebe"
      onClose={onClose}
      size="max-w-lg"
      footer={
        <button onClick={onClose} className="w-full h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
          Fechar
        </button>
      }
    >
      <div className="p-5 pb-2">
        {channel !== 'wa' && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Por e-mail</p>
            {/* barra do cliente de e-mail (estilo Gmail) + template da marca (port emailPreviewCard l.4575) */}
            <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                <div
                  className="w-9 h-9 rounded-full grid place-content-center text-white text-xs font-bold shrink-0"
                  style={{ background: '#1E3765' }}
                >
                  EP
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-[13px] text-slate-800 truncate">
                    <strong>English Patio</strong> <span className="text-slate-400 font-normal">&lt;contato@englishpatio.com.br&gt;</span>
                  </p>
                  <p className="text-[11px] text-slate-400">para Mariana Duarte Lima ▾</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">16h32 ☆</span>
              </div>
              <div className="p-4 sm:p-5" style={{ background: '#eef1f6' }}>
                <div className="max-w-[400px] mx-auto rounded-xl overflow-hidden shadow-md bg-white">
                  <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}>
                    <img src={LOGOS.blue} alt="English Patio" className="h-8 w-auto" />
                  </div>
                  <div className="px-5 py-5 text-slate-800">
                    <p className="font-heading font-semibold text-[15px] mb-3" style={{ color: '#1E3765' }}>
                      {subj}
                    </p>
                    <p className="text-[13px] leading-relaxed whitespace-pre-line">{body}</p>
                    <span
                      className="inline-block mt-4 text-[12px] font-bold px-4 py-2 rounded-lg"
                      style={{ background: '#F5B700', color: '#15294d' }}
                    >
                      Falar com a escola
                    </span>
                  </div>
                  <div
                    className="px-5 py-3.5 text-center text-[10px] leading-relaxed text-slate-400 border-t border-slate-100"
                    style={{ background: '#f8fafc' }}
                  >
                    English Patio · Av. F, 1541 — Água Branca, Goiânia/GO
                    <br />
                    Você recebeu este e-mail porque é responsável por um aluno da escola.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {channel !== 'email' && (
          <>
            {channel === 'both' && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mt-5 mb-2">No WhatsApp</p>
            )}
            {/* conversa de WhatsApp (port waPreviewCard l.4605) */}
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2.5 flex items-center gap-2.5" style={{ background: '#075E54' }}>
                <div
                  className="w-8 h-8 rounded-full grid place-content-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: '#128C7E' }}
                >
                  MD
                </div>
                <div className="leading-tight">
                  <p className="text-white text-sm font-medium">Mariana Duarte Lima</p>
                  <p className="text-[10px] text-white/70">online</p>
                </div>
              </div>
              <div className="p-4" style={{ background: '#e5ddd5' }}>
                <div className="max-w-[88%] rounded-xl rounded-tl-none bg-white p-3 text-[13px] text-slate-800 shadow whitespace-pre-line">
                  {body}
                  <span className="block text-right text-[10px] text-slate-400 mt-1">16h32 ✓✓</span>
                </div>
              </div>
            </div>
          </>
        )}
        <p className="text-xs text-[var(--muted)] mt-3 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> {'{{nome_responsavel}}'} e {'{{nome_aluno}}'} foram substituídos por dados de exemplo.
        </p>
      </div>
    </Modal>
  );
}

/* ====================== GERENCIAR MODELOS (port openTplManage l.4462) ====================== */

function ManageModal({
  tpls,
  onClose,
  onEdit,
  onDelete,
}: {
  tpls: EmailTpl[];
  onClose: () => void;
  onEdit: (k: string | null) => void;
  onDelete: (k: string) => void;
}) {
  return (
    <Modal
      title="Modelos de comunicado"
      onClose={onClose}
      size="max-w-lg"
      footer={
        <button onClick={onClose} className="w-full h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
          Fechar
        </button>
      }
    >
      <div className="p-5 pb-2 space-y-3">
        {tpls.length ? (
          tpls.map((t) => (
            <div key={t.k} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--hover)' }}>
              <div className="w-9 h-9 rounded-lg grid place-content-center shrink-0 bg-[var(--card)]">
                <TplIcon t={t} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.l}</p>
                <p className="text-xs text-[var(--muted)] truncate">{t.s}</p>
              </div>
              <button
                onClick={() => onEdit(t.k)}
                data-tip="Editar este modelo"
                className="w-8 h-8 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--card)] transition"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(t.k)}
                data-tip="Excluir este modelo"
                className="w-8 h-8 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--card)] transition"
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)] text-center py-4">Nenhum modelo salvo — crie o primeiro.</p>
        )}
        <button
          onClick={() => onEdit(null)}
          className="w-full h-10 rounded-xl border border-dashed border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo modelo
        </button>
        <p className="text-xs text-[var(--muted)] flex items-start gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#F5B700' }} />
          <span>
            Ao criar um modelo novo, o assunto e o texto que já estiverem escritos no comunicado vêm preenchidos — é só dar um nome e
            salvar.
          </span>
        </p>
      </div>
    </Modal>
  );
}

/* ====================== EDITAR/CRIAR MODELO (port openTplEdit/saveTplEdit l.4477/4499) ====================== */

function TplEditModal({
  k,
  tpls,
  draftSubject,
  draftBody,
  onBack,
  onSaved,
  onClose,
}: {
  k: string | null;
  tpls: EmailTpl[];
  draftSubject: string;
  draftBody: string;
  onBack: () => void;
  onSaved: (msg: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = k ? tpls.find((x) => x.k === k) ?? null : null;
  /* novo modelo herda o que já está escrito no comunicado (l.4480) */
  const [nome, setNome] = useState(t ? t.l : '');
  const [s, setS] = useState(t ? t.s : draftSubject.trim());
  const [b, setB] = useState(t ? t.b : draftBody.trim());
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const l = nome.trim(), sv = s.trim(), bv = b.trim();
    if (!l) return setErr('Dê um nome ao modelo — é ele que aparece no botão.');
    if (!sv || !bv) return setErr('Preencha o assunto e o texto do modelo.');
    if (tpls.some((x) => x.l.toLowerCase() === l.toLowerCase() && x.k !== k))
      return setErr(`Já existe um modelo chamado <b>${esc(l)}</b> — escolha outro nome.`);
    setBusy(true);
    try {
      if (k) await updateTemplateApi(k, { name: l, subject: sv, body: bv });
      else await createTemplateApi({ name: l, subject: sv, body: bv });
      await onSaved(k ? 'Modelo atualizado!' : 'Modelo criado — já aparece nos botões.');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Não foi possível salvar o modelo.');
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t ? 'Editar modelo' : 'Novo modelo'}
      onClose={onClose}
      size="max-w-lg"
      footer={
        <>
          <button onClick={onBack} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
            Voltar
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            {busy ? 'Salvando…' : t ? 'Salvar alterações' : 'Criar modelo'}
          </button>
        </>
      }
    >
      <div className="p-5 pb-2 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">
            Nome do modelo <span className="text-[var(--muted)] font-normal text-xs">(aparece no botão)</span>
          </span>
          <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Reunião de pais" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Assunto</span>
          <input value={s} onChange={(e) => setS(e.target.value)} placeholder="Assunto do e-mail" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Texto</span>
          <textarea
            rows={7}
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="Olá, {{nome_responsavel}}!…"
            className={`${inputCls} h-auto py-2.5 resize-none`}
          />
        </label>
        <p className="text-xs text-[var(--muted)]">
          Use {'{{nome_responsavel}}'} e {'{{nome_aluno}}'} — cada família recebe com os próprios nomes.
        </p>
        <NtBox msg={err} kind="err" />
      </div>
    </Modal>
  );
}

/* ====================== EXCLUIR MODELO (port deleteEmailTpl/confirmDeleteEmailTpl l.4513/4528) ====================== */

function TplDeleteModal({
  k,
  tpls,
  onBack,
  onDeleted,
  onClose,
}: {
  k: string;
  tpls: EmailTpl[];
  onBack: () => void;
  onDeleted: (msg: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = tpls.find((x) => x.k === k);
  const [busy, setBusy] = useState(false);
  if (!t) return null;
  const confirm = async () => {
    setBusy(true);
    try {
      await deleteTemplateApi(k);
      await onDeleted(`Modelo “${t.l}” excluído.`);
    } catch {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Excluir modelo"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onBack}
            className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold transition hover:brightness-110 disabled:opacity-60"
            style={{ background: '#DC2626' }}
          >
            {busy ? 'Excluindo…' : 'Excluir modelo'}
          </button>
        </>
      }
    >
      <div className="p-5 pb-2">
        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,.06)' }}>
          <div className="w-10 h-10 rounded-xl grid place-content-center shrink-0" style={{ background: 'rgba(220,38,38,.12)' }}>
            <Trash2 className="w-5 h-5" style={{ color: '#DC2626' }} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">Excluir o modelo “{t.l}”?</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">Os comunicados já enviados não mudam — só o botão de modelo some.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
