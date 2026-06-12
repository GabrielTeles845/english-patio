/* Servidor local full-stack para testes E2E (NÃO é produção).
   Serve o build do front (dist/) e delega TODO /api/* ao MESMO roteador de
   produção (api/[...path].ts), montando req/res no formato Vercel. Assim os
   fluxos E2E exercitam o roteador real (uma fonte de verdade só — nada de
   roteamento paralelo que possa divergir). Roda contra o banco LOCAL (.env.test,
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
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4321;

// Carrega uma vez o catch-all de produção (default export = handler Vercel).
type VercelHandler = (req: unknown, res: unknown) => unknown;
let apiHandler: VercelHandler | null = null;
async function getApiHandler(): Promise<VercelHandler> {
  if (!apiHandler) {
    const mod = await import(path.join(ROOT, 'api', '[...path].ts'));
    apiHandler = mod.default as VercelHandler;
  }
  return apiHandler;
}

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

function serveStatic(urlPath: string, res: http.ServerResponse) {
  // /dashboard EXATO = preview estático; resto = SPA (index.html)
  const rel = urlPath === '/dashboard' ? '/dashboard.html' : urlPath;
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

  // body (JSON) + query como a Vercel injeta. Os params de URL (:id) NÃO entram
  // aqui — o próprio catch-all os extrai do req.url e mescla no req.query.
  let body: unknown = undefined;
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString('utf8');
    if (raw) { try { body = JSON.parse(raw); } catch { body = raw; } }
  }
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { query[k] = v; });

  // augmenta req/res no formato Vercel (req.url é preservado — o roteador lê dele)
  const vreq = req as http.IncomingMessage & { query: unknown; body: unknown };
  vreq.query = query;
  vreq.body = body;
  const vres = res as http.ServerResponse & { status: (c: number) => unknown; json: (o: unknown) => void; send: (b: unknown) => void };
  vres.status = (c: number) => { res.statusCode = c; return vres; };
  vres.json = (o: unknown) => { if (!res.headersSent) res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); };
  vres.send = (b: unknown) => { res.end(typeof b === 'string' || Buffer.isBuffer(b) ? b : JSON.stringify(b)); };

  try {
    const handler = await getApiHandler();
    await handler(vreq, vres);
    if (!res.writableEnded) res.end();
  } catch (err) {
    console.error(`[api] ${req.method} ${url.pathname} →`, err);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: { code: 'INTERNAL', message: String((err as Error)?.message || err) } }));
  }
});

server.listen(PORT, () => console.log(`dev-server (E2E) em http://localhost:${PORT} · roteador único /api · DB=${(process.env.DATABASE_URL || '').replace(/:[^:@]*@/, ':***@')}`));
