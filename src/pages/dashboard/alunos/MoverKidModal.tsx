import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Hourglass, Search } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { initials, useAuth } from '../../../lib/dashboard/auth';
import { allocateKid, logAct } from '../../../lib/dashboard/store';
import {
  activeKidsIn,
  esc,
  FAMS,
  famC,
  horaPeriodo,
  kidTurma,
  nivelByK,
  nivelLabel,
  salaById,
  schLabel,
  STUDENTS,
  TURMAS,
  turmaById,
  turmaFull,
  turmaShort,
  turmaVagas,
  type Turma,
} from '../../../lib/dashboard/data';
import { avatarGrad, NtBox } from './common';

/* Mover/alocar aluno em turma — port de openMoverKid/mvPick/mvFilter/mvAskFull/
   confirmFullAlloc/confirmMoverKid (dashboard.html l.2861–3010). Turma cheia
   pode ganhar 1 vaga extra (máx. 2 além do padrão de 7), sempre com explicação
   e confirmação. */

const mvSearchStr = (t: Turma): string => {
  const sala = salaById(t.sala)!;
  const nv = nivelByK(t.nivel)!;
  return `${sala.n} ${schLabel(t.par)} ${t.par} ${t.hora} ${nivelLabel(t.nivel)} ${FAMS[nv.fam].n} ${sala.prof || 'sem teacher'} ${horaPeriodo(t.hora) === 'm' ? 'manhã matutino' : 'tarde vespertino'}`.toLowerCase();
};

