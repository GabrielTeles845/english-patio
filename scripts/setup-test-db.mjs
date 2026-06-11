// Aplica o schema (migrations do Drizzle) no Postgres local de teste.
// Roda com: node --env-file=.env.test scripts/setup-test-db.mjs
//
// Recria o schema do zero (drop + create) a cada execução, então é idempotente:
// o banco de teste é efêmero (tmpfs) e sempre parte limpo. Aplica os arquivos
// .sql de server/db/migrations em ordem, separando nos breakpoints do Drizzle.
import postgres from 'postgres';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL ausente — rode com: node --env-file=.env.test scripts/setup-test-db.mjs');
  process.exit(1);
}
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error('Recusando: DATABASE_URL não é local. Este script só roda contra o Postgres de teste.');
  process.exit(1);
}

const dir = 'server/db/migrations';
const sql = postgres(url, { max: 1 });
try {
  // parte sempre de um schema limpo
  await sql.unsafe('drop schema if exists public cascade; create schema public;');

  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const ddl = await readFile(path.join(dir, f), 'utf8');
    const stmts = ddl
      .split(/-->\s*statement-breakpoint/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of stmts) await sql.unsafe(stmt);
    console.log('aplicado:', f);
  }
  console.log('Schema de teste pronto.');
} finally {
  await sql.end();
}
