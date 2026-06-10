import type { DragEvent } from 'react';

/* Drag-and-drop da Agenda — port 1:1 do preview (dashboard.html l.2606–2612):
   turma → slot vazio na grade · aluno (fila / página da sala / mural) → turma.
   Mesmo padrão de estado mutável fora do React (o drag é transitório e os
   destinos válidos ganham a classe .ag-drop direto no DOM, como lá). */

export type AgDrag = { type: 'turma'; tid: number } | { type: 'kid'; sid: number; ki: number } | null;

let agDrag: AgDrag = null;

export const getAgDrag = (): AgDrag => agDrag;

/* port de agDragTurma (l.2608) */
export function agDragTurma(ev: DragEvent, tid: number): void {
  agDrag = { type: 'turma', tid };
  ev.dataTransfer.effectAllowed = 'move';
  try {
    ev.dataTransfer.setData('text/plain', 't');
  } catch {
    /* IE/edge antigos */
  }
  document.body.classList.add('ag-dragging');
}

/* port de agDragKid (l.2609) */
export function agDragKid(ev: DragEvent, sid: number, ki: number): void {
  ev.stopPropagation();
  agDrag = { type: 'kid', sid, ki };
  ev.dataTransfer.effectAllowed = 'move';
  try {
    ev.dataTransfer.setData('text/plain', 'k');
  } catch {
    /* idem */
  }
  document.body.classList.add('ag-dragging');
}

/* port de agDragEnd (l.2610) */
export function agDragEnd(): void {
  agDrag = null;
  document.body.classList.remove('ag-dragging');
  document.querySelectorAll('.ag-drop').forEach((el) => el.classList.remove('ag-drop'));
}

/* port de agOver (l.2611): só aceita o tipo certo para cada alvo */
export function agOver(ev: DragEvent, kind: 'empty' | 'turma' | 'sala'): void {
  if (!agDrag) return;
  if (kind === 'empty' && agDrag.type !== 'turma') return;
  if ((kind === 'turma' || kind === 'sala') && agDrag.type !== 'kid') return;
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'move';
  ev.currentTarget.classList.add('ag-drop');
}

/* port de agLeave (l.2612) */
export function agLeave(ev: DragEvent): void {
  ev.currentTarget.classList.remove('ag-drop');
}
