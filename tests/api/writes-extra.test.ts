// Testes das rotas novas de escrita: DELETE matrícula + override de status de
// contrato (DASHBOARD_API §4/§6). Rodar: npm run test:api.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';
import delById from '../../routes/enrollments/[id]';
import statusOverride from '../../routes/contracts/[id]/status';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, addresses, contracts } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-wx-dir@example.com';
const SEC = 'apitest-wx-sec@example.com';
const SUP = 'apitest-wx-sup@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2088.1';
const SUB = 'apitest-wx-enrollment';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;

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
}
async function seedFamily(): Promise<{ enrollId: number; contractId: number }> {
  const e = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: PERIOD,
  }).returning();
  const enrollId = e[0].id;
  await db.insert(students).values({ enrollmentId: enrollId, name: 'Aluno WX', birthDate: '2016-05-10' });
  await db.insert(responsibles).values({ enrollmentId: enrollId, type: 'legal', name: 'Resp WX' });
  await db.insert(addresses).values({ enrollmentId: enrollId, cep: '74000000', street: 'R', number: '1', neighborhood: 'B', city: 'Goiânia', state: 'GO' });
  const c = await db.insert(contracts).values({ enrollmentId: enrollId, status: 'pending' }).returning();
  return { enrollId, contractId: c[0].id };
}

before(async () => {
  await clearAttempts(DIR, SEC, SUP);
  await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SEC, PASS, { role: 'secretary' });
  await seedUser(SUP, PASS, { role: 'supervisor' });
  dir = await loginAs(DIR, PASS);
  sec = await loginAs(SEC, PASS);
  sup = await loginAs(SUP, PASS);
  await cleanup();
});
after(async () => {
  await cleanup();
  await removeUser(DIR, SEC, SUP);
  await clearAttempts(DIR, SEC, SUP);
});

describe('DELETE /api/enrollments/:id', () => {
  it('Supervisor → 403', async () => {
    const { enrollId } = await seedFamily();
    const res = mkRes();
    await delById(mkReq('DELETE', undefined, { cookie: sup.cookies, csrf: sup.csrf, query: { id: String(enrollId) } }), res);
    assert.equal(res._status, 403);
    await cleanup();
  });

  it('Diretor → 200 e some com a família (filhos inclusive)', async () => {
    const { enrollId } = await seedFamily();
    const res = mkRes();
    await delById(mkReq('DELETE', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(enrollId) } }), res);
    assert.equal(res._status, 200);
    assert.equal((await db.select().from(enrollments).where(eq(enrollments.id, enrollId))).length, 0);
    assert.equal((await db.select().from(students).where(eq(students.enrollmentId, enrollId))).length, 0);
    assert.equal((await db.select().from(contracts).where(eq(contracts.enrollmentId, enrollId))).length, 0);
  });
});

describe('POST /api/contracts/:id/status (override)', () => {
  it('Secretaria → 403 (só Diretor)', async () => {
    const { contractId } = await seedFamily();
    const res = mkRes();
    await statusOverride(mkReq('POST', { status: 'signed' }, { cookie: sec.cookies, csrf: sec.csrf, query: { id: String(contractId) } }), res);
    assert.equal(res._status, 403);
    await cleanup();
  });

  it('Diretor → 200, status muda e carimba o timestamp', async () => {
    const { contractId } = await seedFamily();
    const res = mkRes();
    await statusOverride(mkReq('POST', { status: 'signed' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(contractId) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.status, 'signed');
    const c = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
    assert.equal(c[0].status, 'signed');
    assert.ok(c[0].signedAt);
    await cleanup();
  });
});
