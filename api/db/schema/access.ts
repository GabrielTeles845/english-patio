// Acesso & auditoria — espelho de docs/DASHBOARD_SCHEMA.sql §"ACESSO & AUDITORIA".
// Tabelas: users, login_attempts, password_reset_tokens, activity_log.
// Convenções (SCHEMA.sql): PK bigint identity; timestamptz em UTC; nomes em
// inglês no banco (PT na UI); soft-delete via is_active (nada de CASCADE em aluno).
import {
  pgTable,
  pgEnum,
  bigint,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { citext, inet } from './_custom';

// ── Enums usados pelas tabelas de acesso ──────────────────────────────────────
export const userRole = pgEnum('user_role', ['director', 'supervisor', 'secretary']);
export const actorType = pgEnum('actor_type', ['user', 'system', 'autentique']);

// ── users ─────────────────────────────────────────────────────────────────────
// 1º Diretor é semeado no deploy (SEED_ADMIN_*), com must_change_password=true.
// A regra "sempre >=1 Diretor ativo" e a unicidade de papel são validadas na
// camada /api (DASHBOARD_API §10), não em CHECK.
export const users = pgTable('users', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  name: text('name').notNull(),
  email: citext('email').notNull().unique(), // e-mail único (VALIDACOES §9)
  passwordHash: text('password_hash').notNull(), // bcrypt cost >= 12 (PLAN §3)
  role: userRole('role').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(true), // 1ª senha temporária
  // JWTs emitidos ANTES disto são recusados (trocar senha derruba sessões; PLAN §3).
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── login_attempts ─────────────────────────────────────────────────────────────
// Rate-limit do login no próprio Postgres (PLAN §3) — sem Redis. Rate-limit =
// contar tentativas recentes (janela curta) por email e por ip.
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    email: text('email'), // e-mail tentado (pode não existir)
    ip: inet('ip'),
    success: boolean('success').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_login_attempts_email').on(t.email, t.createdAt.desc()),
    index('idx_login_attempts_ip').on(t.ip, t.createdAt.desc()),
  ],
);

// ── password_reset_tokens ───────────────────────────────────────────────────────
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(), // hash do token, nunca o token
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (t) => [index('idx_reset_tokens_user').on(t.userId)],
);

// ── activity_log ─────────────────────────────────────────────────────────────────
// actor_id null para system/autentique. detail é anonimizável p/ LGPD (PLAN §11).
export const activityLog = pgTable(
  'activity_log',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    actorType: actorType('actor_type').notNull(), // user | system | autentique
    actorId: bigint('actor_id', { mode: 'number' }).references(() => users.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: bigint('target_id', { mode: 'number' }),
    detail: jsonb('detail'),
    ip: inet('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_activity_created').on(t.createdAt.desc()),
    index('idx_activity_actor').on(t.actorType, t.actorId),
  ],
);
