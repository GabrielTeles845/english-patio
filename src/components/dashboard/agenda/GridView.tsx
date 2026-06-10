import { useEffect } from 'react';
import { MousePointerClick, Plus } from 'lucide-react';
import {
  HORAS,
  SALAS,
  type Par,
  type Turma,
  activeKidsIn,
  famC,
  nivelLabel,
  schLabel,
  turmaAt,
} from '../../../lib/dashboard/data';
import { agDragTurma, agDragEnd, agOver, agLeave } from './dnd';

/* Visão 1: grade geral (raio-X — colunas = salas, linhas = horários) — port de
   agGradeHTML (l.2700) + pan da grade (l.2584–2604): segurar e arrastar rola
   para os lados (coluna de horários grudada); o clique pós-arrasto é engolido. */

interface GridViewProps {
  par: Par;
  pass: (t: Turma) => boolean;
  onOpenSala: (id: string) => void;
  onOpenTurma: (tid: number) => void;
  onNewTurma: (sala: string, par: Par, hora: string) => void;
  onDropEmpty: (sala: string, par: Par, hora: string) => void;
  onDropKid: (tid: number) => void;
}

const DIVIDERS: Record<string, string> = {
  '08:30': 'Manhã',
  '13:30': 'Tarde',
  '16:45': '· intervalo das 16:30 às 16:45 ·',
};

