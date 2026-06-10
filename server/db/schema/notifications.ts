// Notificações (DASHBOARD_SCHEMA.sql §NOTIFICAÇÕES). Fan-out por usuário; a lista
// é filtrada por papel no fan-out (Diretor e Secretaria têm sino; Supervisor não).
import { pgTable, pgEnum, bigint, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './access';
import { students } from './enrollment';

export const notificationType = pgEnum('notification_type', [
  'enroll', 'signed', 'viewed', 'stale', 'email', 'rejected', 'failed',
]);

export const notifications = pgTable(
  'notifications',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationType('type').notNull(),
    studentId: bigint('student_id', { mode: 'number' }).references(() => students.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    body: text('body'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_notif_user_unread').on(t.userId).where(sql`${t.readAt} is null`)],
);
