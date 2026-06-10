import { useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowRightLeft, Info, Pencil, Trash2 } from 'lucide-react';
import {
  FAMS,
  HORAS,
  NIVEIS,
  SALAS,
  type Par,
  activeKidsIn,
  esc,
  famC,
  horaPeriodo,
  kidsOfTurma,
  isNovo,
  nivelLabel,
  novoTag,
  palette,
  salaById,
  schLabel,
  turmaById,
  turmaFull,
  turmaShort,
} from '../../../lib/dashboard/data';
import { addTurma, deleteTurma, logAct, updateTurma } from '../../../lib/dashboard/store';
import { initials, useAuth } from '../../../lib/dashboard/auth';
import { Modal } from '../../dashboard/ui/Modal';
import { CSelect, type CSelectItem } from '../../dashboard/ui/CSelect';
import { inputCls } from '../../dashboard/ui/inputs';
import { useToast } from '../../dashboard/ui/Toast';

/* CRUD de turma — port 1:1 de openNewTurma/agSaveTurma (l.3028/3055),
   openTurmaModal/agUpdateTurma (l.3065/3110) e agDeleteTurma (l.3130). */

/* níveis agrupados por família, com a bolinha da cor (nivelPickItems, l.3012) */
export function nivelPickItems(): CSelectItem[] {
  const out: CSelectItem[] = [];
  Object.entries(FAMS).forEach(([fk, f]) =>
    NIVEIS.filter((n) => n.fam === fk).forEach((n) => out.push({ v: n.k, l: n.n, dot: f.c })),
  );
  return out;
}

/* caixa vermelha de erro (ntErrBox, l.3017) — a mensagem pode ter <b> */
function ErrBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div
      className="rounded-xl p-2.5 text-xs flex items-start gap-2"
      style={{ background: 'rgba(220,38,38,.08)', color: '#DC2626' }}
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span dangerouslySetInnerHTML={{ __html: msg }} />
    </div>
  );
}

/* aviso amarelo: situação suspeita mas possivelmente legítima (ntWarnBox, l.3023) */
function WarnBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div
      className="rounded-xl p-2.5 text-xs flex items-start gap-2"
      style={{ background: 'rgba(245,183,0,.12)', color: '#B5860B' }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span dangerouslySetInnerHTML={{ __html: msg }} />
    </div>
  );
}

interface NewTurmaModalProps {
  sala?: string | null;
  par?: Par | null;
  hora?: string | null;
  nivel?: string | null;
  defaultPar: Par;
  onClose: () => void;
}

export function NewTurmaModal({ sala, par, hora, nivel, defaultPar, onClose }: NewTurmaModalProps) {
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const [vSala, setVSala] = useState(sala || SALAS[0].id);
  const [vPar, setVPar] = useState<Par>(par || defaultPar);
  const [vHora, setVHora] = useState(hora || '13:30');
  const [vNivel, setVNivel] = useState(nivel || 'conv-1');
  const [cap, setCap] = useState('7');
  const [err, setErr] = useState('');

  const save = () => {
    const capN = parseInt(cap, 10);
    const res = addTurma({ sala: vSala, par: vPar, hora: vHora, nivel: vNivel, cap: capN });
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onClose();
    logAct(
      effectiveUser?.name ?? 'Painel',
      `Criou a turma <b>${esc(salaById(vSala)!.n)} · ${schLabel(vPar)} ${vHora}</b> (${nivelLabel(vNivel)}, ${capN} vagas)`,
    );
    toast(`Turma de ${nivelLabel(vNivel)} criada na ${salaById(vSala)!.n}!`);
  };

  return (
    <Modal
      title="Nova turma"
      onClose={onClose}
      size="max-w-lg"
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
            Cancelar
          </button>
          <button
            onClick={save}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            Criar turma
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-sm font-medium">Sala</span>
            <div className="mt-1.5">
              <CSelect value={vSala} onChange={setVSala} block items={SALAS.map((s) => ({ v: s.id, l: s.n, dot: s.c }))} />
            </div>
          </div>
          <div>
            <span className="text-sm font-medium">Dias</span>
            <div className="mt-1.5">
              <CSelect
                value={vPar}
                onChange={(v) => setVPar(v as Par)}
                block
                items={[
                  { v: 'seg-qua', l: 'Seg/Qua' },
                  { v: 'ter-qui', l: 'Ter/Qui' },
                ]}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-sm font-medium">Horário</span>
            <div className="mt-1.5">
              <CSelect
                value={vHora}
                onChange={setVHora}
                block
                items={HORAS.map((h) => ({ v: h, l: `${h} · ${horaPeriodo(h) === 'm' ? 'manhã' : 'tarde'}` }))}
              />
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium">
              Vagas <span className="text-xs font-normal text-[var(--muted)]">(padrão e máximo: 7)</span>
            </span>
            <input
              value={cap}
              inputMode="numeric"
              onChange={(e) => setCap(e.target.value.replace(/\D/g, '').slice(0, 1))}
              className={inputCls}
            />
          </label>
        </div>
        <div>
          <span className="text-sm font-medium">Nível</span>
          <div className="mt-1.5">
            <CSelect value={vNivel} onChange={setVNivel} block items={nivelPickItems()} />
          </div>
        </div>
        <ErrBox msg={err} />
        <p className="text-xs text-[var(--muted)] flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            O teacher vem da <b>sala</b> (defina no botão "Salas") e aparece na agenda e nas imagens quando preenchido.
          </span>
        </p>
      </div>
    </Modal>
  );
}

