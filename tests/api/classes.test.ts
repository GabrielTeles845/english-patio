// Testes de integração das rotas de turma (DASHBOARD_API §5).
// Rodar: npm run test:api. Usa salas com prefixo "ZZCls " e período "2099.1"
// (distintos da suíte de salas, que roda em paralelo) e limpa tudo no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { asc, eq, like } from 'drizzle-orm';
import classesHandler from '../../routes/classes/index';
import classById from '../../routes/classes/[id]';
import { db } from '../../server/db/client';
import { classes, rooms, levels, enrollments, students } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const EMAIL = 'apitest-classes@example.com';
const PASS = 'Senh@12345';
const PREFIX = 'ZZCls ';
const PERIOD = '2099.1';

let auth: { cookies: string; csrf: string };
let roomId = 0;
let inactiveRoomId = 0;
let levelA = 0;
let levelB = 0;

async function cleanup() {
  await db.delete(classes).where(eq(classes.period, PERIOD));
  await db.delete(rooms).where(like(rooms.name, `${PREFIX}%`));
}

before(async () => {
  await clearAttempts(EMAIL);
  await seedUser(EMAIL, PASS, { role: 'director' });
  auth = await loginAs(EMAIL, PASS);
  await cleanup();
  const r = await db.insert(rooms).values({ name: `${PREFIX}Active`, color: '#101010' }).returning();
  roomId = r[0].id;
  const ri = await db.insert(rooms).values({ name: `${PREFIX}Inactive`, color: '#202020', isActive: false }).returning();
  inactiveRoomId = ri[0].id;
  const lv = await db.select().from(levels).orderBy(asc(levels.sortOrder)).limit(2);
  levelA = lv[0].id;
  levelB = lv[1].id;
});
after(async () => {
  await cleanup();
  await removeUser(EMAIL);
  await clearAttempts(EMAIL);
});

function newClassBody(over: Record<string, unknown> = {}) {
  return { roomId, dayPair: 'seg-qua', startTime: '8:30', levelId: levelA, period: PERIOD, ...over };
}

describe('GET /api/classes', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await classesHandler(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });

  it('lista filtrando por período → 200', async () => {
    const res = mkRes();
    await classesHandler(mkReq('GET', undefined, { cookie: auth.cookies, query: { period: PERIOD } }), res);
    assert.equal(res._status, 200);
    assert.ok(Array.isArray(res._body.data));
  });
});

describe('POST /api/classes', () => {
  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await classesHandler(mkReq('POST', newClassBody(), { cookie: auth.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('horário inválido → 400', async () => {
    const res = mkRes();
    await classesHandler(mkReq('POST', newClassBody({ startTime: '07:00' }), { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.startTime);
  });

  it('período inválido → 400', async () => {
    const res = mkRes();
    await classesHandler(mkReq('POST', newClassBody({ period: '2099/1' }), { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 400);
  });

  it('capacidade acima de 7 → 400', async () => {
    const res = mkRes();
    await classesHandler(mkReq('POST', newClassBody({ capacity: 8 }), { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 400);
  });

  it('sala inativa → 400', async () => {
    const res = mkRes();
    await classesHandler(mkReq('POST', newClassBody({ roomId: inactiveRoomId }), { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.roomId);
  });

  it('nível inexistente → 400', async () => {
    const res = mkRes();
    await classesHandler(mkReq('POST', newClassBody({ levelId: 99999999 }), { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.levelId);
  });

  it('criação válida → 201 (capacidade padrão 7, ocupação 0)', async () => {
    const res = mkRes();
    await classesHandler(mkReq('POST', newClassBody(), { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 201);
    assert.equal(res._body.data.capacity, 7);
    assert.equal(res._body.data.occupancy, 0);
  });

  it('mesmo slot → 409 SLOT_TAKEN', async () => {
    const res = mkRes();
    await classesHandler(mkReq('POST', newClassBody(), { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 409);
    assert.equal(res._body.error.code, 'SLOT_TAKEN');
  });
});

describe('PATCH/DELETE /api/classes/:id', () => {
  let idA = 0;
  let idB = 0;
  before(async () => {
    const a = await db.insert(classes).values({ roomId, dayPair: 'ter-qui', startTime: '9:30', levelId: levelA, period: PERIOD }).returning();
    idA = a[0].id;
    const b = await db.insert(classes).values({ roomId, dayPair: 'ter-qui', startTime: '10:30', levelId: levelA, period: PERIOD }).returning();
    idB = b[0].id;
  });

  it('PATCH id inexistente → 404', async () => {
    const res = mkRes();
    await classById(mkReq('PATCH', { capacity: 5 }, { cookie: auth.cookies, csrf: auth.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('PATCH sem CSRF → 403', async () => {
    const res = mkRes();
    await classById(mkReq('PATCH', { capacity: 5 }, { cookie: auth.cookies, query: { id: String(idA) } }), res);
    assert.equal(res._status, 403);
  });

  it('PATCH capacidade + nível → 200', async () => {
    const res = mkRes();
    await classById(mkReq('PATCH', { capacity: 5, levelId: levelB }, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(idA) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.capacity, 5);
    assert.equal(res._body.data.levelId, levelB);
  });

  it('PATCH movendo para slot ocupado → 409 SLOT_TAKEN', async () => {
    // move B para o horário da A (mesma sala/par/período)
    const res = mkRes();
    await classById(mkReq('PATCH', { startTime: '9:30' }, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(idB) } }), res);
    assert.equal(res._status, 409);
    assert.equal(res._body.error.code, 'SLOT_TAKEN');
  });

  it('DELETE id inexistente → 404', async () => {
    const res = mkRes();
    await classById(mkReq('DELETE', undefined, { cookie: auth.cookies, csrf: auth.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('DELETE turma vazia → 200', async () => {
    const res = mkRes();
    await classById(mkReq('DELETE', undefined, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(idB) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.id, idB);
  });

});

// Ocupação real (agora que students existe): turma com 2 alunos ativos.
describe('ocupação da turma', () => {
  let classId = 0;
  let enrollmentId = 0;
  const studentIds: number[] = [];
  before(async () => {
    const c = await db.insert(classes).values({ roomId, dayPair: 'seg-qua', startTime: '14:30', levelId: levelA, period: PERIOD }).returning();
    classId = c[0].id;
    const e = await db.insert(enrollments).values({
      source: 'manual', submissionId: `test-occ-${PERIOD}`, classFormat: 'sede',
      financialResponsibleType: 'legal', authorizationContract: true, scheduleConfirmed: true, period: PERIOD,
    }).returning();
    enrollmentId = e[0].id;
    for (const name of ['Aluno Um', 'Aluno Dois']) {
      const s = await db.insert(students).values({ enrollmentId, name, birthDate: '2015-01-01', classId, isActive: true }).returning();
      studentIds.push(s[0].id);
    }
  });
  after(async () => {
    for (const id of studentIds) await db.delete(students).where(eq(students.id, id));
    await db.delete(enrollments).where(eq(enrollments.id, enrollmentId));
  });

  it('DELETE turma com alunos → 422 CLASS_NOT_EMPTY', async () => {
    const res = mkRes();
    await classById(mkReq('DELETE', undefined, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(classId) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'CLASS_NOT_EMPTY');
  });

  it('PATCH capacidade (1) < ocupação (2) → 422 CAPACITY_BELOW_OCCUPANCY', async () => {
    const res = mkRes();
    await classById(mkReq('PATCH', { capacity: 1 }, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(classId) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'CAPACITY_BELOW_OCCUPANCY');
  });
});