export function MoverKidModal({ sid, ki, onClose }: { sid: number; ki: number; onClose: () => void }) {
  const { toast } = useToast();
  const { effectiveUser } = useAuth();
  const who = effectiveUser?.name ?? 'Equipe';
  const [sel, setSel] = useState<number | null>(null); // 0 = "deixar sem turma"
  const [q, setQ] = useState('');
  const [fullOpen, setFullOpen] = useState(false);
  const [askFull, setAskFull] = useState<number | null>(null);

  const s = STUDENTS.find((x) => x.id === sid);
  const k = s?.kids[ki];
  const cur = k ? kidTurma(k) : null;

  const { sameLvl, others, cheias } = useMemo(() => {
    if (!k) return { sameLvl: [] as Turma[], others: [] as Turma[], cheias: [] as Turma[] };
    const dest = TURMAS.filter((t) => t.id !== (cur?.id || 0) && !turmaFull(t));
    const cheias = TURMAS.filter((t) => t.id !== (cur?.id || 0) && turmaFull(t));
    const ageFit = (t: Turma) => {
      const nv = nivelByK(t.nivel)!;
      return k.age >= nv.ages[0] - 1 && k.age <= nv.ages[1] + 1;
    };
    const sameLvl = dest.filter((t) => (cur ? t.nivel === cur.nivel : ageFit(t)));
    const others = dest.filter((t) => !sameLvl.includes(t));
    return { sameLvl, others, cheias };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid, ki]);

  if (!s || !k) return null;

  const qn = q.trim().toLowerCase();
  const match = (t: Turma) => !qn || mvSearchStr(t).includes(qn);
  const sameLvlV = sameLvl.filter(match);
  const othersV = others.filter(match);
  const cheiasV = cheias.filter((t) => !qn || (mvSearchStr(t) + ' cheia').includes(qn));
  const fullVisible = fullOpen || (!!qn && cheiasV.length > 0);

  const levelWarn =
    sel && cur && turmaById(sel) && turmaById(sel)!.nivel !== cur.nivel
      ? `Mudança de nível: <b>${nivelLabel(cur.nivel)}</b> → <b>${nivelLabel(turmaById(sel)!.nivel)}</b>. Confirme se é isso mesmo.`
      : '';

  const confirm = () => {
    if (sel === null) return;
    const t = sel ? turmaById(sel) : null;
    if (sel && !t) return;
    const res = allocateKid(sid, ki, sel || null);
    if (!res.ok) {
      toast(res.error);
      return;
    }
    onClose();
    logAct(
      who,
      t
        ? cur
          ? `Moveu <b>${esc(k.n)}</b> de ${turmaShort(cur)} para <b>${turmaShort(t)}</b> (${nivelLabel(t.nivel)})`
          : `Alocou <b>${esc(k.n)}</b> na turma <b>${turmaShort(t)}</b> (${nivelLabel(t.nivel)})`
        : `Tirou <b>${esc(k.n)}</b> da turma ${turmaShort(cur!)} — voltou para a fila de alocação`,
    );
    toast(t ? `${k.n.split(' ')[0]} agora está em ${turmaShort(t)}!` : `${k.n.split(' ')[0]} voltou para a fila de alocação.`);
  };

  /* turma cheia: alocar abrindo 1 vaga extra — sempre com explicação + confirmação */
  if (askFull !== null) {
    const t = turmaById(askFull);
    if (!t) return null;
    /* no máximo 2 vagas extras além do padrão de 7 — mais que isso não cabe na sala */
    if (t.cap >= 9) {
      return (
        <Modal title="Limite de vagas extras" onClose={onClose}>
          <div className="p-5 space-y-4">
            <p className="text-sm">
              A turma <b>{turmaShort(t)}</b> já está com <b>{t.cap} lugares</b> — 2 vagas extras além do padrão de 7. Abrir mais uma
              passaria do que cabe na sala.
            </p>
            <p className="text-sm text-[var(--muted)]">Escolha outra turma com vaga ou crie uma turma nova pela Agenda.</p>
            <button onClick={() => setAskFull(null)} className="w-full h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
              Voltar
            </button>
          </div>
        </Modal>
      );
    }
    const confirmFull = () => {
      const res = allocateKid(sid, ki, t.id, { abrirVagaExtra: true });
      if (!res.ok) {
        toast(res.error);
        return;
      }
      onClose();
      logAct(
        who,
        `Abriu 1 vaga extra na turma <b>${turmaShort(t)}</b> (limite ${t.cap - 1} → ${t.cap}) e ${cur ? 'moveu' : 'alocou'} <b>${esc(k.n)}</b> nela`,
      );
      toast(`${k.n.split(' ')[0]} entrou na ${turmaShort(t)} — o limite agora é ${t.cap}.`);
    };
    return (
      <Modal
        title="Abrir uma vaga extra?"
        onClose={onClose}
        footer={
          <>
            <button
              onClick={() => setAskFull(null)}
              className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition"
            >
              Voltar
            </button>
            <button
              onClick={confirmFull}
              className="flex-1 h-11 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
            >
              Abrir vaga e alocar
            </button>
          </>
        }
      >
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--hover)' }}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: salaById(t.sala)!.c }} />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {turmaShort(t)} · {nivelLabel(t.nivel)}
              </p>
              <p className="text-xs font-semibold" style={{ color: '#16a34a' }}>
                turma cheia — {activeKidsIn(t.id)}/{t.cap} alunos
              </p>
            </div>
          </div>
          <p className="text-sm">
            Para colocar <b>{k.n.split(' ')[0]}</b> nessa turma, o limite dela aumenta em 1: de <b>{t.cap}</b> para <b>{t.cap + 1}</b>{' '}
            alunos.
          </p>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: 'rgba(245,183,0,.12)', color: '#B5860B' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Use só quando realmente couber mais uma criança na sala. A turma deixa de mostrar "NÃO TEM VAGA" até lotar de novo — e dá
              para voltar o limite depois, editando a turma.
            </span>
          </div>
        </div>
      </Modal>
    );
  }

  const row = (t: Turma) => {
    const sala = salaById(t.sala)!;
    const v = turmaVagas(t);
    const on = sel === t.id;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => setSel(t.id)}
        className="w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl border transition hover:bg-[var(--hover)]"
        style={{ borderColor: on ? '#2F539A' : 'var(--border)', background: on ? 'rgba(47,83,154,.06)' : undefined }}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sala.c }} />
        <span className="min-w-0 flex-1">
          <span className="text-sm font-medium block truncate">
            {sala.n.replace(' Room', '')} · {schLabel(t.par)} {t.hora}
          </span>
          <span className="text-[11px] block truncate" style={{ color: famC(t.nivel) }}>
            {nivelLabel(t.nivel)}
            {sala.prof ? ' · Teacher ' + sala.prof : ''}
          </span>
        </span>
        <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: '#16a34a' }}>
          {v} vaga{v > 1 ? 's' : ''}
        </span>
        <span
          className="w-5 h-5 rounded-full border grid place-content-center shrink-0 transition"
          style={{ borderColor: on ? '#2F539A' : 'var(--border)' }}
        >
          {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#2F539A' }} />}
        </span>
      </button>
    );
  };

  const fullRow = (t: Turma) => {
    const sala = salaById(t.sala)!;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => setAskFull(t.id)}
        className="w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl border transition hover:bg-[var(--hover)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sala.c }} />
        <span className="min-w-0 flex-1">
          <span className="text-sm font-medium block truncate">
            {sala.n.replace(' Room', '')} · {schLabel(t.par)} {t.hora}
          </span>
          <span className="text-[11px] block truncate" style={{ color: famC(t.nivel) }}>
            {nivelLabel(t.nivel)}
            {sala.prof ? ' · Teacher ' + sala.prof : ''}
          </span>
        </span>
        <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: '#16a34a' }}>
          {activeKidsIn(t.id)}/{t.cap}
        </span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(245,183,0,.16)', color: '#B5860B' }}>
          abrir +1 vaga
        </span>
      </button>
    );
  };

  return (
    <Modal title={cur ? 'Mover aluno de turma' : 'Alocar aluno numa turma'} size="max-w-lg" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--hover)' }}>
          <div
            className="w-10 h-10 rounded-xl grid place-content-center text-white font-semibold text-sm shrink-0"
            style={{ background: avatarGrad(s.id) }}
          >
            {initials(k.n)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {k.n} <span className="text-xs text-[var(--muted)] font-normal">({k.age} anos)</span>
            </p>
            {cur ? (
              <p className="text-xs text-[var(--muted)]">
                hoje em {turmaShort(cur)} · {nivelLabel(cur.nivel)}
              </p>
            ) : (
              <p className="text-xs font-semibold" style={{ color: '#B5860B' }}>
                aguardando turma
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 h-10" style={{ background: 'var(--hover)' }}>
          <Search className="w-4 h-4 text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por sala, nível, horário, dia, teacher…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        {sameLvlV.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
              {cur ? 'Mesmo nível (' + nivelLabel(cur.nivel) + ')' : 'Compatível com a idade'}
            </p>
            <div className="space-y-1.5">{sameLvlV.map(row)}</div>
          </div>
        )}
        {othersV.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
              Outros níveis <span className="normal-case font-normal">(muda o nível do aluno — confirme com cuidado)</span>
            </p>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">{othersV.map(row)}</div>
          </div>
        )}
        {!sameLvlV.length && !othersV.length && (
          <p className="text-sm text-[var(--muted)]">Nenhuma turma com vaga no momento — crie uma turma nova pela Agenda.</p>
        )}
        {cur && (
          <button
            type="button"
            onClick={() => setSel(0)}
            className="w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl border transition hover:bg-[var(--hover)]"
            style={{ borderColor: sel === 0 ? '#2F539A' : 'var(--border)', background: sel === 0 ? 'rgba(47,83,154,.06)' : undefined }}
          >
            <Hourglass className="w-4 h-4 shrink-0" style={{ color: '#B5860B' }} />
            <span className="text-sm font-medium flex-1">
              Deixar sem turma <span className="text-xs text-[var(--muted)] font-normal">(volta para a fila de alocação)</span>
            </span>
            <span
              className="w-5 h-5 rounded-full border grid place-content-center shrink-0 transition"
              style={{ borderColor: sel === 0 ? '#2F539A' : 'var(--border)' }}
            >
              {sel === 0 && <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#2F539A' }} />}
            </span>
          </button>
        )}
        {cheias.length > 0 && (
          <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => setFullOpen((o) => !o)}
              className="w-full flex items-center justify-between text-left py-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#B5860B' }} />
                Turmas cheias ({cheias.length}) — dá para abrir 1 vaga extra
              </span>
              <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: fullVisible ? 'rotate(180deg)' : undefined }} />
            </button>
            {fullVisible && <div className="space-y-1.5 mt-1 max-h-[180px] overflow-y-auto pr-1">{cheiasV.map(fullRow)}</div>}
          </div>
        )}
        {levelWarn && <NtBox msg={levelWarn} kind="warn" />}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition">
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={sel === null}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            {cur ? 'Mover aluno' : 'Alocar aluno'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
