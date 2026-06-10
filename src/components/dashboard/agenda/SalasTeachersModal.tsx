import { useState } from 'react';
import { DoorOpen, Info, Trash2 } from 'lucide-react';
import {
  SALAS,
  SALA_COLORS,
  TEACHERS,
  TURMAS,
  activeKidsIn,
  esc,
  salaById,
  teacherAlunos,
} from '../../../lib/dashboard/data';
import {
  addSala,
  addTeacher,
  assignTeacher,
  deleteSala,
  removeTeacher,
  updateSala,
} from '../../../lib/dashboard/store';
import { logAct, useDash } from '../../../lib/dashboard/store';
import { initials, useAuth } from '../../../lib/dashboard/auth';
import { Modal } from '../../dashboard/ui/Modal';
import { CSelect } from '../../dashboard/ui/CSelect';
import { inputCls } from '../../dashboard/ui/inputs';
import { useToast } from '../../dashboard/ui/Toast';

/* Salas & teachers — dois CRUDs separados no mesmo modal (abas) — port 1:1 de
   openSalasManage/smRender (l.3162–3216) e dos fluxos smAddSala/smRemoveSala/
   smAddTeacher/smAssignTeacher/smRemoveTeacher (l.3218–3306). */

export type SmTab = 'salas' | 'profs';

interface SalasTeachersModalProps {
  tab: SmTab;
  onTab: (t: SmTab) => void;
  onClose: () => void;
  onEditSala: (id: string) => void;
  onRemoveSala: (id: string) => void;
  onRemoveTeacher: (name: string) => void;
}

