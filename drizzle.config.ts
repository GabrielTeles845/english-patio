// Config do drizzle-kit — gera/aplica migrations a partir do schema em api/db.
// O DDL canônico vive em docs/DASHBOARD_SCHEMA.sql; o Drizzle espelha-o (PLAN §5).
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './api/db/schema/index.ts',
  out: './api/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
