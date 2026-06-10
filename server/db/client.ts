// Conexão com o Neon (Postgres) para as funções serverless da Vercel.
// Usa o driver HTTP do Neon (drizzle-orm/neon-http), ideal para o ambiente
// serverless (sem pool persistente). PLAN §2.
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL não definida — configure a connection string do Neon no ambiente (ver .env.example).',
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export { schema };
