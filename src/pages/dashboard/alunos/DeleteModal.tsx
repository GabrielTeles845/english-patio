import { useState } from 'react';
import { AlertTriangle, Lightbulb, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { useAuth } from '../../../lib/dashboard/auth';
import { logAct, removeStudent } from '../../../lib/dashboard/store';
import { STUDENTS } from '../../../lib/dashboard/data';

/* Excluir matrícula (CRUD) — port de openDeleteModal/confirmDelete
   (dashboard.html l.4275/4308). Diferente de desligar: apaga de vez, com
   checkbox de "entendi" para armar o botão. */

const ckSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function DeleteModal({ sid, onClose, afterDelete }: { sid: number; onClose: () => void; afterDelete?: () => void }) {
  const { toast } = useToast();
  const { effectiveUser } = useAuth();
  const [armed, setArmed] = useState(false);
  const s = STUDENTS.find((x) => x.id === sid);
  if (!s) return null;

  /* contrato assinado e matrícula ativa = exclusão quase sempre é engano — aviso reforçado */
  const signedWarn = s.status === 'signed' && s.active !== false;

  const confirm = () => {
    const nomeFull = s.kids[0].n, nome = nomeFull.split(' ')[0];
    const res = removeStudent(sid);
    if (!res.ok) return;
    onClose();
    afterDelete?.();
    logAct(effectiveUser?.name ?? 'Equipe', `Excluiu a matrícula de <b>${nomeFull}</b> (cadastro errado ou de teste)`);
    toast(`Matrícula de ${nome} excluída.`);
  };

  return (
    <Modal title="Excluir matrícula" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,.06)' }}>
          <div className="w-10 h-10 rounded-xl grid place-content-center shrink-0" style={{ background: 'rgba(220,38,38,.12)' }}>
            <Trash2 className="w-5 h-5" style={{ color: '#DC2626' }} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">{s.kids.map((k) => k.n.split(' ')[0]).join(' e ')} — apagar de vez?</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              A matrícula, os dados e o contrato somem da dashboard. <b>Não tem como desfazer.</b>
            </p>
          </div>
        </div>
        {signedWarn && (
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: 'rgba(220,38,38,.08)', color: '#DC2626' }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Esta matrícula está <b>ativa e com contrato assinado</b> — excluir aqui apaga também o registro do contrato. Tem certeza de
              que não é um caso de <b>Desligar aluno</b>?
            </span>
          </div>
        )}
        <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: 'rgba(245,183,0,.10)', color: '#B5860B' }}>
          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Use <b>excluir</b> só para cadastros errados ou de teste. Se o aluno saiu da escola, prefira <b>Desligar aluno</b> — o
            histórico fica guardado e dá para reativar depois.
          </span>
        </div>
        <button type="button" onClick={() => setArmed((a) => !a)} className="w-full flex items-center gap-2.5 text-left px-1 py-0.5">
          <span className={`ck ${armed ? 'on' : ''} shrink-0`}>{ckSvg}</span>
          <span className="text-sm">Entendi que a exclusão é definitiva e quero apagar mesmo assim</span>
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition">
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={!armed}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#DC2626' }}
          >
            Excluir de vez
          </button>
        </div>
      </div>
    </Modal>
  );
}
