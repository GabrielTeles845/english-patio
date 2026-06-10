// Contratos & Autentique — espelho de DASHBOARD_SCHEMA.sql §"CONTRATOS & AUTENTIQUE".
import {
  pgTable,
  pgEnum,
  bigint,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { enrollments } from './enrollment';

export const contractStatus = pgEnum('contract_status', [
  'pending', 'sent', 'viewed', 'signed', 'rejected', 'failed',
]);
export const sentVia = pgEnum('sent_via', ['email', 'whatsapp']);
export const contractEventType = pgEnum('contract_event_type', [
  'signature.viewed', 'signature.accepted', 'signature.rejected', 'signature.delivery_failed', 'document.finished',
]);

// ── contract_templates ──────────────────────────────────────────────────────
export const contractTemplates = pgTable('contract_templates', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  name: text('name').notNull(),
  pdfUrl: text('pdf_url').notNull(),
  fieldMap: jsonb('field_map').notNull(), // coordenadas dos campos (como o pdfService atual)
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(false),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── contracts ───────────────────────────────────────────────────────────────
// SEM updated_at de propósito: o status vem do webhook do Autentique (sem edição
// concorrente pela UI). Datas por transição (sent/viewed/signed/...).
export const contracts = pgTable(
  'contracts',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    enrollmentId: bigint('enrollment_id', { mode: 'number' }).notNull().references(() => enrollments.id),
    templateId: bigint('template_id', { mode: 'number' }).references(() => contractTemplates.id),
    pdfUrl: text('pdf_url'),
    status: contractStatus('status').notNull().default('pending'),
    autentiqueDocId: text('autentique_doc_id'),
    sentVia: sentVia('sent_via'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_contracts_enroll').on(t.enrollmentId),
    index('idx_contracts_status').on(t.status),
  ],
);

// ── contract_events ─────────────────────────────────────────────────────────
// event_id único = dedup do webhook (entrega sem ordem + duplicatas).
export const contractEvents = pgTable(
  'contract_events',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    contractId: bigint('contract_id', { mode: 'number' })
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),
    eventId: text('event_id').notNull().unique(),
    type: contractEventType('type').notNull(),
    payload: jsonb('payload'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_cevents_contract').on(t.contractId)],
);
