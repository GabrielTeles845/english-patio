// Casamento de rota do roteador único de /api (api/[...path].ts).
// Puro e sem dependências — testável isoladamente (tests/api/router.test.ts).

export interface RouteMatch {
  pattern: string;
  params: Record<string, string>;
}

// Quebra um caminho em segmentos não-vazios:
// '/api/enrollments/export' → ['api', 'enrollments', 'export'].
export function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

// Acha o padrão que casa com o pathname. Segmentos iniciados por ':' são
// curingas e viram params. Em empate de tamanho, vence quem tem MAIS segmentos
// literais — assim '/api/enrollments/export' ganha de '/api/enrollments/:id'.
export function matchPath(patterns: string[], pathname: string): RouteMatch | null {
  const segs = segments(pathname);
  let best: RouteMatch | null = null;
  let bestScore = -1;

  for (const pattern of patterns) {
    const psegs = segments(pattern);
    if (psegs.length !== segs.length) continue;

    const params: Record<string, string> = {};
    let score = 0;
    let ok = true;

    for (let i = 0; i < psegs.length; i++) {
      const p = psegs[i];
      if (p.startsWith(':')) {
        params[p.slice(1)] = decodeURIComponent(segs[i]);
      } else if (p === segs[i]) {
        score++;
      } else {
        ok = false;
        break;
      }
    }

    if (ok && score > bestScore) {
      best = { pattern, params };
      bestScore = score;
    }
  }

  return best;
}
