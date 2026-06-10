// Matrículas, alunos, responsáveis e endereço — espelho de DASHBOARD_SCHEMA.sql
// §"MATRÍCULAS, ALUNOS, RESPONSÁVEIS, ENDEREÇO".
import {
  pgTable,
  pgEnum,
  bigint,
  text,
  boolean,
  date,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { dayPair, classes } from './agenda';

export const enrollmentStatus = pgEnum('enrollment_status', ['active', 'cancelled']);
export const enrollmentSource = pgEnum('enrollment_source', ['form', 'import', 'manual']);
export const classFormat = pgEnum('class_format', ['sede', 'domicilio']);
export const financialRespType = pgEnum('financial_resp_type', ['legal', 'second', 'other']);
export const responsibleType = pgEnum('responsible_type', ['legal', 'second', 'financial']);

// ── enrollments ─────────────────────────────────────────────────────────────
// A matrícula em si (≠ contrato, ≠ aluno). submission_id = idempotência (DEBITOS #1).
export const enrollments = pgTable(
  'enrollments',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    status: enrollmentStatus('status').notNull().default('active'),
    source: enrollmentSource('source').notNull(),
    submissionId: text('submission_id').notNull().unique(),
    classFormat: classFormat('class_format').notNull(),
    paymentMethod: text('payment_method').notNull().default('boleto-6x'),
    financialResponsibleType: financialRespType('financial_responsible_type').notNull(),
    requestedDayPair: dayPair('requested_day_pair'),
    requestedTimes: jsonb('requested_times'),
    authorizationMedia: boolean('authorization_media').notNull().default(false),
    authorizationContract: boolean('authorization_contract').notNull(),
    scheduleConfirmed: boolean('schedule_confirmed').notNull(),
    period: text('period').notNull(),
    notes: text('notes'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('enrollments_payment_method', sql`${t.paymentMethod} = 'boleto-6x'`),
    index('idx_enroll_period').on(t.period),
    index('idx_enroll_status').on(t.status),
  ],
);

// ── students ────────────────────────────────────────────────────────────────
// Turma é DO ALUNO (class_id). null = aguardando turma. Desligamento = soft delete.
export const students = pgTable(
  'students',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    enrollmentId: bigint('enrollment_id', { mode: 'number' }).notNull().references(() => enrollments.id),
    name: text('name').notNull(),
    birthDate: date('birth_date').notNull(),
    classId: bigint('class_id', { mode: 'number' }).references(() => classes.id, { onDelete: 'set null' }),
    atSchoolSince: date('at_school_since'),
    isActive: boolean('is_active').notNull().default(true),
    exitReason: text('exit_reason'),
    exitNote: text('exit_note'),
    exitDate: date('exit_date'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_students_enroll').on(t.enrollmentId),
    index('idx_students_class').on(t.classId),
    index('idx_students_active').on(t.isActive),
  ],
);

// ── responsibles ────────────────────────────────────────────────────────────
// No máx. 1 de cada tipo por matrícula. 'financial' só quando financial_responsible_type='other'.
export const responsibles = pgTable(
  'responsibles',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    enrollmentId: bigint('enrollment_id', { mode: 'number' }).notNull().references(() => enrollments.id),
    type: responsibleType('type').notNull(),
    name: text('name').notNull(),
    cpf: text('cpf'), // 11 dígitos, sem máscara
    phone: text('phone'),
    email: text('email'),
    relationship: text('relationship'),
    birthDate: date('birth_date'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_resp_enroll').on(t.enrollmentId),
    index('idx_resp_cpf').on(t.cpf),
    uniqueIndex('uq_resp_enroll_type').on(t.enrollmentId, t.type),
  ],
);

// ── addresses ───────────────────────────────────────────────────────────────
// Atende só Goiás (state = 'GO', regra de negócio crítica).
export const addresses = pgTable(
  'addresses',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    enrollmentId: bigint('enrollment_id', { mode: 'number' }).notNull().references(() => enrollments.id),
    cep: text('cep').notNull(),
    street: text('street').notNull(),
    number: text('number').notNull(), // dígitos ou 'S/N'
    complement: text('complement'),
    neighborhood: text('neighborhood').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('addresses_state_go', sql`${t.state} = 'GO'`),
    index('idx_addr_enroll').on(t.enrollmentId),
  ],
);
