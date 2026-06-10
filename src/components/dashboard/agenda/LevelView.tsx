import {
  FAMS,
  NIVEIS,
  TURMAS,
  type Turma,
  activeKidsIn,
  salaById,
  schLabel,
  turmaVagas,
} from '../../../lib/dashboard/data';
import { agOver, agLeave } from './dnd';

/* Visão 3: por nível — "que dia tem Power 2 e onde tem vaga?" — port de
   agNiveisHTML (l.2830). Mostra os DOIS pares juntos (o toggle de par some). */

interface LevelViewProps {
  pass: (t: Turma) => boolean;
  onOpenTurma: (tid: number) => void;
  onNewTurma: (nivel: string) => void;
  onDropKid: (tid: number) => void;
}

export function LevelView({ pass, onOpenTurma, onNewTurma, onDropKid }: LevelViewProps) {
  return (
    <>
      {Object.entries(FAMS).map(([fk, f]) => {
        const lvls = NIVEIS.filter((n) => n.fam === fk);
        return (
          <div key={fk} className="mb-6">
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2"
              style={{ color: f.c }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: f.c }} />
              {f.n}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {lvls.map((nv) => {
                const all = TURMAS.filter((t) => t.nivel === nv.k);
                const ts = all.filter(pass).sort((a, b) => (a.par + a.hora < b.par + b.hora ? -1 : 1));
                if (!all.length)
                  return (
                    <div key={nv.k} className="surface rounded-2xl p-4 opacity-55">
                      <p className="font-heading font-semibold text-sm">{nv.n}</p>
                      <p className="text-xs text-[var(--muted)] mt-1">sem turma neste semestre</p>
                      <button
                        onClick={() => onNewTurma(nv.k)}
                        className="mt-2 text-xs font-semibold text-brand-light hover:underline"
                      >
                        + criar turma deste nível
                      </button>
                    </div>
                  );
                const tot = all.reduce((a, t) => a + activeKidsIn(t.id), 0);
                return (
                  <div key={nv.k} className="surface rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-heading font-semibold text-sm">{nv.n}</p>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: `${f.c}1a`, color: f.c }}
                      >
                        {tot} aluno{tot === 1 ? '' : 's'}
                      </span>
                    </div>
                    {ts.length ? (
                      <div className="space-y-1">
                        {ts.map((t) => {
                          const v = turmaVagas(t);
                          const sala = salaById(t.sala)!;
                          return (
                            <button
                              key={t.id}
                              onClick={() => onOpenTurma(t.id)}
                              onDragOver={(e) => agOver(e, 'turma')}
                              onDragLeave={agLeave}
                              onDrop={(e) => {
                                e.preventDefault();
                                agLeave(e);
                                onDropKid(t.id);
                              }}
                              className="w-full flex items-center gap-2 text-left text-xs p-2 rounded-lg hover:bg-[var(--hover)] transition"
                              data-tip="Abrir a turma (alunos, editar) — também aceita aluno arrastado"
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sala.c }} />
                              <span className="font-medium truncate">{sala.n.replace(' Room', '')}</span>
                              <span className="text-[var(--muted)] whitespace-nowrap">
                                {schLabel(t.par)} {t.hora}
                              </span>
                              <span
                                className="ml-auto whitespace-nowrap font-bold"
                                style={{ color: v ? '#16a34a' : '#B5860B' }}
                              >
                                {v ? `${v} vaga${v > 1 ? 's' : ''}` : 'CHEIA'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--muted)]">todas as turmas ficaram fora dos filtros atuais</p>
                    )}
                    <button
                      onClick={() => onNewTurma(nv.k)}
                      className="mt-2 text-xs font-semibold text-brand-light hover:underline"
                    >
                      + nova turma deste nível
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
