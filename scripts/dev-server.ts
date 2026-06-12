/* Servidor local full-stack para testes E2E (NÃO é produção).
   Serve o build do front (dist/) e roteia /api/* para os handlers em api/*.ts,
   replicando o roteamento file-based da Vercel ([id], index) e injetando
   req.query/req.body como a Vercel faz. Roda contra o banco LOCAL (.env.test,
   via server/db/client que escolhe postgres-js no localhost).

   Uso: node --env-file=.env.test --import tsx scripts/dev-server.ts
   Porta: PORT (padrão 4321). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// trava: roda os handlers (que escrevem no banco) — só contra banco local.
const DBURL = process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(DBURL)) {
  console.error(`dev-server recusado: DATABASE_URL não é local (${DBURL.replace(/:[^:@]*@/, ':***@')}). Use .env.test.`);
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_DIR = path.join(ROOT, 'api');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4321;

/* ---- roteamento file-based: lista de padrões {parts, file, dynamicAt} ---- */
interface Route { parts: string[]; file: string; nParams: number }
function collectRoutes(dir: string, prefix: string[] = []): Route[] {
  const out: Route[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...collectRoutes(path.join(dir, entry.name), [...prefix, entry.name]));
    } else if (entry.name.endsWith('.ts')) {
      const base = entry.name.replace(/\.ts$/, '');
      const parts = base === 'index' ? prefix : [...prefix, base];
      const nParams = parts.filter((p) => p.startsWith('[')).length;
      out.push({ parts, file: path.join(dir, entry.name), nParams });
    }
  }
  return out;
}
const ROUTES = collectRoutes(API_DIR);

/* casa os segmentos do request contra os padrões; estático vence dinâmico
   (menos params primeiro). Devolve {file, params} ou null. */
function matchRoute(segments: string[]): { file: string; params: Record<string, string> } | null {
  const candidates = ROUTES
    .filter((r) => r.parts.length === segments.length)
    .filter((r) => r.parts.every((p, i) => p.startsWith('[') || p === segments[i]))
    .sort((a, b) => a.nParams - b.nParams);
  if (!candidates.length) return null;
  const r = candidates[0];
  const params: Record<string, string> = {};
  r.parts.forEach((p, i) => {
    if (p.startsWith('[')) params[p.replace(/^\[\.{0,3}|\]$/g, '')] = decodeURIComponent(segments[i]);
  });
  return { file: r.file, params };
}

const handlerCache = new Map<string, (req: unknown, res: unknown) => unknown>();
async function loadHandler(file: string) {
  if (!handlerCache.has(file)) {
    const mod = await import(file);
    handlerCache.set(file, mod.default);
  }
  return handlerCache.get(file)!;
}

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

function serveStatic(urlPath: string, res: http.ServerResponse) {
  // /dashboard EXATO = preview estático; resto = SPA (index.html)
  let rel = urlPath === '/dashboard' ? '/dashboard.html' : urlPath;
  let file = path.join(DIST, rel);
  if (!file.startsWith(DIST)) return res.writeHead(403).end('forbidden');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end('not found (rode npm run build antes)');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  if (!url.pathname.startsWith('/api/')) return serveStatic(url.pathname, res);

  const segments = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '').split('/');
  const matched = matchRoute(segments);
  if (!matched) {
    res.writeHead(404, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: `sem rota para /api/${segments.join('/')}` } }));
  }

  // body (JSON) + query como a Vercel injeta
  let body: unknown = undefined;
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString('utf8');
    if (raw) { try { body = JSON.parse(raw); } catch { body = raw; } }
  }
  const query: Record<string, string> = { ...matched.params };
  url.searchParams.forEach((v, k) => { query[k] = v; });

  // augmenta req/res no formato Vercel
  const vreq = req as http.IncomingMessage & { query: unknown; body: unknown };
  vreq.query = query;
  vreq.body = body;
  const vres = res as http.ServerResponse & { status: (c: number) => unknown; json: (o: unknown) => void; send: (b: unknown) => void };
  vres.status = (c: number) => { res.statusCode = c; return vres; };
  vres.json = (o: unknown) => { if (!res.headersSent) res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); };
  vres.send = (b: unknown) => { res.end(typeof b === 'string' || Buffer.isBuffer(b) ? b : JSON.stringify(b)); };

  try {
    const handler = await loadHandler(matched.file);
    await handler(vreq, vres);
    if (!res.writableEnded) res.end();
  } catch (err) {
    console.error(`[api] ${req.method} ${url.pathname} →`, err);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: { code: 'INTERNAL', message: String((err as Error)?.message || err) } }));
  }
});

server.listen(PORT, () => console.log(`dev-server (E2E) em http://localhost:${PORT} · ${ROUTES.length} rotas /api · DB=${(process.env.DATABASE_URL || '').replace(/:[^:@]*@/, ':***@')}`));
