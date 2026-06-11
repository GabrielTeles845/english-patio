import { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, Camera, CameraOff, Hourglass, Users } from 'lucide-react';
import {
  famC,
  kidTurma,
  nivelLabel,
  palette,
  salaById,
  schLabel,
  STUDENTS,
  type Kid,
  type Student,
} from '../../../lib/dashboard/data';
import type { ContractStatus } from '../../../lib/dashboard/status';

/* Pedaços compartilhados da tela Alunos — port 1:1 de public/dashboard.html
   (chips/células l.1945–1970, ntErrBox/ntWarnBox l.3017–3027, STATUS l.1436). */

export const avatarGrad = (id: number): string =>
  `linear-gradient(135deg,${palette[id % palette.length]},#2F539A)`;

/* cores do STATUS do preview (l.1436) para os pills inline (detalhe/contrato) */
export const STATUS_INK: Record<ContractStatus, { c: string; bg: string }> = {
  signed: { c: '#16a34a', bg: 'rgba(22,163,74,.12)' },
  viewed: { c: '#7C3AED', bg: 'rgba(124,58,237,.12)' },
  sent: { c: '#2F539A', bg: 'rgba(47,83,154,.12)' },
  pending: { c: '#B5860B', bg: 'rgba(245,183,0,.16)' },
  rejected: { c: '#DC2626', bg: 'rgba(220,38,38,.12)' },
  failed: { c: '#EA580C', bg: 'rgba(234,88,12,.12)' },
};

/* chip "Sem turma" (port l.1945) */
export function SemTurmaChip() {
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap inline-flex items-center gap-1.5"
      data-tip="Matriculado, mas ainda sem turma — aloque pela Agenda"
      style={{ color: '#B5860B', background: 'rgba(245,183,0,.14)' }}
    >
      <Hourglass className="w-3 h-3" />
      Sem turma
    </span>
  );
}

/* chip de turma de um aluno (port l.1946) */
export function KidTurmaChip({ k }: { k: Kid }) {
  const t = kidTurma(k);
  if (!t) return <SemTurmaChip />;
  const sala = salaById(t.sala)!;
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap inline-flex items-center gap-1.5"
      data-tip={`${nivelLabel(t.nivel)} · ${sala.n}${sala.prof ? ' · Teacher ' + sala.prof : ''}`}
      style={{ color: 'var(--text)', background: 'var(--hover)' }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sala.c }} />
      {sala.n.replace(' Room', '')} · {schLabel(t.par)} {t.hora}
    </span>
  );
}

/* célula de turma da tabela (port turmaCellHTML l.1952) */
export function TurmaCell({ s }: { s: Student }) {
  const infos = s.kids.map((k) => ({ k, t: kidTurma(k) }));
  /* um aluno só: formato completo em 2 linhas */
  if (infos.length === 1) {
    const { t } = infos[0];
    if (!t) return <SemTurmaChip />;
    const sala = salaById(t.sala)!;
    return (
      <div className="min-w-0">
        <p className="text-xs font-medium flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sala.c }} />
          <span className="truncate">
            {sala.n.replace(' Room', '')} · {t.hora}
          </span>
        </p>
        <p className="text-[10px] mt-0.5 font-semibold whitespace-nowrap" style={{ color: famC(t.nivel) }}>
          {nivelLabel(t.nivel)} · {schLabel(t.par)}
        </p>
      </div>
    );
  }
  /* irmãos na mesma matrícula: um bloco de turma por aluno (2 linhas, igual ao
     aluno único), alinhado com os alunos empilhados na coluna "Aluno" — sem
     espremer tudo numa linha só. */
  return (
    <div className="min-w-0 space-y-1.5">
      {infos.map(({ t }, i) => {
        if (!t)
          return (
            <div key={i} className="min-h-[42px] flex items-center">
              <SemTurmaChip />
            </div>
          );
        const sala = salaById(t.sala)!;
        return (
          <div key={i} className="min-w-0 min-h-[42px] flex flex-col justify-center">
            <p className="text-xs font-medium flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sala.c }} />
              <span className="truncate">
                {sala.n.replace(' Room', '')} · {t.hora}
              </span>
            </p>
            <p className="text-[10px] mt-0.5 font-semibold whitespace-nowrap" style={{ color: famC(t.nivel) }}>
              {nivelLabel(t.nivel)} · {schLabel(t.par)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ícone de autorização de imagem (port rowHTML l.1976) */
export function MediaIcon({ media }: { media: boolean }) {
  return media === false ? (
    <span
      className="inline-grid place-content-center w-5 h-5 rounded-md shrink-0"
      data-tip="Não autorizou uso de imagem"
      style={{ background: 'rgba(220,38,38,.10)', color: '#dc2626' }}
    >
      <CameraOff className="w-3 h-3" />
    </span>
  ) : (
    <span
      className="inline-grid place-content-center w-5 h-5 rounded-md shrink-0"
      data-tip="Autorizou uso de imagem"
      style={{ background: 'rgba(22,163,74,.10)', color: '#16a34a' }}
    >
      <Camera className="w-3 h-3" />
    </span>
  );
}

/* badge de família (mesmo responsável em mais de uma matrícula — port l.1979) */
export function FamBadge({ s }: { s: Student }) {
  const fam = STUDENTS.filter((x) => x.resp.cpf === s.resp.cpf).length;
  if (fam <= 1) return null;
  return (
    <span
      className="inline-grid place-content-center w-5 h-5 rounded-md shrink-0"
      data-tip={`Mesma família: este responsável tem ${fam} matrículas`}
      style={{ background: 'rgba(47,83,154,.12)', color: '#2F539A' }}
    >
      <Users className="w-3 h-3" />
    </span>
  );
}

/* caixinha de erro/aviso dos modais — port ntErrBox/ntWarnBox (l.3017/3023).
   msg pode conter <b> (mensagens verbatim do preview); some quando msg=''. */
export function NtBox({ msg, kind }: { msg: string; kind: 'err' | 'warn' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (msg) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [msg]);
  if (!msg) return <div ref={ref} />;
  const err = kind === 'err';
  const Icon = err ? AlertCircle : AlertTriangle;
  return (
    <div
      ref={ref}
      className="rounded-xl p-2.5 text-xs flex items-start gap-2"
      style={err ? { background: 'rgba(220,38,38,.08)', color: '#DC2626' } : { background: 'rgba(245,183,0,.12)', color: '#B5860B' }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span dangerouslySetInnerHTML={{ __html: msg }} />
    </div>
  );
}

/* botão fantasma dos empty states (port emptyGhost l.1578) */
export function EmptyGhost({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--border)] text-sm font-medium">
      {icon}
      {label}
    </button>
  );
}

/* copiar telefone do responsável (port copyPhone l.5508) */
export function copyPhone(s: Student, toast: (m: string) => void) {
  if (navigator.clipboard) navigator.clipboard.writeText(s.resp.phone).catch(() => {});
  toast('Telefone copiado: ' + s.resp.phone);
}
