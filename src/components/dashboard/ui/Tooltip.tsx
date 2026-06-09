import { useEffect } from 'react';

/* Tooltip global — port do #tipBubble do preview (DESIGN.md §7): balão ÚNICO
   navy em position:fixed (imune a overflow:hidden), seta, max-width 230px.
   Uso: qualquer elemento com `data-tip="texto"`. Substitui `title=` (proibido). */

export function GlobalTooltip() {
  useEffect(() => {
    let bubble = document.getElementById('tipBubble');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.id = 'tipBubble';
      document.body.appendChild(bubble);
    }
    const el = bubble;

    const show = (target: HTMLElement) => {
      const tip = target.getAttribute('data-tip');
      if (!tip) return;
      el.textContent = tip;
      el.style.display = 'block';
      const r = target.getBoundingClientRect();
      const bw = el.offsetWidth, bh = el.offsetHeight;
      let top = r.top - bh - 8;
      const below = top < 6;
      el.classList.toggle('below', below);
      if (below) top = r.bottom + 8;
      const cx = r.left + r.width / 2;
      let left = cx - bw / 2;
      left = Math.max(6, Math.min(left, innerWidth - bw - 6));
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
      el.style.setProperty('--ax', `${cx - left}px`);
    };
    const hide = () => {
      el.style.display = 'none';
    };

    const over = (ev: Event) => {
      const t = (ev.target as HTMLElement | null)?.closest?.('[data-tip]');
      if (t instanceof HTMLElement) show(t);
    };
    const out = (ev: Event) => {
      if ((ev.target as HTMLElement | null)?.closest?.('[data-tip]')) hide();
    };

    document.addEventListener('mouseover', over);
    document.addEventListener('mouseout', out);
    document.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mouseout', out);
      document.removeEventListener('scroll', hide, true);
      el.remove();
    };
  }, []);

  return null;
}
