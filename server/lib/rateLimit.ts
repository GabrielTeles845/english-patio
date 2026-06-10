// Rate-limit do login no próprio Postgres (DASHBOARD_PLAN §3) — sem Redis.
// Conta tentativas FALHAS recentes por e-mail e por IP numa janela curta.
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { loginAttempts } from '../db/schema';

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 20;

async function countFails(column: 'email' | 'ip', value: string, since: Date): Promise<number> {
  const col = column === 'email' ? loginAttempts.email : loginAttempts.ip;
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(col, value), eq(loginAttempts.success, false), gt(loginAttempts.createdAt, since)));
  return rows[0]?.c ?? 0;
}

export async function isRateLimited(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  if ((await countFails('email', email, since)) >= MAX_FAILS_PER_EMAIL) return true;
  if (ip && (await countFails('ip', ip, since)) >= MAX_FAILS_PER_IP) return true;
  return false;
}

export async function recordAttempt(email: string, ip: string | null, success: boolean): Promise<void> {
  await db.insert(loginAttempts).values({ email, ip, success });
}
