import { ArrowLeft, ImageDown, Pencil } from 'lucide-react';
import {
  HORAS,
  SALAS,
  TURMAS,
  type Par,
  type Turma,
  activeKidsIn,
  famC,
  nivelLabel,
  salaById,
} from '../../../lib/dashboard/data';
import { agOver, agLeave } from './dnd';
import { SalaPage } from './CanvaPages';

/* Visão 2: salas — cards (agSalasHTML, l.2726) e a página da sala no formato
   do Canva (agSalaPageWrap, l.2767). Port 1:1 do preview. */

interface SalasCardsProps {
  par: Par;
  pass: (t: Turma) => boolean;
  onOpenSala: (id: string) => void;
  onDropKidSala: (salaId: string) => void;
}

export function SalasCards({ par, pass, onOpenSala, onDropKidSala }: SalasCardsProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {SALAS.map((s) => {
        const ts = TURMAS.filter((t) => t.sala === s.id);
        const tsP = ts
          .filter((t) => t.par === par && pass(t))
          .sort((a, b) => HORAS.indexOf(a.hora) - HORAS.indexOf(b.hora));
        const alunos = ts.reduce((a, t) => a + activeKidsIn(t.id), 0);
        return (
          <div
            key={s.id}
            onClick={() => onOpenSala(s.id)}
            onDragOver={(e) => agOver(e, 'sala')}
            onDragLeave={agLeave}
            onDrop={(e) => {
              e.preventDefault();
              agLeave(e);
              onDropKidSala(s.id);
            }}
            className="surface rounded-2xl overflow-hidden cursor-pointer transition hover:shadow-lg"
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between gap-3"
              style={{ background: `${s.c}22`, borderBottom: `3px solid ${s.c}` }}
            >
              <div className="min-w-0">
                <p className="font-heading font-semibold truncate">{s.n}</p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {s.prof ? 'Teacher ' + s.prof : 'sem teacher definido'}
                </p>
              </div>
              <span className="w-4 h-4 rounded-full shrink-0" style={{ background: s.c }} />
            </div>
            <div className="px-5 pt-3 pb-1 flex items-center gap-4 text-sm">
              {ts.length ? (
                <>
                  <span>
                    <b>{ts.length}</b> turma{ts.length === 1 ? '' : 's'}
                  </span>
                  <span>
                    <b>{alunos}</b> aluno{alunos === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[var(--muted)]">sala livre — toque para ver e criar turmas</span>
              )}
            </div>
            <div className="px-5 pb-4 pt-2 flex flex-wrap gap-1.5 min-h-[34px]">
              {tsP.slice(0, 4).map((t) => (
                <span
                  key={t.id}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: `${famC(t.nivel)}1a`, color: famC(t.nivel) }}
                >
                  {t.hora} {nivelLabel(t.nivel)}
                </span>
              ))}
              {tsP.length > 4 && <span className="text-[10px] text-[var(--muted)] font-semibold">+{tsP.length - 4}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface SalaPageWrapProps {
  salaId: string;
  par: Par;
  onBack: () => void;
  onEditSala: (id: string) => void;
  onExportSala: (salaId: string, par: Par) => void;
  onMoveKid: (sid: number, ki: number) => void;
  onDropKid: (tid: number) => void;
}

export function SalaPageWrap({ salaId, par, onBack, onEditSala, onExportSala, onMoveKid, onDropKid }: SalaPageWrapProps) {
  const sala = salaById(salaId);
  if (!sala) return null;
  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="w-4 h-4" /> Todas as salas
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditSala(salaId)}
            className="h-9 px-3 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--hover)] transition flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar sala
          </button>
          <button
            onClick={() => onExportSala(salaId, par)}
            className="h-9 px-3 rounded-lg text-white text-xs font-semibold transition hover:brightness-110 flex items-center gap-1.5"
            style={{ background: '#1E3765' }}
          >
            <ImageDown className="w-3.5 h-3.5" /> Exportar imagem
          </button>
        </div>
      </div>
      <div id="salaPage" className="shadow-xl rounded-2xl">
        <SalaPage salaId={salaId} par={par} onMoveKid={onMoveKid} onDropKid={onDropKid} />
      </div>
    </div>
  );
}