export function GridView({ par, pass, onOpenSala, onOpenTurma, onNewTurma, onDropEmpty, onDropKid }: GridViewProps) {
  /* pan: mesmo mecanismo do preview — listeners no document, vira pan depois
     de 4px; o arrasto de turma ([draggable]) tem prioridade. */
  useEffect(() => {
    let pan: { sc: HTMLElement; x: number; y: number; sl: number; st: number; moved: boolean } | null = null;
    let clickGuard = false;
    const down = (e: MouseEvent) => {
      const sc = (e.target as HTMLElement | null)?.closest?.('#agGridScroll') as HTMLElement | null;
      if (!sc || e.button !== 0) return;
      if ((e.target as HTMLElement).closest('[draggable="true"]')) return; // turma usa o drag-and-drop
      pan = { sc, x: e.clientX, y: e.clientY, sl: sc.scrollLeft, st: sc.scrollTop, moved: false };
    };
    const move = (e: MouseEvent) => {
      if (!pan) return;
      const dx = e.clientX - pan.x,
        dy = e.clientY - pan.y;
      if (!pan.moved && Math.hypot(dx, dy) > 4) {
        pan.moved = true;
        pan.sc.classList.add('panning');
      }
      if (pan.moved) {
        pan.sc.scrollLeft = pan.sl - dx;
        pan.sc.scrollTop = pan.st - dy;
        e.preventDefault();
      }
    };
    const up = () => {
      if (!pan) return;
      if (pan.moved) clickGuard = true; // engole o clique que viria depois do arrasto
      pan.sc.classList.remove('panning');
      pan = null;
    };
    const click = (e: MouseEvent) => {
      if (clickGuard) {
        clickGuard = false;
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('mousedown', down);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('click', click, true);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('click', click, true);
    };
  }, []);

  return (
    <>
      <div id="agGridScroll" className="surface rounded-2xl">
        <div
          className="grid"
          style={{ gridTemplateColumns: `70px repeat(${SALAS.length},108px)`, minWidth: 'max-content' }}
        >
          <div
            className="ag-sticky border-b border-r px-2 py-2.5 grid place-content-center text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Horário
          </div>
          {SALAS.map((s) => (
            <div
              key={s.id}
              className="border-b px-2 py-2 text-center cursor-pointer hover:bg-[var(--hover)] transition"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => onOpenSala(s.id)}
              data-tip={`Abrir a página da ${s.n}`}
            >
              <p className="text-[11px] font-bold truncate flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.c }} />
                {s.n.replace(' Room', '')}
              </p>
              <p className="text-[9px] text-[var(--muted)] truncate">
                {s.prof ? 'Teacher ' + s.prof.split(' ')[0] : 'sem teacher'}
              </p>
            </div>
          ))}
          {HORAS.map((h) => (
            <Row
              key={h}
              h={h}
              par={par}
              pass={pass}
              onOpenTurma={onOpenTurma}
              onNewTurma={onNewTurma}
              onDropEmpty={onDropEmpty}
              onDropKid={onDropKid}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-[var(--muted)] mt-3 flex items-center gap-1.5">
        <MousePointerClick className="w-3.5 h-3.5" /> Toque numa turma para abrir (alunos, editar, mover) — ou no{' '}
        <b>+</b> de um horário vazio para criar uma turma ali. Dá para <b>arrastar</b>: uma turma para um horário
        vazio, um aluno da fila para uma turma com vaga — e <b>segurar num espaço vazio</b> para rolar a grade para os
        lados.
      </p>
    </>
  );
}

function Row({
  h,
  par,
  pass,
  onOpenTurma,
  onNewTurma,
  onDropEmpty,
  onDropKid,
}: {
  h: string;
  par: Par;
  pass: (t: Turma) => boolean;
  onOpenTurma: (tid: number) => void;
  onNewTurma: (sala: string, par: Par, hora: string) => void;
  onDropEmpty: (sala: string, par: Par, hora: string) => void;
  onDropKid: (tid: number) => void;
}) {
  return (
    <>
      {DIVIDERS[h] && (
        <div
          className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted)] border-b"
          style={{ gridColumn: '1/-1', borderColor: 'var(--border)', background: 'var(--hover)' }}
        >
          {DIVIDERS[h]}
        </div>
      )}
      <div
        className="ag-sticky border-b border-r px-2 py-2 grid place-content-center text-xs font-semibold"
        style={{ borderColor: 'var(--border)' }}
      >
        {h}
      </div>
      {SALAS.map((s) => {
        const t = turmaAt(s.id, par, h);
        if (!t)
          return (
            <div key={s.id} className="border-b p-1" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => onNewTurma(s.id, par, h)}
                onDragOver={(e) => agOver(e, 'empty')}
                onDragLeave={agLeave}
                onDrop={(e) => {
                  e.preventDefault();
                  agLeave(e);
                  onDropEmpty(s.id, par, h);
                }}
                className="ag-empty w-full h-full min-h-[46px] rounded-xl border border-dashed border-transparent grid place-content-center text-[var(--muted)] opacity-30 hover:opacity-100 hover:border-[var(--border)] hover:bg-[var(--hover)] transition"
                data-tip={`Criar turma na ${s.n} · ${schLabel(par)} ${h} — ou solte uma turma arrastada aqui`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        const v = activeKidsIn(t.id),
          full = v >= t.cap,
          dim = !pass(t);
        return (
          <div key={s.id} className="border-b p-1" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => onOpenTurma(t.id)}
              draggable
              onDragStart={(e) => agDragTurma(e, t.id)}
              onDragEnd={agDragEnd}
              onDragOver={(e) => agOver(e, 'turma')}
              onDragLeave={agLeave}
              onDrop={(e) => {
                e.preventDefault();
                agLeave(e);
                onDropKid(t.id);
              }}
              className={`w-full text-left rounded-xl px-2 py-1.5 transition hover:shadow-md ${dim ? 'opacity-25' : ''}`}
              style={{ background: `${famC(t.nivel)}14`, border: `1px solid ${famC(t.nivel)}45` }}
              data-tip={`${nivelLabel(t.nivel)} · ${v}/${t.cap} alunos — toque para abrir, arraste para mover de horário`}
            >
              <p className="text-[10px] font-bold truncate" style={{ color: famC(t.nivel) }}>
                {nivelLabel(t.nivel)}
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                {v}/{t.cap}
                {full ? (
                  <span className="font-bold" style={{ color: '#16a34a' }}>
                    {' '}
                    · CHEIA
                  </span>
                ) : (
                  ` · ${t.cap - v} vaga${t.cap - v > 1 ? 's' : ''}`
                )}
              </p>
            </button>
          </div>
        );
      })}
    </>
  );
}
