// Inscrições de Web Push (notificações do navegador/SO). Cada navegador que a
// pessoa autoriza vira uma linha; o disparo é fan-out por usuário, junto com a
// notificação in-app (server/lib/webpush.ts). Só Diretor e Secretaria têm sino,
// então só eles se inscrevem. Endpoint é único por navegador → upsert por ele.
import { pgTable, bigint, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './access';

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_push_endpoint').on(t.endpoint),
    index('idx_push_user').on(t.userId),
  ],
);
