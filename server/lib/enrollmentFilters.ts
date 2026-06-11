// Filtros compartilhados da lista de matrículas (GET /api/enrollments) e do
// export CSV (GET /api/enrollments/export). DASHBOARD_API §3/§4.8.
import { eq, sql, type SQL } from 'drizzle-orm';
import { enrollments } from '../db/schema';

function qstr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

// Monta as condições WHERE a partir dos query params (todos opcionais).
export function buildEnrollmentConds(query: Record<string, unknown>): SQL[] {
  const conds: SQL[] = [];

  const period = qstr(query.period);
  if (period) conds.push(eq(enrollments.period, period));

  const media = qstr(query.media);
  if (media === 'true') conds.push(eq(enrollments.authorizationMedia, true));
  if (media === 'false') conds.push(eq(enrollments.authorizationMedia, false));

  const status = qstr(query.status);
  if (status === 'active') {
    conds.push(sql`EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.is_active = true)`);
  } else if (status === 'inactive') {
    conds.push(sql`NOT EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.is_active = true)`);
  }

  const hasSiblings = qstr(query.hasSiblings);
  if (hasSiblings === 'true') {
    conds.push(sql`(SELECT count(*) FROM students s WHERE s.enrollment_id = ${enrollments.id}) > 1`);
  }

  const neighborhood = qstr(query.neighborhood);
  if (neighborhood) {
    conds.push(sql`EXISTS (SELECT 1 FROM addresses a WHERE a.enrollment_id = ${enrollments.id} AND a.neighborhood ILIKE ${`%${neighborhood}%`})`);
  }

  const contractStatus = qstr(query.contractStatus);
  if (contractStatus) {
    conds.push(sql`EXISTS (SELECT 1 FROM contracts c WHERE c.enrollment_id = ${enrollments.id} AND c.status = ${contractStatus})`);
  }

  const q = qstr(query.q);
  if (q) {
    const like = `%${q}%`;
    conds.push(sql`(EXISTS (SELECT 1 FROM students s WHERE s.enrollment_id = ${enrollments.id} AND s.name ILIKE ${like}) OR EXISTS (SELECT 1 FROM responsibles r WHERE r.enrollment_id = ${enrollments.id} AND r.name ILIKE ${like}))`);
  }

  const dayPair = qstr(query.dayPair);
  if (dayPair === 'seg-qua' || dayPair === 'ter-qui') {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id WHERE s.enrollment_id = ${enrollments.id} AND cl.day_pair = ${dayPair})`);
  }
  const time = qstr(query.time);
  if (time) {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id WHERE s.enrollment_id = ${enrollments.id} AND cl.start_time = ${time})`);
  }
  const level = qstr(query.level);
  if (level && Number.isInteger(Number(level))) {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id WHERE s.enrollment_id = ${enrollments.id} AND cl.level_id = ${Number(level)})`);
  }
  const room = qstr(query.room);
  if (room && Number.isInteger(Number(room))) {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id WHERE s.enrollment_id = ${enrollments.id} AND cl.room_id = ${Number(room)})`);
  }
  const teacher = qstr(query.teacher);
  if (teacher === 'none') {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id JOIN rooms ro ON ro.id = cl.room_id WHERE s.enrollment_id = ${enrollments.id} AND ro.teacher_name IS NULL)`);
  } else if (teacher) {
    conds.push(sql`EXISTS (SELECT 1 FROM students s JOIN classes cl ON cl.id = s.class_id JOIN rooms ro ON ro.id = cl.room_id WHERE s.enrollment_id = ${enrollments.id} AND ro.teacher_name = ${teacher})`);
  }

  return conds;
}

// Escapa um valor para uma célula CSV (RFC 4180): aspas se tiver vírgula/aspas/quebra.
export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
