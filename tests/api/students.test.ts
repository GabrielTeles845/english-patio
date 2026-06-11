// Testes de integração do ciclo de vida do aluno (DASHBOARD_API §4.4–4.6).
// Rodar: npm run test:api. Usa período "2096.1" e salas com prefixo "ZZStu "
// (distintos das outras suítes que rodam em paralelo). Limpa tudo no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { asc, eq, inArray, like } from 'drizzle-orm';
import deactivate from '../../api/students/[id]/deactivate';
import reactivate from '../../api/students/[id]/reactivate';
import moveClass from '../../api/students/[id]/class';
import { db } from '../../server/db/client';
import { enrollments, students, classes, rooms, levels, activityLog } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-stu-dir@example.com';
const SEC = 'apitest-stu-sec@example.com';
const SUP = 'apitest-stu-sup@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2096.1';
const PREFIX = 'ZZStu ';
const SUB = 'apitest-stu-enrollment';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
let dirId = 0, secId = 0, supId = 0;
let enrollId = 0;
let cMain = 0, cLevelB = 0, cCap1 = 0, cCap9 = 0;

async function cleanup() {
  const er = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.submissionId, SUB));
  const ids = er.map((r) => r.id);
  if (ids.length) await db.delete(students).where(inArray(students.enrollmentId, ids));
  await db.delete(classes).where(eq(classes.period, PERIOD));
  await db.delete(rooms).where(like(rooms.name, `${PREFIX}%`));
  if (ids.length) await db.delete(enrollments).where(inArray(enrollments.id, ids));
}

// Insere um aluno na matrícula de teste; devolve o id.
async function addStudent(classId: number | null, isActive = true): Promise<number> {
  const r = await db
    .insert(students)
    .values({ enrollmentId: enrollId, name: 'Aluno Teste', birthDate: '2016-05-10', classId, isActive })
    .returning();
  return r[0].id;
}

before(async () => {
  await clearAttempts(DIR, SEC, SUP);
  dirId = await seedUser(DIR, PASS, { role: 'director' });
  secId = await seedUser(SEC, PASS, { role: 'secretary' });
  supId = await seedUser(SUP, PASS, { role: 'supervisor' });
  dir = await loginAs(DIR, PASS);
  sec = await loginAs(SEC, PASS);
  sup = await loginAs(SUP, PASS);
  await cleanup();

  const room = await db.insert(rooms).values({ name: `${PREFIX}Room`, color: '#101010' }).returning();
  const roomId = room[0].id;
  const lv = await db.select().from(levels).orderBy(asc(levels.sortOrder)).limit(2);
  const lvA = lv[0].id, lvB = lv[1].id;
  const mk = async (dayPair: 'seg-qua' | 'ter-qui', startTime: string, levelId: number, capacity: number) => {
    const c = await db.insert(classes).values({ roomId, dayPair, startTime, levelId, capacity, period: PERIOD }).returning();
    return c[0].id;
  };
  cMain = await mk('seg-qua', '8:30', lvA, 7);
  cLevelB = await mk('seg-qua', '9:30', lvB, 7);
  cCap1 = await mk('seg-qua', '10:30', lvA, 1);
  cCap9 = await mk('seg-qua', '13:30', lvA, 9);

  const e = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: PERIOD,
  }).returning();
  enrollId = e[0].id;
});
after(async () => {
  await cleanup();
  await db.delete(activityLog).where(inArray(activityLog.actorId, [dirId, secId, supId]));
  await removeUser(DIR, SEC, SUP);
  await clearAttempts(DIR, SEC, SUP);
});

