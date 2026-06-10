import { useState } from 'react';
import { ImageDown, Images } from 'lucide-react';
import { type Par, salaById, schLabel } from '../../../lib/dashboard/data';
import { Modal } from '../../dashboard/ui/Modal';
import { CSelect } from '../../dashboard/ui/CSelect';
import { nivelPickItems } from './TurmaModals';

/* Exportar imagens da agenda — port de openAgExport (l.3409): sala atual (se
   estiver numa página de sala), todas as salas do par, ou um nível específico. */

interface ExportModalProps {
  agSala: string | null;
  agPar: Par;
  onClose: () => void;
  onExportSala: (salaId: string, par: Par) => void;
  onExportTodas: () => void;
  onExportNivel: (k: string) => void;
}

export function ExportModal({ agSala, agPar, onClose, onExportSala, onExportTodas, onExportNivel }: ExportModalProps) {
  const [nivel, setNivel] = useState('power-2');
  return (
    <Modal
      title="Exportar imagens da agenda"
      onClose={onClose}
      size="max-w-lg"
      footer={
        <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
          Fechar
        </button>
      }
    >
      <div className="p-5 space-y-3">
        <p className="text-sm text-[var(--muted)]">
          As imagens saem no formato do quadro do Canva — só que geradas dos dados de <b>agora</b>, sem refazer nada à
          mão.
        </p>
        {agSala && (
          <button
            onClick={() => {
              onClose();
              onExportSala(agSala, agPar);
            }}
            className="w-full h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition flex items-center justify-center gap-2"
          >
            <ImageDown className="w-4 h-4 text-brand-light" /> Sala atual ({salaById(agSala)?.n || ''} · {schLabel(agPar)})
          </button>
        )}
        <button
          onClick={onExportTodas}
          className="w-full h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition flex items-center justify-center gap-2"
        >
          <Images className="w-4 h-4 text-brand-light" /> Todas as salas com turma ({schLabel(agPar)})
        </button>
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--hover)' }}>
          <p className="text-sm font-medium">
            Ou um nível específico{' '}
            <span className="text-xs font-normal text-[var(--muted)]">(todas as turmas dele, nos dois pares)</span>
          </p>
          <CSelect value={nivel} onChange={setNivel} block items={nivelPickItems()} />
          <button
            onClick={() => onExportNivel(nivel)}
            className="w-full h-10 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            Exportar o nível escolhido
          </button>
        </div>
      </div>
    </Modal>
  );
}
