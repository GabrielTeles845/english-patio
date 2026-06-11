// GET /api/overview?period=&cohort= — tudo da Visão geral num payload (só Diretor).
// Tudo derivado no servidor (nunca confia no client). period (6m|12m|month) é a
// janela do gráfico de movimento. DASHBOARD_API §2.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../server/db/client';
import { students, enrollments, contracts, classes, rooms, levels, addresses } from '../server/db/schema';
import { ok, fail } from '../server/lib/http';
import { getSession } from '../server/lib/auth';
import { hasRole } from '../server/lib/rbac';

const COUNT = sql<number>`count(*)::int`;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ['director'])) return fail(res, 403, 'FORBIDDEN', 'Visão geral é só do Diretor.');

  const periodParam = typeof req.query.period === 'string' ? req.query.period : '6m';
  const months = periodParam === '12m' ? 12 : periodParam === 'month' ? 1 : 6;

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const one = async (qb: Promise<{ c: number }[]>) => (await qb)[0]?.c ?? 0;
  const active = await one(db.select({ c: COUNT }).from(students).where(eq(students.isActive, true)));
  const newWeek = await one(db.select({ c: COUNT }).from(enrollments).where(sql`${enrollments.submittedAt} >= now() - interval '7 days'`));
  const contractsPending = await one(db.select({ c: COUNT }).from(contracts).where(eq(contracts.status, 'pending')));
  const enrolledMonth = await one(db.select({ c: COUNT }).from(enrollments).where(sql`${enrollments.submittedAt} >= date_trunc('month', now())`));
  const withoutClass = await one(db.select({ c: COUNT }).from(students).where(and(eq(students.isActive, true), sql`${students.classId} IS NULL`)));
  const enrollTotal = await one(db.select({ c: COUNT }).from(enrollments));

  // ── Funil (contratos por status) ─────────────────────────────────────────────
  const funnel = { pending: 0, sent: 0, viewed: 0, signed: 0, rejected: 0, failed: 0 } as Record<string, number>;
  const funnelRows = await db.select({ status: contracts.status, c: COUNT }).from(contracts).groupBy(contracts.status);
  for (const r of funnelRows) funnel[r.status] = r.c;

  // ── Ocupação por sala ────────────────────────────────────────────────────────
  const capByRoom = await db
    .select({ roomId: rooms.id, name: rooms.name, color: rooms.color, capacity: sql<number>`coalesce(sum(${classes.capacity}),0)::int` })
    .from(rooms)
    .leftJoin(classes, and(eq(classes.roomId, rooms.id), eq(classes.isActive, true)))
    .where(eq(rooms.isActive, true))
    .groupBy(rooms.id, rooms.name, rooms.color)
    .orderBy(asc(rooms.name));
  const occRows = await db
    .select({ roomId: classes.roomId, c: COUNT })
    .from(students)
    .innerJoin(classes, eq(classes.id, students.classId))
    .where(eq(students.isActive, true))
    .groupBy(classes.roomId);
  const occMap = new Map(occRows.map((r) => [r.roomId, r.c]));
  const occupancyByRoom = capByRoom.map((r) => ({ ...r, occupied: occMap.get(r.roomId) ?? 0 }));

  // ── Alunos por nível ─────────────────────────────────────────────────────────
  const studentsByLevel = (
    await db
      .select({ levelKey: levels.key, name: levels.name, family: levels.family, sortOrder: levels.sortOrder, count: sql<number>`count(${students.id})::int` })
      .from(levels)
      .leftJoin(classes, eq(classes.levelId, levels.id))
      .leftJoin(students, and(eq(students.classId, classes.id), eq(students.isActive, true)))
      .groupBy(levels.id, levels.key, levels.name, levels.family, levels.sortOrder)
      .orderBy(asc(levels.sortOrder))
  ).map(({ sortOrder: _s, ...rest }) => rest);

  // ── Aniversariantes do mês ───────────────────────────────────────────────────
  const birthdays = await db
    .select({ studentId: students.id, name: students.name, date: students.birthDate })
    .from(students)
    .where(and(eq(students.isActive, true), sql`extract(month from ${students.birthDate}) = extract(month from now())`))
    .orderBy(sql`extract(day from ${students.birthDate})`);

  // ── Bairros (top 8) ──────────────────────────────────────────────────────────
  const neighborhoods = await db
    .select({ name: addresses.neighborhood, count: COUNT })
    .from(addresses)
    .groupBy(addresses.neighborhood)
    .orderBy(desc(sql`count(*)`))
    .limit(8);

  // ── Últimas matrículas ───────────────────────────────────────────────────────
  const recentEnr = await db.select().from(enrollments).orderBy(desc(enrollments.submittedAt)).limit(8);
  const recent = [] as { enrollmentId: number; studentName: string | null; neighborhood: string | null; submittedAt: Date }[];
  for (const e of recentEnr) {
    const s = await db.select({ name: students.name }).from(students).where(eq(students.enrollmentId, e.id)).orderBy(asc(students.id)).limit(1);
    const a = await db.select({ n: addresses.neighborhood }).from(addresses).where(eq(addresses.enrollmentId, e.id)).limit(1);
    recent.push({ enrollmentId: e.id, studentName: s.length ? s[0].name : null, neighborhood: a.length ? a[0].n : null, submittedAt: e.submittedAt });
  }

  // ── Movimento mensal (entradas x saídas) na janela ──────────────────────────
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const entriesRows = await db
    .select({ m: sql<string>`to_char(date_trunc('month', ${enrollments.submittedAt}),'YYYY-MM')`, c: COUNT })
    .from(enrollments)
    .where(sql`${enrollments.submittedAt} >= date_trunc('month', now()) - make_interval(months => ${months - 1})`)
    .groupBy(sql`1`);
  const exitsRows = await db
    .select({ m: sql<string>`to_char(date_trunc('month', ${students.exitDate}),'YYYY-MM')`, c: COUNT })
    .from(students)
    .where(sql`${students.exitDate} IS NOT NULL AND ${students.exitDate} >= date_trunc('month', now()) - make_interval(months => ${months - 1})`)
    .groupBy(sql`1`);
  const entriesMap = new Map(entriesRows.map((r) => [r.m, r.c]));
  const exitsMap = new Map(exitsRows.map((r) => [r.m, r.c]));
  const movement = monthKeys.map((m) => ({ period: m, entries: entriesMap.get(m) ?? 0, exits: exitsMap.get(m) ?? 0 }));

  return ok(res, {
    kpis: { active, newWeek, contractsPending, enrolledMonth, withoutClass },
    funnel,
    occupancyByRoom,
    studentsByLevel,
    movement,
    birthdays,
    neighborhoods,
    recent,
    empty: active === 0 && enrollTotal === 0,
  });
}
