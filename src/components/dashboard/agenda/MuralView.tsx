import { ImageDown, Info, Maximize2 } from 'lucide-react';
import {
  HORAS,
  SALAS,
  TURMAS,
  type Par,
  type Sala,
  type Turma,
  activeKidsIn,
  famC,
  isNovo,
  kidsOfTurma,
  nivelLabel,
  novoTag,
  schLabel,
} from '../../../lib/dashboard/data';
import { agDragKid, agDragEnd, agOver, agLeave } from './dnd';

/* Visão 4: mural — a agenda do par inteira em cards ricos (masonry) — port de
   agMuralHTML/muralCardHTML (l.2780–2828). */

interface MuralViewProps {
  par: Par;
  onOpenSala: (id: string) => void;
  onMoveKid: (sid: number, ki: number) => void;
  onDropKid: (tid: number) => void;
  onExportSala: (salaId: string, par: Par) => void;
}

export function MuralView({ par, onOpenSala, onMoveKid, onDropKid, onExportSala }: MuralViewProps) {
  const list = SALAS.filter((s) => TURMAS.some((t) => t.sala === s.id && t.par === par));
  if (!list.length)
    return (
      <div className="surface rounded-2xl p-10 text-center text-sm text-[var(--muted)]">
        Nenhuma sala com turmas neste par de dias — troque o par ali em cima.
      </div>
    );
  return (
    <>
      <div className="lg:columns-2 xl:columns-3" style={{ columnGap: '1rem' }}>
        {list.map((s) => (
          <MuralCard
            key={s.id}
            s={s}
            par={par}
            onOpenSala={onOpenSala}
            onMoveKid={onMoveKid}
            onDropKid={onDropKid}
            onExportSala={onExportSala}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--muted)] mt-3 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" /> O mural é a agenda do par inteira — toque no nome de um aluno para movê-lo
        (ou arraste para outro horário), no cabeçalho para abrir a sala, e "Exportar" gera a imagem no formato do
        Canva.
      </p>
    </>
  );
}

function MuralCard({
  s,
  par,
  onOpenSala,
  onMoveKid,
  onDropKid,
  onExportSala,
}: { s: Sala } & Omit<MuralViewProps, 'par'> & { par: Par }) {
  const ts = TURMAS.filter((t) => t.sala === s.id && t.par === par).sort(
    (a, b) => HORAS.indexOf(a.hora) - HORAS.indexOf(b.hora),
  );
  const tot = ts.reduce((a, t) => a + activeKidsIn(t.id), 0);
  const vagas = ts.reduce((a, t) => a + Math.max(0, t.cap - activeKidsIn(t.id)), 0);

  const slot = (t: Turma) => {
    const list = kidsOfTurma(t.id);
    const v = activeKidsIn(t.id);
    const full = v >= t.cap;
    return (
      <div
        key={t.id}
        className="px-5 py-3 border-t"
        style={{ borderColor: 'var(--border)' }}
        onDragOver={(e) => agOver(e, 'turma')}
        onDragLeave={agLeave}
        onDrop={(e) => {
          e.preventDefault();
          agLeave(e);
          onDropKid(t.id);
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm font-semibold w-11 shrink-0">{t.hora}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: `${famC(t.nivel)}1a`, color: famC(t.nivel) }}
          >
            {nivelLabel(t.nivel)}
          </span>
          <div className="flex-1" />
          <div className="w-14 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--hover)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((v / (t.cap || 1)) * 100)}%`, background: full ? '#16a34a' : famC(t.nivel) }}
            />
          </div>
          <span
            className="text-[11px] font-bold whitespace-nowrap w-9 text-right"
            style={{ color: full ? '#16a34a' : 'var(--muted)' }}
          >
            {full ? 'cheia' : `${v}/${t.cap}`}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {list.length ? (
            list.map(({ s: st, k, ki }) => (
              <button
                key={`${st.id}-${ki}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveKid(st.id, ki);
                }}
                draggable
                onDragStart={(e) => agDragKid(e, st.id, ki)}
                onDragEnd={agDragEnd}
                data-tip={`Mover ${k.n.split(' ')[0]} de turma`}
                className="text-[11px] font-medium px-2 py-1 rounded-lg transition hover:ring-1 ring-brand-light"
                style={{ background: 'var(--hover)' }}
              >
                {k.n.split(' ').slice(0, 2).join(' ')}{' '}
                <span className="text-[var(--muted)] font-normal">({k.age})</span>
                {isNovo(st) && (
                  <span className="font-bold" style={{ color: '#E0457B' }}>
                    {' '}
                    {novoTag()}
                  </span>
                )}
              </button>
            ))
          ) : (
            <span className="text-[11px] text-[var(--muted)]">— sem alunos ainda (aloque pela fila)</span>
          )}
          {full && (
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ background: 'rgba(22,163,74,.10)', color: '#16a34a' }}
            >
              NÃO TEM VAGA
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mural-card surface rounded-2xl overflow-hidden mb-4 transition hover:shadow-xl" style={{ breakInside: 'avoid' }}>
      <div
        className="relative px-5 py-4 overflow-hidden cursor-pointer"
        onClick={() => onOpenSala(s.id)}
        style={{ background: `linear-gradient(135deg,${s.c},color-mix(in srgb,${s.c} 70%,#16233f))` }}
      >
        <div
          className="absolute -top-10 -right-6 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,.13)' }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className="font-heading text-lg font-semibold text-white truncate"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,.18)' }}
            >
              {s.n}
            </p>
            {s.prof ? (
              <p className="text-xs text-white/85 truncate">Teacher {s.prof}</p>
            ) : (
              <p className="text-xs text-white/60">sem teacher definido</p>
            )}
          </div>
          <span
            className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}
          >
            {tot} aluno{tot === 1 ? '' : 's'}
            {vagas ? ` · ${vagas} vaga${vagas > 1 ? 's' : ''}` : ' · lotada'}
          </span>
        </div>
      </div>
      {ts.map(slot)}
      <div
        className="px-5 py-2.5 border-t flex items-center justify-between gap-2"
        style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}
      >
        <span className="text-[11px] text-[var(--muted)]">
          {ts.length} turma{ts.length === 1 ? '' : 's'} · {schLabel(par)}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenSala(s.id)}
            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-[var(--border)] hover:bg-[var(--card)] transition flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" /> Abrir
          </button>
          <button
            onClick={() => onExportSala(s.id, par)}
            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold text-white transition hover:brightness-110 flex items-center gap-1"
            style={{ background: '#1E3765' }}
          >
            <ImageDown className="w-3 h-3" /> Exportar
          </button>
        </div>
      </div>
    </div>
  );
}
