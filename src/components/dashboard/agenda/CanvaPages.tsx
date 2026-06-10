import {
  FAMS,
  HORAS,
  TURMAS,
  type Turma,
  activeKidsIn,
  famC,
  isNovo,
  kidsOfTurma,
  nivelByK,
  nivelLabel,
  novoTag,
  salaById,
  turmaFull,
} from '../../../lib/dashboard/data';
import { agDragKid, agDragEnd, agOver, agLeave } from './dnd';

/* As "páginas do Canva" geradas dos dados — port 1:1 de salaPageHTML (l.2743)
   e nivelPageHTML (l.3381) do preview. O MESMO componente serve a tela
   (interativo: clique/arrasto move aluno) e a exportação PNG (forExport). */

interface SalaPageProps {
  salaId: string;
  par: 'seg-qua' | 'ter-qui';
  forExport?: boolean;
  noPar?: boolean;
  onMoveKid?: (sid: number, ki: number) => void;
  onDropKid?: (tid: number) => void;
}

export function SalaPage({ salaId, par, forExport, noPar, onMoveKid, onDropKid }: SalaPageProps) {
  const sala = salaById(salaId);
  if (!sala) return null;
  const ts = TURMAS.filter((t) => t.sala === salaId && t.par === par).sort(
    (a, b) => HORAS.indexOf(a.hora) - HORAS.indexOf(b.hora),
  );

  const slot = (t: Turma) => {
    const list = kidsOfTurma(t.id);
    return (
      <div
        key={t.id}
        className="mb-5"
        style={{ breakInside: 'avoid' }}
        {...(forExport
          ? {}
          : {
              onDragOver: (e) => agOver(e, 'turma'),
              onDragLeave: agLeave,
              onDrop: (e) => {
                e.preventDefault();
                agLeave(e);
                onDropKid?.(t.id);
              },
            })}
      >
        <p className="font-bold text-[13px]" style={{ color: '#16233f' }}>
          {t.hora} - <span style={{ color: famC(t.nivel) }}>{nivelLabel(t.nivel).toUpperCase()}</span>
        </p>
        <ol className="mt-1 space-y-0.5 text-[12px]">
          {list.length ? (
            list.map(({ s, k, ki }, i) => (
              <li
                key={`${s.id}-${ki}`}
                className={`leading-snug${forExport ? '' : ' cursor-pointer hover:underline'}`}
                style={{ color: '#243250' }}
                {...(forExport
                  ? {}
                  : {
                      onClick: () => onMoveKid?.(s.id, ki),
                      draggable: true,
                      onDragStart: (e) => agDragKid(e, s.id, ki),
                      onDragEnd: agDragEnd,
                      'data-tip': `Mover ${k.n.split(' ')[0]} de turma — clique ou arraste para outro horário`,
                    })}
              >
                <span style={{ color: sala.c }}>{i + 1}.</span> <b>{k.n.toUpperCase()}</b>{' '}
                <span style={{ color: '#64748B' }}>({k.age})</span>
                {isNovo(s) && <span style={{ color: '#E0457B', fontWeight: 700 }}> - {novoTag()}</span>}
              </li>
            ))
          ) : (
            <li className="text-[11px]" style={{ color: '#94a3b8' }}>
              — sem alunos ainda{forExport ? '' : ' (aloque pela fila)'}
            </li>
          )}
        </ol>
        {turmaFull(t) && (
          <p className="text-[11px] font-bold mt-1" style={{ color: '#16a34a' }}>
            NÃO TEM VAGA
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      className="bg-white rounded-2xl p-7 sm:p-8"
      style={{ ...(noPar ? {} : { minHeight: 380 }), color: '#16233f', fontFamily: 'Inter,system-ui,sans-serif' }}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="rounded-2xl px-6 py-3 text-center" style={{ background: sala.c }}>
          <p
            className="font-heading text-2xl font-bold tracking-wide text-white"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,.18)' }}
          >
            {sala.n.toUpperCase()}
          </p>
          {sala.prof && (
            <p className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,.94)' }}>
              Teacher {sala.prof}
            </p>
          )}
        </div>
        {!noPar && (
          <p className="font-bold text-lg pt-1" style={{ color: '#16233f' }}>
            {par === 'seg-qua' ? 'Mon/Wed' : 'Tue/Thu'}
          </p>
        )}
      </div>
      {ts.length ? (
        <div className="sm:columns-2" style={{ columnGap: 48 }}>
          {ts.map(slot)}
        </div>
      ) : (
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          Nenhuma turma neste par de dias — crie pelo botão "Nova turma" ou pelo + na grade.
        </p>
      )}
    </div>
  );
}

/* página de exportação por nível (todas as turmas dele, nos dois pares) */
export function NivelPage({ k }: { k: string }) {
  const nv = nivelByK(k);
  if (!nv) return null;
  const f = FAMS[nv.fam];
  const ts = TURMAS.filter((t) => t.nivel === k).sort((a, b) => (a.par + a.hora < b.par + b.hora ? -1 : 1));

  const block = (t: Turma) => {
    const sala = salaById(t.sala)!;
    const list = kidsOfTurma(t.id);
    return (
      <div key={t.id} className="mb-5" style={{ breakInside: 'avoid' }}>
        <p className="font-bold text-[13px]" style={{ color: '#16233f' }}>
          <span style={{ color: sala.c }}>●</span> {sala.n} — {t.par === 'seg-qua' ? 'Mon/Wed' : 'Tue/Thu'} {t.hora}
          {sala.prof && (
            <span style={{ color: '#64748B', fontWeight: 500 }}> · Teacher {sala.prof}</span>
          )}
        </p>
        <ol className="mt-1 space-y-0.5 text-[12px]">
          {list.length ? (
            list.map(({ s, k: kid }, i) => (
              <li key={`${s.id}-${i}`} style={{ color: '#243250' }}>
                <span style={{ color: sala.c }}>{i + 1}.</span> <b>{kid.n.toUpperCase()}</b>{' '}
                <span style={{ color: '#64748B' }}>({kid.age})</span>
                {isNovo(s) && <span style={{ color: '#E0457B', fontWeight: 700 }}> - {novoTag()}</span>}
              </li>
            ))
          ) : (
            <li className="text-[11px]" style={{ color: '#94a3b8' }}>
              — sem alunos ainda
            </li>
          )}
        </ol>
        {turmaFull(t) && (
          <p className="text-[11px] font-bold mt-1" style={{ color: '#16a34a' }}>
            NÃO TEM VAGA
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-8" style={{ color: '#16233f', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="rounded-2xl px-6 py-3" style={{ background: f.c }}>
          <p
            className="font-heading text-2xl font-bold tracking-wide text-white"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,.18)' }}
          >
            {nv.n.toUpperCase()}
          </p>
        </div>
        <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
          {ts.reduce((a, t) => a + activeKidsIn(t.id), 0)} alunos · {ts.length} turma{ts.length === 1 ? '' : 's'}
        </p>
      </div>
      {ts.length ? (
        <div className="sm:columns-2" style={{ columnGap: 48 }}>
          {ts.map(block)}
        </div>
      ) : (
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          Sem turmas deste nível neste semestre.
        </p>
      )}
    </div>
  );
}
