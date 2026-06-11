import { useState } from 'react';
import { Clock, GraduationCap, PencilLine, Puzzle, School, Truck, Wallet, type LucideIcon } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { inputCls } from '../../../components/dashboard/ui/inputs';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { useAuth } from '../../../lib/dashboard/auth';
import { initials } from '../../../lib/dashboard/auth';
import { logAct, reactivateStudent, setStudentExit } from '../../../lib/dashboard/store';
import { EXIT_REASONS, STUDENTS, type ExitKey } from '../../../lib/dashboard/data';
import { avatarGrad } from './common';

/* Desligamento de aluno (com motivo) — port de openExitModal/pickExitReason/
   confirmExit (dashboard.html l.5531–5588). Com "Outro", a observação vira
   obrigatória; o botão só habilita com motivo válido. */

const EXIT_ICONS: Record<ExitKey, LucideIcon> = {
  adapt: Puzzle,
  financial: Wallet,
  competitor: School,
  moved: Truck,
  schedule: Clock,
  completed: GraduationCap,
  other: PencilLine,
};

export function ExitModal({ sid, onClose }: { sid: number; onClose: () => void }) {
  const { toast } = useToast();
  const { effectiveUser } = useAuth();
  const [reasonK, setReasonK] = useState<ExitKey | null>(null);
  const [note, setNote] = useState('');
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return null;

  const disabled = !reasonK || (reasonK === 'other' && !note.trim());

  const confirm = async () => {
    if (!reasonK) return;
    const r = EXIT_REASONS.find((x) => x.k === reasonK)!;
    const res = await setStudentExit(sid, reasonK, note);
    if (!res.ok) return toast(res.error);
    onClose();
    logAct(effectiveUser?.name ?? 'Equipe', `Desligou <b>${s.kids[0].n}</b> — motivo: ${r.l.toLowerCase()}`);
    toast(`${s.kids[0].n.split(' ')[0]} foi desligado da escola — motivo registrado.`);
  };

  return (
    <Modal title="Desligar aluno" size="max-w-lg" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,.06)' }}>
          <div
            className="w-10 h-10 rounded-xl grid place-content-center text-white font-semibold text-sm shrink-0"
            style={{ background: avatarGrad(s.id) }}
          >
            {initials(s.kids[0].n)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {s.kids[0].n}
              {s.kids.length > 1 ? ' +' + (s.kids.length - 1) : ''}
            </p>
            <p className="text-xs text-[var(--muted)]">
              A matrícula fica <b>inativa</b> — os dados e contratos continuam no histórico, e dá para reativar quando quiser.
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Qual o motivo do desligamento?</p>
          <div className="space-y-2">
            {EXIT_REASONS.map((r) => {
              const Icon = EXIT_ICONS[r.k];
              const on = reasonK === r.k;
              return (
                <button
                  key={r.k}
                  type="button"
                  onClick={() => setReasonK(r.k)}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-xl border transition hover:bg-[var(--hover)]"
                  style={{ borderColor: on ? '#DC2626' : 'var(--border)', background: on ? 'rgba(220,38,38,.05)' : undefined }}
                >
                  <div className="w-9 h-9 rounded-lg grid place-content-center shrink-0" style={{ background: 'var(--hover)' }}>
                    <Icon className="w-4 h-4 text-[var(--muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.l}</p>
                    <p className="text-xs text-[var(--muted)]">{r.d}</p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border grid place-content-center shrink-0 transition"
                    style={{ borderColor: on ? '#DC2626' : 'var(--border)' }}
                  >
                    {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#DC2626' }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-medium">
            {reasonK === 'other' ? (
              <>
                Descreva o motivo <span style={{ color: '#DC2626' }}>*</span>
              </>
            ) : (
              <>
                Observações <span className="text-[var(--muted)] font-normal">(opcional)</span>
              </>
            )}
          </span>
          <textarea
            rows={3}
            placeholder="Algum detalhe que ajude a entender o caso…"
            className={`${inputCls} h-auto py-2.5 resize-none`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition">
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={disabled}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#DC2626' }}
          >
            Desligar aluno
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* Reativar (port reactivateStudent l.5590) — usado pelo menu ⋮ e pela ficha.
   A vaga NÃO fica reservada: se a turma lotou, o aluno volta pela fila. */
export async function reactivateWithFeedback(sid: number, who: string, toast: (m: string) => void): Promise<void> {
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return;
  const res = await reactivateStudent(sid);
  if (!res.ok) return toast(res.error);
  const bumped = res.bumped ?? [];
  logAct(
    who,
    `Reativou <b>${s.kids[0].n}</b> — matrícula ativa de novo${bumped.length ? ` (${bumped.join(', ')} — voltou pela fila de alocação)` : ''}`,
  );
  toast(
    bumped.length
      ? `${s.kids[0].n.split(' ')[0]} voltou a ser aluno ativo — ${bumped.join(', ')}; aloque pela Agenda.`
      : `${s.kids[0].n.split(' ')[0]} voltou a ser aluno ativo!`,
  );
}
