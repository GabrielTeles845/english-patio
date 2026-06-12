import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarPlus,
  Download,
  Eye,
  FileClock,
  FileText,
  Hourglass,
  MapPin,
  Pencil,
  RotateCcw,
  School,
  ShieldCheck,
  UserRound,
  UserRoundX,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { initials, useAuth } from '../../../lib/dashboard/auth';
import { useDash } from '../../../lib/dashboard/store';
import {
  esc,
  famC,
  isFuture,
  isStale,
  kidTurma,
  maskCPF,
  nivelLabel,
  salaById,
  schLabel,
  staleDays,
  STUDENTS,
} from '../../../lib/dashboard/data';
import { STATUS } from '../../../lib/dashboard/status';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { WAIcon } from '../../../components/dashboard/ui/icons';
import { avatarGrad, KidTurmaChip, STATUS_INK } from './common';
import { EditEnrollmentModal } from './EditEnrollmentModal';
import { ContractModal } from './ContractModal';
import { contractDownload, contractWhatsApp } from './contractActions';
import { MoverKidModal } from './MoverKidModal';
import { reactivateWithFeedback } from './ExitModal';

/* Detalhe do aluno — port de openDetail (dashboard.html l.2173) como sub-rota
   /dashboard/alunos/:id, com voltar contextual. Supervisor vê tudo, mas sem
   os botões de escrita (Editar, Mover/Alocar, Reativar, registrar "desde"). */

function InfoRow({ label, val }: { label: string; val: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm font-medium text-right flex items-center justify-end gap-1.5">{val}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="surface rounded-2xl p-5">
      <h3 className="font-heading font-semibold flex items-center gap-2 mb-3">
        <Icon className="w-[18px] h-[18px] text-brand-light" />
        {title}
      </h3>
      {children}
    </div>
  );
}

type ModalState = null | { kind: 'edit' } | { kind: 'contract' } | { kind: 'mover'; ki: number };

