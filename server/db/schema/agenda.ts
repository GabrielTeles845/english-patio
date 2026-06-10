// Estrutura escolar — espelho de docs/DASHBOARD_SCHEMA.sql §"ESTRUTURA ESCOLAR"
// (AGENDA_PLAN.md). Tabelas: rooms, levels, classes.
// O professor é da SALA (1 por sala); a turma não tem professor.
import {
  pgTable,
  pgEnum,
  bigint,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const levelFamily = pgEnum('level_family', ['fun', 'conv', 'power', 'sprint']);
export const dayPair = pgEnum('day_pair', ['seg-qua', 'ter-qui']);

// ── rooms ───────────────────────────────────────────────────────────────────
// 13 salas fixas (seed). Nome único case-insensitive (VALIDACOES §11).
export const rooms = pgTable(
  'rooms',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    name: text('name').notNull(),
    color: text('color').notNull(),
    teacherName: text('teacher_name'), // professor é da sala: 1 por sala
    isActive: boolean('is_active').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_rooms_name').on(sql`lower(${t.name})`)],
);

// ── levels ──────────────────────────────────────────────────────────────────
// 19 níveis fixos (seed), em ordem de evolução (sort_order).
export const levels = pgTable('levels', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  key: text('key').notNull().unique(), // ex. 'power-2'
  name: text('name').notNull(), // ex. 'Power 2'
  family: levelFamily('family').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

// ── classes ─────────────────────────────────────────────────────────────────
// Turma = slot (sala, par de dias, horário, período) reusado a cada semestre.
export const classes = pgTable(
  'classes',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    roomId: bigint('room_id', { mode: 'number' }).notNull().references(() => rooms.id),
    dayPair: dayPair('day_pair').notNull(),
    startTime: text('start_time').notNull(), // um dos 8 slots reais
    levelId: bigint('level_id', { mode: 'number' }).notNull().references(() => levels.id),
    capacity: integer('capacity').notNull().default(7), // 7 padrão; vaga extra até 9
    period: text('period').notNull(), // ex. '2026.2'
    isActive: boolean('is_active').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_class_slot').on(t.roomId, t.dayPair, t.startTime, t.period),
    index('idx_classes_level').on(t.levelId),
    index('idx_classes_period').on(t.period),
    check('classes_capacity_range', sql`${t.capacity} BETWEEN 1 AND 9`),
    check(
      'classes_start_time_valid',
      sql`${t.startTime} IN ('8:30','9:30','10:30','13:30','14:30','15:30','16:45','17:45')`,
    ),
  ],
);
