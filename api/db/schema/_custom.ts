// Tipos de coluna Postgres que o Drizzle não traz nativos, usados pelo schema
// (espelho de docs/DASHBOARD_SCHEMA.sql — a fonte de verdade do banco).
import { customType } from 'drizzle-orm/pg-core';

// E-mail case-insensitive com unicidade (VALIDACOES §9). Requer `CREATE EXTENSION
// IF NOT EXISTS citext;` no banco — a primeira migration deve incluí-la.
export const citext = customType<{ data: string }>({
  dataType: () => 'citext',
});

// Endereço IP (rate-limit do login e auditoria).
export const inet = customType<{ data: string }>({
  dataType: () => 'inet',
});
