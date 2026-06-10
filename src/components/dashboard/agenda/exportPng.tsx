import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toPng } from 'html-to-image';

/* Exportação de imagens da agenda — port de exportPng (dashboard.html l.3347):
   nó DOM dedicado fora da tela (920px, fundo branco), html-to-image com
   pixelRatio 2 e download direto. No preview a lib vinha do CDN (ensureH2I);
   aqui é dependência empacotada — o resto da técnica é o mesmo. */

export async function exportPng(node: ReactElement, filename: string): Promise<boolean> {
  const wrap = document.createElement('div');
  /* dash-root garante as fontes/vars do painel no nó isolado */
  wrap.className = 'dash-root';
  wrap.style.cssText = 'position:fixed;left:-12000px;top:0;width:920px;background:#fff;z-index:-1;';
  document.body.appendChild(wrap);
  const root = createRoot(wrap);
  try {
    flushSync(() => root.render(node));
    /* espera fontes + um frame para o layout assentar antes do raster */
    await document.fonts.ready.catch(() => undefined);
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    const target = wrap.firstElementChild as HTMLElement | null;
    if (!target) return false;
    const url = await toPng(target, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    return true;
  } catch {
    return false;
  } finally {
    root.unmount();
    wrap.remove();
  }
}
