// Testes de integração da leitura de contratos (DASHBOARD_API §6).
// Rodar: npm run test:api. Período único "2094.1" para escopar as asserções
// (status/stale filtram globalmente; combinamos sempre com period). Limpa no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';
import listHandler from '../../routes/contracts/index';
import detailHandler from '../../routes/contracts/[id]';
import pdfHandler from '../../routes/contracts/[id]/pdf';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, contracts, contractEvents } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-contract-dir@example.com';
const SUP = 'apitest-contract-sup@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2094.1';
const SUB = 'apitest-contract-enrollment';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
let enrollId = 0;
let cSigned = 0, cStale = 0, cFresh = 0;

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

before(async () => {
  await clearAttempts(DIR, SUP);
  await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SUP, PASS, { role: 'supervisor' });
  dir = await loginAs(DIR, PASS);
  sup = await loginAs(SUP, PASS);
  await cleanup();

  const e = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: PERIOD,
  }).returning();
  enrollId = e[0].id;
  await db.insert(students).values({ enrollmentId: enrollId, name: 'Helena Contrato', birthDate: '2016-05-10' });
  await db.insert(responsibles).values({ enrollmentId: enrollId, type: 'legal', name: 'Mariana Contrato', phone: '62992148870' });

  const now = Date.now();
  const tenDaysAgo = new Date(now - 10 * 86_400_000);
  const sg = await db.insert(contracts).values({ enrollmentId: enrollId, status: 'signed', signedAt: new Date(now) }).returning();
  cSigned = sg[0].id;
  const st = await db.insert(contracts).values({ enrollmentId: enrollId, status: 'sent', sentAt: tenDaysAgo }).returning();
  cStale = st[0].id;
  const fr = await db.insert(contracts).values({ enrollmentId: enrollId, status: 'sent', sentAt: new Date(now) }).returning();
  cFresh = fr[0].id;

  await db.insert(contractEvents).values([
    { contractId: cSigned, eventId: `${SUB}-ev1`, type: 'signature.viewed' },
    { contractId: cSigned, eventId: `${SUB}-ev2`, type: 'document.finished' },
  ]);
});
after(async () => {
  await cleanup();
  await removeUser(DIR, SUP);
  await clearAttempts(DIR, SUP);
});

describe('GET /api/contracts', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { query: { period: PERIOD } }), res);
    assert.equal(res._status, 401);
  });

  it('Supervisor → 403 (sem acesso a contratos)', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: sup.cookies, query: { period: PERIOD } }), res);
    assert.equal(res._status, 403);
  });

  it('lista por período → 3 contratos, com contexto da família', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.total, 3);
    const item = res._body.data.items.find((x: any) => x.id === cSigned);
    assert.deepEqual(item.studentNames, ['Helena Contrato']);
    assert.equal(item.responsibleName, 'Mariana Contrato');
  });

  it('filtro status=signed (+period) → só o assinado', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD, status: 'signed' } }), res);
    assert.equal(res._body.data.items.length, 1);
    assert.equal(res._body.data.items[0].id, cSigned);
  });

  it('filtro stale=true (+period) → só o parado há ≥7 dias', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD, stale: 'true' } }), res);
    assert.equal(res._body.data.items.length, 1);
    assert.equal(res._body.data.items[0].id, cStale);
    assert.equal(res._body.data.items[0].stale, true);
  });

  it('contrato recente não é stale', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD } }), res);
    const fresh = res._body.data.items.find((x: any) => x.id === cFresh);
    assert.equal(fresh.stale, false);
  });
});

describe('GET /api/contracts/:id', () => {
  it('Supervisor → 403', async () => {
    const res = mkRes();
    await detailHandler(mkReq('GET', undefined, { cookie: sup.cookies, query: { id: String(cSigned) } }), res);
    assert.equal(res._status, 403);
  });

  it('id inexistente → 404', async () => {
    const res = mkRes();
    await detailHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('detalhe → contrato + timeline (eventos em ordem) + família', async () => {
    const res = mkRes();
    await detailHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { id: String(cSigned) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.status, 'signed');
    assert.equal(res._body.data.period, PERIOD);
    assert.equal(res._body.data.responsibleName, 'Mariana Contrato');
    assert.equal(res._body.data.timeline.length, 2);
    assert.equal(res._body.data.timeline[0].type, 'signature.viewed');
    assert.equal(res._body.data.timeline[1].type, 'document.finished');
  });
});

describe('GET /api/contracts/:id/pdf', () => {
  it('contrato sem PDF → 404 NO_PDF', async () => {
    const res = mkRes();
    await pdfHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { id: String(cStale) } }), res);
    assert.equal(res._status, 404);
    assert.equal(res._body.error.code, 'NO_PDF');
  });

  it('contrato com PDF → 200 com a URL', async () => {
    await db.update(contracts).set({ pdfUrl: 'https://x/contrato.pdf' }).where(eq(contracts.id, cSigned));
    const res = mkRes();
    await pdfHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { id: String(cSigned) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.url, 'https://x/contrato.pdf');
  });

  it('Supervisor → 403', async () => {
    const res = mkRes();
    await pdfHandler(mkReq('GET', undefined, { cookie: sup.cookies, query: { id: String(cSigned) } }), res);
    assert.equal(res._status, 403);
  });
});
