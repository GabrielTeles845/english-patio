// Testes de integração da Visão geral (DASHBOARD_API §2, só Diretor).
// Rodar: npm run test:api. Agrega globalmente, então as asserções checam
// estrutura + que os dados semeados aqui APARECEM (>=), nunca contagens exatas.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { asc, eq, inArray, like } from 'drizzle-orm';
import overview from '../../api/overview';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, addresses, contracts, classes, rooms, levels } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-ov-dir@example.com';
const SEC = 'apitest-ov-sec@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2093.1';
const PREFIX = 'ZZOv ';
const SUB = 'apitest-ov-enrollment';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;
let roomId = 0, levelKey = '', enrollId = 0;

const now = new Date();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const curKey = `${now.getFullYear()}-${mm}`;

async function cleanup() {
  const er = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.submissionId, SUB));
  const ids = er.map((r) => r.id);
  if (ids.length) {
    await db.delete(contracts).where(inArray(contracts.enrollmentId, ids));
    await db.delete(students).where(inArray(students.enrollmentId, ids));
    await db.delete(responsibles).where(inArray(responsibles.enrollmentId, ids));
    await db.delete(addresses).where(inArray(addresses.enrollmentId, ids));
    await db.delete(enrollments).where(inArray(enrollments.id, ids));
  }
  await db.delete(classes).where(eq(classes.period, PERIOD));
  await db.delete(rooms).where(like(rooms.name, `${PREFIX}%`));
}

before(async () => {
  await clearAttempts(DIR, SEC);
  await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SEC, PASS, { role: 'secretary' });
  dir = await loginAs(DIR, PASS);
  sec = await loginAs(SEC, PASS);
  await cleanup();

  const r = await db.insert(rooms).values({ name: `${PREFIX}Room`, color: '#123456' }).returning();
  roomId = r[0].id;
  const lv = await db.select().from(levels).orderBy(asc(levels.sortOrder)).limit(1);
  levelKey = lv[0].key;
  const c = await db.insert(classes).values({ roomId, dayPair: 'seg-qua', startTime: '8:30', levelId: lv[0].id, period: PERIOD }).returning();

  const e = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: PERIOD,
  }).returning();
  enrollId = e[0].id;
  await db.insert(students).values({ enrollmentId: enrollId, name: 'Aniversariante Teste', birthDate: `2016-${mm}-15`, classId: c[0].id, isActive: true });
  await db.insert(responsibles).values({ enrollmentId: enrollId, type: 'legal', name: 'Responsavel Teste' });
  await db.insert(addresses).values({ enrollmentId: enrollId, cep: '74230110', street: 'Rua X', number: '1', neighborhood: 'Setor Overview', city: 'Goiânia', state: 'GO' });
  await db.insert(contracts).values({ enrollmentId: enrollId, status: 'pending' });
});
after(async () => {
  await cleanup();
  await removeUser(DIR, SEC);
  await clearAttempts(DIR, SEC);
});

describe('GET /api/overview', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await overview(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });

  it('Secretaria → 403 (só Diretor)', async () => {
    const res = mkRes();
    await overview(mkReq('GET', undefined, { cookie: sec.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('Diretor → 200 com a estrutura completa do payload', async () => {
    const res = mkRes();
    await overview(mkReq('GET', undefined, { cookie: dir.cookies }), res);
    assert.equal(res._status, 200);
    const d = res._body.data;
    assert.ok(d.kpis && typeof d.kpis.active === 'number');
    assert.ok(['pending', 'sent', 'viewed', 'signed', 'rejected', 'failed'].every((k) => k in d.funnel));
    assert.ok(Array.isArray(d.occupancyByRoom));
    assert.equal(d.studentsByLevel.length, 19); // todos os níveis
    assert.equal(d.movement.length, 6); // janela padrão 6m
    assert.equal(d.empty, false);
  });

  it('agrega os dados semeados (KPIs/funil/ocupação/nível/aniversário)', async () => {
    const res = mkRes();
    await overview(mkReq('GET', undefined, { cookie: dir.cookies }), res);
    const d = res._body.data;
    assert.ok(d.kpis.active >= 1);
    assert.ok(d.funnel.pending >= 1);

    const room = d.occupancyByRoom.find((x: any) => x.roomId === roomId);
    assert.ok(room && room.occupied >= 1 && room.capacity >= 7);

    const lvl = d.studentsByLevel.find((x: any) => x.levelKey === levelKey);
    assert.ok(lvl && lvl.count >= 1);

    assert.ok(d.birthdays.some((b: any) => b.name === 'Aniversariante Teste'));
    assert.ok(d.recent.some((r: any) => r.enrollmentId === enrollId));

    const cur = d.movement.find((m: any) => m.period === curKey);
    assert.ok(cur && cur.entries >= 1);
  });

  it('period=12m → janela de 12 meses', async () => {
    const res = mkRes();
    await overview(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: '12m' } }), res);
    assert.equal(res._body.data.movement.length, 12);
  });
});