export default function Detalhe() {
  useDash();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { effectiveRole, effectiveUser } = useAuth();
  const canWrite = effectiveRole !== 'Supervisor';
  const who = effectiveUser?.name ?? 'Equipe';
  const [modal, setModal] = useState<ModalState>(null);

  const sid = Number(id);
  const s = STUDENTS.find((x) => x.id === sid);

  /* a matrícula pode ter sido excluída depois (ex.: clique numa notificação antiga) */
  useEffect(() => {
    if (!s) {
      toast('Esta matrícula não existe mais — o cadastro foi excluído.');
      navigate('/dashboard/alunos', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);
  if (!s) return null;

  const st = STATUS[s.status];
  const ink = STATUS_INK[s.status];
  const inactive = s.active === false;

  const phoneVal = (phone: string, name: string) => (
    <>
      {phone}{' '}
      <button
        onClick={() => toast(`Abrindo WhatsApp de ${name}…`)}
        className="inline-grid place-content-center w-6 h-6 rounded-md transition hover:scale-110"
        style={{ background: 'rgba(37,211,102,.14)', color: '#1faa53' }}
        data-tip="WhatsApp"
      >
        <WAIcon className="w-3.5 h-3.5" />
      </button>
    </>
  );

  return (
    <section className="fade-in">
      <button
        onClick={() => navigate('/dashboard/alunos')}
        className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para alunos
      </button>

      <div className="surface rounded-2xl p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl grid place-content-center text-white font-heading text-2xl font-semibold"
              style={{ background: avatarGrad(s.id) }}
            >
              {initials(s.kids[0].n)}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold">{s.kids[0].n}</h1>
              <p className="text-[var(--muted)] text-sm">
                {s.kids.length > 1 ? s.kids.length + ' alunos (irmãos)' : '1 aluno'} · matrícula em {s.date}
                {s.hora ? ' às ' + s.hora : ''}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ color: ink.c, background: ink.bg }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: ink.c }} />
                  Contrato {st.label.toLowerCase()}
                </span>
                {[...new Map(s.kids.map((k) => [k.tid || 0, k])).values()].map((k, i) => (
                  <KidTurmaChip key={i} k={k} />
                ))}
                {s.since ? (
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-lg"
                    data-tip="Quando o aluno entrou na escola — a data da matrícula é só a última rematrícula"
                    style={{ color: 'var(--muted)', background: 'var(--hover)' }}
                  >
                    <School className="w-3 h-3 inline -mt-0.5" /> Na escola desde {s.since}
                  </span>
                ) : canWrite ? (
                  <button
                    onClick={() => setModal({ kind: 'edit' })}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg border border-dashed transition hover:bg-[var(--hover)]"
                    data-tip="Ainda não sabemos desde quando este aluno está na escola — clique para registrar"
                    style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
                  >
                    <CalendarPlus className="w-3 h-3 inline -mt-0.5" /> Registrar desde quando estuda aqui
                  </button>
                ) : null}
                {s.active !== false && isFuture(s) && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: '#fff', background: '#2F539A' }}>
                    🎒 Começa em Jul/2026
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <button
                onClick={() => setModal({ kind: 'edit' })}
                className="h-10 px-3.5 rounded-xl border border-[var(--border)] text-sm font-semibold flex items-center gap-2 hover:bg-[var(--hover)] transition"
              >
                <Pencil className="w-4 h-4" /> Editar
              </button>
            )}
            <button
              onClick={() => toast(`Abrindo WhatsApp de ${s.resp.n.split(' ')[0]}…`)}
              className="h-10 px-3.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition hover:brightness-105"
              style={{ background: '#25D366' }}
            >
              <WAIcon className="w-4 h-4" /> WhatsApp
            </button>
            <button
              onClick={() => setModal({ kind: 'contract' })}
              className="h-10 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
              style={{ background: '#1E3765' }}
            >
              <FileText className="w-4 h-4" /> Ver contrato
            </button>
          </div>
        </div>
      </div>

      {inactive && (
        <div
          className="rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3"
          style={{ background: 'rgba(100,116,139,.10)', border: '1px solid rgba(100,116,139,.25)' }}
        >
          <div className="w-10 h-10 rounded-xl grid place-content-center shrink-0" style={{ background: 'rgba(100,116,139,.15)' }}>
            <UserRoundX className="w-5 h-5" style={{ color: '#64748B' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: '#475569' }}>
              Aluno desligado da escola{s.exit ? ' em ' + s.exit.date : ''}
            </p>
            <p
              className="text-xs text-[var(--muted)]"
              dangerouslySetInnerHTML={{
                __html: s.exit ? `Motivo: <b>${esc(s.exit.label)}</b>${s.exit.note ? ' — “' + esc(s.exit.note) + '”' : ''}` : 'Matrícula inativa.',
              }}
            />
          </div>
          {canWrite && (
            <button
              onClick={() => reactivateWithFeedback(s.id, who, toast)}
              className="h-9 px-3.5 rounded-lg text-sm font-semibold border transition hover:bg-[var(--hover)]"
              style={{ borderColor: 'rgba(22,163,74,.4)', color: '#16a34a' }}
            >
              <RotateCcw className="w-3.5 h-3.5 inline -mt-0.5" /> Reativar
            </button>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Alunos" icon={Users}>
            <div className="grid sm:grid-cols-2 gap-3">
              {s.kids.map((k, ki) => {
                const t = kidTurma(k);
                return (
                  <div key={ki} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--hover)' }}>
                    <div
                      className="w-10 h-10 rounded-xl grid place-content-center text-white font-semibold text-sm shrink-0"
                      style={{ background: avatarGrad(s.id) }}
                    >
                      {initials(k.n)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{k.n}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {k.age} anos · nasc. {k.b}
                      </p>
                      {t ? (
                        <p className="text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: salaById(t.sala)!.c }} />
                          <span className="font-medium">{salaById(t.sala)!.n}</span>
                          <span className="text-[var(--muted)]">
                            · {schLabel(t.par)} {t.hora}
                          </span>
                          <span className="font-semibold" style={{ color: famC(t.nivel) }}>
                            {nivelLabel(t.nivel)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs mt-1 font-semibold flex items-center gap-1" style={{ color: '#B5860B' }}>
                          <Hourglass className="w-3 h-3" /> Aguardando turma
                        </p>
                      )}
                    </div>
                    {s.active !== false && canWrite && (
                      <button
                        onClick={() => setModal({ kind: 'mover', ki })}
                        className="ml-auto shrink-0 h-8 px-2.5 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--card)] transition flex items-center gap-1"
                        data-tip={t ? 'Mover este aluno para outra turma' : 'Colocar este aluno numa turma'}
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        {t ? 'Mover' : 'Alocar'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card title="Responsável legal" icon={UserRound}>
            <InfoRow label="Nome" val={s.resp.n} />
            <InfoRow label="Parentesco" val={s.resp.rel} />
            <InfoRow
              label="CPF"
              val={
                <>
                  {maskCPF(s.resp.cpf)} <Eye className="w-3.5 h-3.5 inline opacity-50" />
                </>
              }
            />
            <InfoRow label="Telefone" val={phoneVal(s.resp.phone, s.resp.n.split(' ')[0])} />
            <InfoRow label="E-mail" val={s.resp.email} />
            <InfoRow label="Nascimento" val={s.resp.b} />
          </Card>
          {s.second && (
            <Card title="Segundo responsável" icon={UserRound}>
              <InfoRow label="Nome" val={s.second.n} />
              <InfoRow label="Parentesco" val={s.second.rel} />
              <InfoRow label="Telefone" val={phoneVal(s.second.phone, s.second.n.split(' ')[0])} />
            </Card>
          )}
          <Card title="Endereço" icon={MapPin}>
            <InfoRow label="CEP" val={s.addr.cep} />
            <InfoRow label="Logradouro" val={`${s.addr.street}, ${s.addr.num}${s.addr.comp ? ' - ' + s.addr.comp : ''}`} />
            <InfoRow label="Bairro" val={s.addr.bairro} />
            <InfoRow label="Cidade/UF" val={`${s.addr.city}/${s.addr.uf}`} />
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Financeiro" icon={Wallet}>
            <InfoRow label="Responsável financeiro" val={s.fin} />
            <InfoRow label="Forma de pagamento" val="Boleto · carnê em 6 parcelas" />
            <InfoRow label="Mensalidade" val="R$ 460,00" />
          </Card>
          <Card title="Autorizações" icon={ShieldCheck}>
            <InfoRow
              label="Uso de imagem"
              val={s.media ? <span className="text-emerald-500">Autorizado</span> : <span className="text-[var(--muted)]">Não autorizado</span>}
            />
            <InfoRow label="Aceite do contrato" val={<span className="text-emerald-500">Sim</span>} />
            <InfoRow label="Horário confirmado" val={<span className="text-emerald-500">Sim</span>} />
          </Card>
          <Card title="Contrato" icon={FileText}>
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--hover)' }}>
              <FileText className="w-8 h-8 mx-auto text-brand-light mb-2" />
              <p className="text-sm font-medium">Contrato_{s.kids[0].n.split(' ')[0]}.pdf</p>
              <p className="text-xs text-[var(--muted)]">gerado em {s.date}</p>
              <p className="text-xs font-medium mt-0.5 mb-3" style={{ color: ink.c }}>
                {s.status === 'pending'
                  ? 'Pendente de envio ao Autentique'
                  : s.status === 'sent'
                    ? 'No Autentique — link ainda não aberto'
                    : s.status === 'viewed'
                      ? 'Visualizado pela família — falta assinar'
                      : s.status === 'rejected'
                        ? 'Recusado pela família — precisa de ação'
                        : s.status === 'failed'
                          ? 'Falha na entrega do link — reenvie'
                          : 'Assinado · registrado pelo Autentique'}
              </p>
              {isStale(s) && (
                <p
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mb-3"
                  style={{ color: '#DC2626', background: 'rgba(220,38,38,.10)' }}
                >
                  <FileClock className="w-3 h-3" />
                  parado há {staleDays(s)} dias
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => contractDownload(s, toast)}
                  className="flex-1 h-9 rounded-lg border border-[var(--border)] text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Baixar
                </button>
                <button
                  onClick={() => contractWhatsApp(s, toast)}
                  className="w-9 h-9 rounded-lg grid place-content-center text-white"
                  style={{ background: '#25D366' }}
                >
                  <WAIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {modal?.kind === 'edit' && <EditEnrollmentModal sid={s.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'contract' && <ContractModal sid={s.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'mover' && <MoverKidModal sid={s.id} ki={modal.ki} onClose={() => setModal(null)} />}
    </section>
  );
}