describe('POST /api/students/:id/deactivate', () => {
  it('sem sessão → 401', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await deactivate(mkReq('POST', { reason: 'moved' }, { query: { id: String(sid) } }), res);
    assert.equal(res._status, 401);
  });

  it('Supervisor → 403 (só director/secretary)', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await deactivate(mkReq('POST', { reason: 'moved' }, { cookie: sup.cookies, csrf: sup.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 403);
  });

  it('sem CSRF → 403', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await deactivate(mkReq('POST', { reason: 'moved' }, { cookie: dir.cookies, query: { id: String(sid) } }), res);
    assert.equal(res._status, 403);
  });

  it('motivo "other" sem observação → 400', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await deactivate(mkReq('POST', { reason: 'other' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.note);
  });

  it('motivo inválido → 400', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await deactivate(mkReq('POST', { reason: 'inventado' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 400);
  });

  it('desligamento válido → 200, is_active false e exit_* preenchidos', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await deactivate(mkReq('POST', { reason: 'financial' }, { cookie: sec.cookies, csrf: sec.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.isActive, false);
    assert.equal(res._body.data.exitReason, 'financial');
    assert.ok(res._body.data.exitDate);
  });

  it('aluno já desligado → 422 ALREADY_INACTIVE', async () => {
    const sid = await addStudent(cMain, false);
    const res = mkRes();
    await deactivate(mkReq('POST', { reason: 'moved' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'ALREADY_INACTIVE');
  });
});

describe('POST /api/students/:id/reactivate', () => {
  it('aluno já ativo → 422 ALREADY_ACTIVE', async () => {
    const sid = await addStudent(cMain, true);
    const res = mkRes();
    await reactivate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'ALREADY_ACTIVE');
  });

  it('reativa com vaga na turma → 200, ativo e mantém a turma', async () => {
    const sid = await addStudent(cMain, false); // turma cMain tem vaga
    const res = mkRes();
    await reactivate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.isActive, true);
    assert.equal(res._body.data.classId, cMain);
    assert.equal(res._body.data.droppedToQueue, false);
    assert.equal(res._body.data.exitReason, null);
  });

  it('turma lotou no meantime → volta pra fila (classId null, droppedToQueue)', async () => {
    const sid = await addStudent(cCap1, false); // desligado, turma cap 1
    await addStudent(cCap1, true); // outro aluno ativo ocupa a única vaga
    const res = mkRes();
    await reactivate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.isActive, true);
    assert.equal(res._body.data.classId, null);
    assert.equal(res._body.data.droppedToQueue, true);
  });
});

describe('PATCH /api/students/:id/class', () => {
  it('sem CSRF → 403', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: cLevelB }, { cookie: dir.cookies, query: { id: String(sid) } }), res);
    assert.equal(res._status, 403);
  });

  it('Supervisor PODE mover (Agenda é CRUD pros 3) → 200', async () => {
    const sid = await addStudent(null);
    const res = mkRes();
    // cLevelB está vazia neste ponto (de null → sem checagem de nível).
    await moveClass(mkReq('PATCH', { classId: cLevelB }, { cookie: sup.cookies, csrf: sup.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.classId, cLevelB);
  });

  it('turma de destino inexistente → 404 CLASS_NOT_FOUND', async () => {
    const sid = await addStudent(null);
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: 99999999 }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 404);
    assert.equal(res._body.error.code, 'CLASS_NOT_FOUND');
  });

  it('aluno desligado → 422 STUDENT_INACTIVE', async () => {
    const sid = await addStudent(null, false);
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: cMain }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'STUDENT_INACTIVE');
  });

  it('mudança de nível sem confirmar → 422 LEVEL_CHANGE_REQUIRES_CONFIRM', async () => {
    const sid = await addStudent(cMain); // cMain = nível A
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: cLevelB }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'LEVEL_CHANGE_REQUIRES_CONFIRM');
  });

  it('mudança de nível com allowLevelChange → 200', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: cLevelB, allowLevelChange: true }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.classId, cLevelB);
  });

  it('turma cheia sem vaga extra → 422 CLASS_FULL', async () => {
    await addStudent(cCap1, true); // ocupa a única vaga (cap 1)
    const sid = await addStudent(null);
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: cCap1 }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'CLASS_FULL');
  });

  it('turma cheia COM vaga extra (cap<9) → 200', async () => {
    const sid = await addStudent(null);
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: cCap1, extraSeat: true }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.classId, cCap1);
  });

  it('vaga extra mas já em 9 lugares → 422 ROOM_OVERFLOW', async () => {
    for (let i = 0; i < 9; i++) await addStudent(cCap9, true); // lota em 9
    const sid = await addStudent(null);
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: cCap9, extraSeat: true }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'ROOM_OVERFLOW');
  });

  it('classId null → tira da turma (fila), 200', async () => {
    const sid = await addStudent(cMain);
    const res = mkRes();
    await moveClass(mkReq('PATCH', { classId: null }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(sid) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.classId, null);
  });
});
