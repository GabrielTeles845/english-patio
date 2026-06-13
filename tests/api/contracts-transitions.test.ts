// Trilho de transições do override manual (POST /contracts/:id/status) e a
// mensagem por status do remind (POST /contracts/:id/remind). DASHBOARD_API §6.
// Rodar: npm run test:api. Período/sub únicos; limpa tudo no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';
import statusHandler from '../../routes/contracts/[id]/status';
import remindHandler from '../../routes/contracts/[id]/remind';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, contracts, contractEvents, activityLog } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-ctr-dir@example.com';
const SEC = 'apitest-ctr-sec@example.com';
const PASS = 'Senh@12345';
const SUB = 'apitest-ctr-enrollment';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;
let dirId = 0, secId = 0, enrollId = 0;

async function cleanup() {
  const er = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.submissionId, SUB));
  const ids = er.map((r) => r.id);
  if (ids.length) {
    const cs = await db.select({ id: contracts.id }).from(contracts).where(inArray(contracts.enrollmentId, ids));
    const cids = cs.map((c) => c.id);
    if (cids.length) await db.delete(contractEvents).where(inArray(contractEvents.contractId, cids));
    await db.delete(contracts).where(inArray(contracts.enrollmentId, ids));
    await db.delete(students).where(inArray(students.enrollmentId, ids));
    await db.delete(responsibles).where(inArray(responsibles.enrollmentId, ids));
    await db.delete(enrollments).where(inArray(enrollments.id, ids));
  }
}

// cria um contrato no status pedido e devolve o id
async function mkContract(status: string): Promise<number> {
  const r = await db
    .insert(contracts)
    .values({ enrollmentId: enrollId, status: status as (typeof contracts.$inferInsert)['status'] })
    .returning();
  return r[0].id;
}

before(async () => {
  await clearAttempts(DIR, SEC);
  dirId = await seedUser(DIR, PASS, { role: 'director' });
  secId = await seedUser(SEC, PASS, { role: 'secretary' });
  dir = await loginAs(DIR, PASS);
  sec = await loginAs(SEC, PASS);
  await cleanup();

  const e = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: '2093.1',
  }).returning();
  enrollId = e[0].id;
  await db.insert(students).values({ enrollmentId: enrollId, name: 'Helena Trans', birthDate: '2016-05-10' });
  await db.insert(responsibles).values({ enrollmentId: enrollId, type: 'legal', name: 'Mariana Trans', phone: '62992148870' });
});
after(async () => {
  await cleanup();
  await db.delete(activityLog).where(inArray(activityLog.actorId, [dirId, secId]));
  await removeUser(DIR, SEC);
  await clearAttempts(DIR, SEC);
});

const setStatusRes = async (id: number, status: string, who: Awaited<ReturnType<typeof loginAs>>) => {
  const res = mkRes();
  await statusHandler(mkReq('POST', { status }, { cookie: who.cookies, csrf: who.csrf, query: { id: String(id) } }), res);
  return res;
};

describe('POST /api/contracts/:id/status — trilho de transições', () => {
  it('Secretaria → 403 (override manual é só do Diretor)', async () => {
    const id = await mkContract('pending');
    const res = await setStatusRes(id, 'sent', sec);
    assert.equal(res._status, 403);
  });

  it('signed → pending é bloqueado (422 INVALID_TRANSITION) e não muda o status', async () => {
    const id = await mkContract('signed');
    const res = await setStatusRes(id, 'pending', dir);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'INVALID_TRANSITION');
    const c = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
    assert.equal(c[0].status, 'signed');
  });

  it('signed → sent também é bloqueado', async () => {
    const id = await mkContract('signed');
    const res = await setStatusRes(id, 'sent', dir);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'INVALID_TRANSITION');
  });

  it('pending → sent é permitido (200)', async () => {
    const id = await mkContract('pending');
    const res = await setStatusRes(id, 'sent', dir);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.status, 'sent');
  });

  it('pending → signed é permitido (marcar como assinado)', async () => {
    const id = await mkContract('pending');
    const res = await setStatusRes(id, 'signed', dir);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.status, 'signed');
  });

  it('rejected → sent é permitido (reenviar)', async () => {
    const id = await mkContract('rejected');
    const res = await setStatusRes(id, 'sent', dir);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.status, 'sent');
  });

  it('rejected → signed é bloqueado (refazer não é assinar)', async () => {
    const id = await mkContract('rejected');
    const res = await setStatusRes(id, 'signed', dir);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'INVALID_TRANSITION');
  });
});

describe('POST /api/contracts/:id/remind — mensagem por status', () => {
  it('sent: mensagem cobra a assinatura', async () => {
    const id = await mkContract('sent');
    const res = mkRes();
    await remindHandler(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.match(res._body.data.message, /pendente de assinatura/i);
  });

  it('rejected: NÃO cobra assinatura (texto neutro de retomada)', async () => {
    const id = await mkContract('rejected');
    const res = mkRes();
    await remindHandler(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.doesNotMatch(res._body.data.message, /pendente de assinatura/i);
    assert.match(res._body.data.message, /problema com o contrato/i);
  });

  it('failed: mensagem fala de falha no envio', async () => {
    const id = await mkContract('failed');
    const res = mkRes();
    await remindHandler(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.match(res._body.data.message, /falha no envio/i);
  });
});