export function SalasTeachersModal({ tab, onTab, onClose, onEditSala, onRemoveSala, onRemoveTeacher }: SalasTeachersModalProps) {
  useDash();
  const { effectiveUser } = useAuth();
  const { toast, toastErr } = useToast();
  const [newSala, setNewSala] = useState('');
  const [newProf, setNewProf] = useState('');
  const who = effectiveUser?.name ?? 'Painel';

  const doAddSala = () => {
    const n = newSala.trim();
    if (!n) return;
    const res = addSala(n);
    if (!res.ok) {
      toastErr(res.error);
      return;
    }
    logAct(who, `Criou a sala <b>${esc(n)}</b>`);
    setNewSala('');
    toast(`${n} criada! Ajuste a cor no Editar, se quiser.`);
  };

  const doAddTeacher = () => {
    const n = newProf.trim();
    if (!n) return;
    const res = addTeacher(n);
    if (!res.ok) {
      toastErr(res.error);
      return;
    }
    logAct(who, `Cadastrou o teacher <b>${esc(n)}</b> (sem sala por enquanto)`);
    setNewProf('');
    toast(`${n.split(' ')[0]} cadastrado — atribua uma sala quando quiser.`);
  };

  const doAssign = (p: string, salaId: string) => {
    const old = SALAS.find((s) => s.prof === p);
    const res = assignTeacher(p, salaId);
    if (!res.ok) {
      toastErr(res.error);
      return;
    }
    if (salaId) logAct(who, `Definiu <b>${esc(p)}</b> como teacher da <b>${esc(salaById(salaId)!.n)}</b>`);
    else if (old) logAct(who, `Tirou <b>${esc(p)}</b> da <b>${esc(old.n)}</b> — ficou sem sala por enquanto`);
    toast(salaId ? `${p.split(' ')[0]} agora é teacher da ${salaById(salaId)!.n}.` : `${p.split(' ')[0]} ficou sem sala por enquanto.`);
  };

  const tabBtn = (k: SmTab, label: string) => (
    <button
      onClick={() => onTab(k)}
      className={`px-4 py-1.5 rounded-lg ${tab === k ? 'bg-[var(--card)] shadow-sm font-semibold' : 'text-[var(--muted)] font-medium'}`}
    >
      {label}
    </button>
  );

  return (
    <Modal
      title="Salas & teachers"
      onClose={onClose}
      size="max-w-lg"
      footer={
        <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
          Fechar
        </button>
      }
    >
      <div className="px-5 pt-4">
        <div className="flex items-center bg-[var(--hover)] rounded-xl p-1 text-sm w-fit">
          {tabBtn('salas', 'Salas')}
          {tabBtn('profs', 'Teachers')}
        </div>
      </div>
      <div className="p-5 pt-3">
        {tab === 'salas' ? (
          <>
            <div>
              {SALAS.map((s) => {
                const ts = TURMAS.filter((t) => t.sala === s.id);
                const nA = ts.reduce((a, t) => a + activeKidsIn(t.id), 0);
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: s.c }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.n}</p>
                      <p className="text-[11px] text-[var(--muted)] truncate">
                        {ts.length} turma{ts.length === 1 ? '' : 's'} · {nA} aluno{nA === 1 ? '' : 's'}
                        {s.prof ? ' · Teacher ' + s.prof : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => onEditSala(s.id)}
                      className="h-8 px-2.5 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--hover)] transition"
                    >
                      Editar
                    </button>
                    {!ts.length && (
                      <button
                        onClick={() => onRemoveSala(s.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--hover)] transition"
                        data-tip="Excluir sala (está vazia)"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                value={newSala}
                onChange={(e) => setNewSala(e.target.value)}
                placeholder="Nome da sala nova (ex.: Coral Room)"
                className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none focus:ring-2 ring-brand-light"
              />
              <button
                onClick={doAddSala}
                className="h-10 px-3.5 rounded-xl text-white text-sm font-semibold shrink-0"
                style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
              >
                Adicionar
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Aqui é só o cadastro da sala: <b>nome e cor</b> (a sala nova ganha uma cor livre — ajuste no Editar).
                Quem dá aula em cada sala fica na aba <b>Teachers</b>. Excluir, só sala sem turma.
              </span>
            </p>
          </>
        ) : (
          <>
            {TEACHERS.length ? (
              <div>
                {TEACHERS.map((p) => {
                  const sala = SALAS.find((s) => s.prof === p);
                  const nA = teacherAlunos(p);
                  return (
                    <div key={p} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <div
                        className="w-8 h-8 rounded-full grid place-content-center text-white text-[11px] font-bold shrink-0"
                        style={{ background: sala ? sala.c : '#94a3b8' }}
                      >
                        {initials(p)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p}</p>
                        <p className="text-[11px] text-[var(--muted)] truncate">
                          {sala ? `${nA} aluno${nA === 1 ? '' : 's'} na ${sala.n}` : 'sem sala por enquanto'}
                        </p>
                      </div>
                      <div className="w-[150px] shrink-0">
                        <CSelect
                          value={sala ? sala.id : ''}
                          onChange={(v) => doAssign(p, v)}
                          block
                          items={[{ v: '', l: 'Sem sala' }, ...SALAS.map((s) => ({ v: s.id, l: s.n.replace(' Room', ''), dot: s.c }))]}
                        />
                      </div>
                      <button
                        onClick={() => onRemoveTeacher(p)}
                        className="p-1.5 rounded-lg hover:bg-[var(--hover)] transition"
                        data-tip="Remover teacher do cadastro"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)] py-2">Nenhum teacher cadastrado ainda.</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <input
                value={newProf}
                onChange={(e) => setNewProf(e.target.value)}
                placeholder="Nome do teacher novo"
                className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none focus:ring-2 ring-brand-light"
              />
              <button
                onClick={doAddTeacher}
                className="h-10 px-3.5 rounded-xl text-white text-sm font-semibold shrink-0"
                style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
              >
                Adicionar
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Cada teacher pode ter <b>uma sala</b> no semestre — ou ficar <b>sem sala</b> por enquanto. O nome só
                aparece na agenda e nas imagens quando a sala está atribuída.
              </span>
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

/* editar sala (nome + cor da paleta) — port de openSalaEdit/saveSala (l.3309/3326) */
export function SalaEditModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const s = salaById(id);
  const [nome, setNome] = useState(s?.n ?? '');
  const [cor, setCor] = useState(s?.c ?? SALA_COLORS[0]);
  const [err, setErr] = useState('');
  if (!s) return null;

  const save = () => {
    const res = updateSala(id, { n: nome, c: cor });
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onClose();
    logAct(effectiveUser?.name ?? 'Painel', `Editou a sala <b>${esc(s.n)}</b>`);
    toast('Sala atualizada!');
  };

  return (
    <Modal
      title="Editar sala"
      onClose={onClose}
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
            Salvar sala
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Nome da sala</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
        </label>
        <div>
          <span className="text-sm font-medium">Cor da sala</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {SALA_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCor(c)}
                className="w-8 h-8 rounded-full transition hover:scale-110"
                style={{
                  background: c,
                  outline: cor === c ? '3px solid var(--ring)' : 'none',
                  outlineOffset: cor === c ? 2 : 0,
                }}
                data-tip="Usar esta cor"
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-[var(--muted)] flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {s.prof && (
              <>
                Teacher atual: <b>{s.prof}</b>.{' '}
              </>
            )}
            Quem dá aula aqui se define na aba <b>Teachers</b> (botão "Salas & teachers" da Agenda).
          </span>
        </p>
        {err && (
          <div
            className="rounded-xl p-2.5 text-xs flex items-start gap-2"
            style={{ background: 'rgba(220,38,38,.08)', color: '#DC2626' }}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: err }} />
          </div>
        )}
      </div>
    </Modal>
  );
}

/* excluir sala vazia — port de smRemoveSala/confirmSmRemoveSala (l.3245/3262) */
export function RemoveSalaModal({ id, onCancel, onDone }: { id: string; onCancel: () => void; onDone: () => void }) {
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const s = salaById(id);
  if (!s) return null;

  const confirm = () => {
    const n = s.n;
    const res = deleteSala(id);
    if (!res.ok) return;
    logAct(effectiveUser?.name ?? 'Painel', `Excluiu a sala <b>${esc(n)}</b> (estava vazia)`);
    toast('Sala excluída.');
    onDone();
  };

  return (
    <Modal
      title="Excluir sala"
      onClose={onCancel}
      footer={
        <>
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold transition hover:brightness-110"
            style={{ background: '#DC2626' }}
          >
            Excluir sala
          </button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,.06)' }}>
          <span className="w-9 h-9 rounded-full grid place-content-center shrink-0" style={{ background: s.c }}>
            <DoorOpen className="w-4 h-4 text-white" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm">Excluir a {s.n}?</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Ela está vazia — some do cadastro e das opções da agenda. Dá para criar de novo depois, se precisar.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* remover teacher do cadastro — port de smRemoveTeacher/confirmSmRemoveTeacher (l.3281/3298) */
export function RemoveTeacherModal({ name, onCancel, onDone }: { name: string; onCancel: () => void; onDone: () => void }) {
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const sala = SALAS.find((s) => s.prof === name);

  const confirm = () => {
    const res = removeTeacher(name);
    if (!res.ok) return;
    logAct(
      effectiveUser?.name ?? 'Painel',
      `Removeu o teacher <b>${esc(name)}</b> do cadastro${sala ? ` (a ${esc(sala.n)} ficou sem teacher)` : ''}`,
    );
    toast(`${name.split(' ')[0]} removido do cadastro.`);
    onDone();
  };

  return (
    <Modal
      title="Remover teacher"
      onClose={onCancel}
      footer={
        <>
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold transition hover:brightness-110"
            style={{ background: '#DC2626' }}
          >
            Remover teacher
          </button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,.06)' }}>
          <div
            className="w-9 h-9 rounded-full grid place-content-center text-white text-xs font-bold shrink-0"
            style={{ background: sala ? sala.c : '#94a3b8' }}
          >
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">Remover {name} do cadastro?</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {sala ? `A ${sala.n} fica sem teacher (as turmas continuam intactas).` : 'O nome sai do cadastro de teachers.'}{' '}
              Dá para cadastrar de novo depois.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