interface TurmaModalProps {
  tid: number;
  onClose: () => void;
  onMoveKid: (sid: number, ki: number) => void;
  onOpenDelete: (tid: number) => void;
}

export function TurmaModal({ tid, onClose, onMoveKid, onOpenDelete }: TurmaModalProps) {
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const t = turmaById(tid);
  const [vNivel, setVNivel] = useState(t?.nivel ?? 'conv-1');
  const [vSala, setVSala] = useState(t?.sala ?? SALAS[0].id);
  const [vPar, setVPar] = useState<Par>(t?.par ?? 'seg-qua');
  const [vHora, setVHora] = useState(t?.hora ?? '13:30');
  const [cap, setCap] = useState(String(t?.cap ?? 7));
  const [err, setErr] = useState<{ kind: 'err' | 'warn'; msg: string } | null>(null);
  /* mudar o nível de uma turma COM alunos pede um segundo clique (etWarnOk, l.3067) */
  const [warnOk, setWarnOk] = useState(false);

  if (!t) return null;
  const sala = salaById(t.sala)!;
  const list = kidsOfTurma(tid);
  const occ = list.length;

  const save = () => {
    const capN = parseInt(cap, 10);
    /* mesma precedência do preview: erros de capacidade/slot vêm antes do aviso de nível */
    const maxCap = Math.max(7, t.cap);
    if (!(capN >= 1 && capN <= maxCap)) {
      setErr({ kind: 'err', msg: `Vagas entre 1 e ${maxCap}${maxCap > 7 ? ' (esta turma tem vaga extra aberta)' : ''} — o padrão da escola é 7.` });
      return;
    }
    if (capN < occ) {
      setErr({ kind: 'err', msg: `A turma tem ${occ} aluno${occ > 1 ? 's' : ''} — a capacidade não pode ficar menor que isso.` });
      return;
    }
    if (vNivel !== t.nivel && occ > 0 && !warnOk) {
      setWarnOk(true);
      setErr({
        kind: 'warn',
        msg: `Esta turma tem <b>${occ} aluno${occ > 1 ? 's' : ''}</b> — mudar o nível de <b>${nivelLabel(t.nivel)}</b> para <b>${nivelLabel(vNivel)}</b> muda a turma inteira. <b>Se for isso mesmo, clique de novo em "Salvar alterações".</b>`,
      });
      return;
    }
    const res = updateTurma(tid, { sala: vSala, par: vPar, hora: vHora, nivel: vNivel, cap: capN });
    if (!res.ok) {
      setWarnOk(false);
      setErr({ kind: 'err', msg: res.error });
      return;
    }
    onClose();
    logAct(effectiveUser?.name ?? 'Painel', `Editou a turma <b>${turmaShort(t)}</b> (${nivelLabel(t.nivel)}, ${capN} vagas)`);
    toast('Turma atualizada!');
  };

  return (
    <Modal
      title={`Turma · ${sala.n}`}
      onClose={onClose}
      size="max-w-lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition"
          >
            Fechar
          </button>
          <button
            onClick={() => onOpenDelete(tid)}
            disabled={occ > 0}
            className="flex-1 h-11 rounded-xl text-sm font-semibold border transition disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[var(--hover)]"
            style={{ borderColor: 'rgba(220,38,38,.4)', color: '#DC2626' }}
            data-tip={occ ? 'Só turmas vazias podem ser excluídas — mova os alunos antes' : 'Excluir esta turma'}
          >
            <Trash2 className="w-4 h-4 inline -mt-0.5" /> Excluir turma
          </button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: `${sala.c}1f` }}>
          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: sala.c }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {schLabel(t.par)} · {t.hora} <span style={{ color: famC(t.nivel) }}>· {nivelLabel(t.nivel)}</span>
            </p>
            <p className="text-xs text-[var(--muted)]">
              {sala.prof ? 'Teacher ' + sala.prof : 'sem teacher definido'} · {occ}/{t.cap} aluno{occ === 1 ? '' : 's'}
              {turmaFull(t) && (
                <>
                  {' '}
                  · <b style={{ color: '#16a34a' }}>NÃO TEM VAGA</b>
                </>
              )}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Alunos</p>
          {list.length ? (
            <div className="space-y-1">
              {list.map(({ s, k, ki }) => (
                <div key={`${s.id}-${ki}`} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: 'var(--hover)' }}>
                  <span
                    className="w-7 h-7 rounded-lg grid place-content-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg,${palette[s.id % palette.length]},#2F539A)` }}
                  >
                    {initials(k.n)}
                  </span>
                  <span className="text-sm font-medium truncate text-left flex-1 min-w-0">
                    {k.n} <span className="text-xs text-[var(--muted)] font-normal">({k.age})</span>
                    {isNovo(s) && (
                      <span className="text-[9px] font-bold" style={{ color: '#E0457B' }}>
                        {' '}
                        {novoTag()}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => onMoveKid(s.id, ki)}
                    className="h-7 px-2 rounded-md text-[11px] font-semibold transition flex items-center gap-1 shrink-0 hover:ring-1 ring-brand-light"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                    data-tip="Mover de turma"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Mover
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Nenhum aluno ainda — aloque pela fila "aguardando turma" ou pela ficha do aluno.
            </p>
          )}
        </div>
        <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'var(--hover)' }}>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5 text-brand-light" /> Editar turma
          </p>
          <div className="grid grid-cols-2 gap-2">
            <CSelect value={vNivel} onChange={setVNivel} block items={nivelPickItems()} />
            <input
              value={cap}
              inputMode="numeric"
              onChange={(e) => setCap(e.target.value.replace(/\D/g, '').slice(0, 1))}
              className={inputCls}
              style={{ marginTop: 0 }}
              data-tip="Vagas (máximo 7)"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <CSelect value={vSala} onChange={setVSala} block items={SALAS.map((s) => ({ v: s.id, l: s.n.replace(' Room', ''), dot: s.c }))} />
            <CSelect
              value={vPar}
              onChange={(v) => setVPar(v as Par)}
              block
              items={[
                { v: 'seg-qua', l: 'Seg/Qua' },
                { v: 'ter-qui', l: 'Ter/Qui' },
              ]}
            />
            <CSelect value={vHora} onChange={setVHora} block items={HORAS.map((h) => ({ v: h, l: h }))} />
          </div>
          {err && (err.kind === 'err' ? <ErrBox msg={err.msg} /> : <WarnBox msg={err.msg} />)}
          <button
            onClick={save}
            className="w-full h-10 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface DeleteTurmaModalProps {
  tid: number;
  onClose: () => void;
}

export function DeleteTurmaModal({ tid, onClose }: DeleteTurmaModalProps) {
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const t = turmaById(tid);
  if (!t || activeKidsIn(tid) > 0) return null;
  const short = turmaShort(t);

  const confirm = () => {
    const res = deleteTurma(tid);
    if (!res.ok) return;
    onClose();
    logAct(effectiveUser?.name ?? 'Painel', `Excluiu a turma vazia <b>${short}</b>`);
    toast('Turma excluída.');
  };

  return (
    <Modal
      title="Excluir turma"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold transition hover:brightness-110"
            style={{ background: '#DC2626' }}
          >
            Excluir turma
          </button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,.06)' }}>
          <div className="w-10 h-10 rounded-xl grid place-content-center shrink-0" style={{ background: 'rgba(220,38,38,.12)' }}>
            <Trash2 className="w-5 h-5" style={{ color: '#DC2626' }} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">Excluir a turma {short}?</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Ela está vazia — some da grade, da página da sala e das opções de alocação.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
