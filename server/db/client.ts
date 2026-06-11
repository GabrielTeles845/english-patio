// Conexão com o banco para as funções serverless da Vercel. PLAN §2.
//
// Produção: driver HTTP do Neon (drizzle-orm/neon-http), ideal para serverless
// (sem pool persistente). Testes: quando a DATABASE_URL aponta para localhost
// (Postgres local do docker-compose.test.yml), usa o driver postgres-js — o
// neon-http só fala o protocolo HTTP do Neon, que um Postgres comum não atende.
// A escolha é por host, então em produção (host *.neon.tech) nada muda.
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL não definida — configure a connection string do Neon no ambiente (ver .env.example).',
  );
}

let host = '';
try {
  host = new URL(connectionString).hostname;
} catch {
  /* connection string sem URL parseável — deixa o driver reclamar adiante */
}
const isLocal = host === 'localhost' || host === '127.0.0.1';

// A API do drizzle é a mesma para os dois drivers; tipamos como o de produção
// (neon-http) para que os handlers fiquem idênticos. O cast no ramo local é só
// para reconciliar os tipos — em runtime o postgres-js responde à mesma API.
export const db: NeonHttpDatabase<typeof schema> = isLocal
  ? (drizzlePg(postgres(connectionString, { max: 1 }), { schema }) as unknown as NeonHttpDatabase<typeof schema>)
  : drizzleNeon(neon(connectionString), { schema });

export { schema };
