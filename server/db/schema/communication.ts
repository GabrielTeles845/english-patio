// Comunicação & conteúdo — espelho de DASHBOARD_SCHEMA.sql §"COMUNICAÇÃO & CONTEÚDO".
// (a tabela notifications fica em notifications.ts.)
import {
  pgTable,
  pgEnum,
  bigint,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './access';
import { enrollments } from './enrollment';

export const announcementStatus = pgEnum('announcement_status', ['sending', 'sent', 'failed']);
export const announcementKind = pgEnum('announcement_kind', ['manual', 'automatic']);
export const channel = pgEnum('channel', ['email', 'whatsapp']);
export const recipientStatus = pgEnum('recipient_status', ['queued', 'sent', 'failed', 'prepared']);

// ── announcements ───────────────────────────────────────────────────────────
export const announcements = pgTable('announcements', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  subject: text('subject').notNull(),
  body: text('body').notNull(), // variáveis {{nome_responsavel}}/{{nome_aluno}}
  channels: channel('channels').array().notNull(),
  audienceFilter: jsonb('audience_filter'),
  status: announcementStatus('status').notNull().default('sending'),
  kind: announcementKind('kind').notNull().default('manual'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
});

// ── announcement_recipients ─────────────────────────────────────────────────
// WhatsApp = 'prepared' (mensagem preparada por família).
export const announcementRecipients = pgTable(
  'announcement_recipients',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    announcementId: bigint('announcement_id', { mode: 'number' })
      .notNull()
      .references(() => announcements.id, { onDelete: 'cascade' }),
    enrollmentId: bigint('enrollment_id', { mode: 'number' }).references(() => enrollments.id, { onDelete: 'set null' }),
    channel: channel('channel').notNull(),
    status: recipientStatus('status').notNull().default('queued'),
  },
  (t) => [index('idx_recipients_ann').on(t.announcementId)],
);

// ── site_content ────────────────────────────────────────────────────────────
// value = texto PUBLICADO; draft_value não-nulo = "pendência". Publicar move
// draft_value→value e limpa o rascunho. Tetos por campo em VALIDACOES §17.
export const siteContent = pgTable(
  'site_content',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    pageKey: text('page_key').notNull(),
    fieldKey: text('field_key').notNull(),
    value: text('value').notNull(),
    draftValue: text('draft_value'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_site_content_page_field').on(t.pageKey, t.fieldKey)],
);

// ── announcement_templates ──────────────────────────────────────────────────
// Modelos de comunicado (texto pronto que a Diretora reusa). name = rótulo do
// botão; icon/color guardam a aparência (nome lucide + hex). Os 3 modelos
// iniciais são semeados na migration.
export const announcementTemplates = pgTable('announcement_templates', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(), // variáveis {{nome_responsavel}}/{{nome_aluno}}
  icon: text('icon').notNull().default('file-text'),
  color: text('color').notNull().default('#2F539A'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
