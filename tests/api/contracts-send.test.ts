// Testes de integração de enviar contrato + webhook do Autentique
// (DASHBOARD_API §6/§9). Rodar: npm run test:api. Cada arquivo roda em processo
// próprio, então setamos AUTENTIQUE_WEBHOOK_SECRET aqui sem afetar outras suítes.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import send from '../../routes/contracts/[id]/send';
import webhook from '../../routes/webhooks/autentique';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, contracts, contractEvents, notifications } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

process.env.AUTENTIQUE_WEBHOOK_SECRET = 'test-webhook-secret';
const SECRET = process.env.AUTENTIQUE_WEBHOOK_SECRET;

const DIR = 'apitest-cs-dir@example.com';
const SEC = 'apitest-cs-sec@example.com';
const SUP = 'apitest-cs-sup@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2091.1';
const SUB = 'apitest-cs-enrollment';
const DOC_ID = 'apitest-cs-doc';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
let dirId = 0, secId = 0, supId = 0;
let enrollId = 0, cPending = 0, cSigned = 0, cWebhook = 0;

function sign(payload: unknown): string {
  return createHmac('sha256', SECRET!).update(JSON.stringify(payload)).digest('hex');
}
function whReq(payload: unknown, signature: string | undefined): any {
  return { method: 'POST', body: payload, query: {}, headers: signature ? { 'x-autentique-signature': signature } : {} };
}

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
  await clearAttempts(DIR, SEC, SUP);
  dirId = await seedUser(DIR, PASS, { role: 'director' });
  secId = await seedUser(SEC, PASS, { role: 'secretary' });
  supId = await seedUser(SUP, PASS, { role: 'supervisor' });
  dir = await loginAs(DIR, PASS);
  sup = await loginAs(SUP, PASS);
  await cleanup();

  const e = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: PERIOD,
  }).returning();
  enrollId = e[0].id;
  await db.insert(students).values({ enrollmentId: enrollId, name: 'Helena Envio', birthDate: '2016-05-10' });
  await db.insert(responsibles).values({ enrollmentId: enrollId, type: 'legal', name: 'Mariana Envio', email: 'mae@example.com', phone: '62992148870' });
  cPending = (await db.insert(contracts).values({ enrollmentId: enrollId, status: 'pending' }).returning())[0].id;
  cSigned = (await db.insert(contracts).values({ enrollmentId: enrollId, status: 'signed' }).returning())[0].id;
  cWebhook = (await db.insert(contracts).values({ enrollmentId: enrollId, status: 'sent', autentiqueDocId: DOC_ID, sentAt: new Date() }).returning())[0].id;
});
after(async () => {
  await cleanup();
  await db.delete(notifications).where(inArray(notifications.userId, [dirId, secId, supId]));
  await removeUser(DIR, SEC, SUP);
  await clearAttempts(DIR, SEC, SUP);
});

describe('POST /api/contracts/:id/send', () => {
  it('Supervisor → 403', async () => {
    const res = mkRes();
    await send(mkReq('POST', {}, { cookie: sup.cookies, csrf: sup.csrf, query: { id: String(cPending) } }), res);
    assert.equal(res._status, 403);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await send(mkReq('POST', {}, { cookie: dir.cookies, query: { id: String(cPending) } }), res);
    assert.equal(res._status, 403);
  });

  it('contrato inexistente → 404', async () => {
    const res = mkRes();
    await send(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('já assinado → 422 ALREADY_SIGNED', async () => {
    const res = mkRes();
    await send(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(cSigned) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'ALREADY_SIGNED');
  });

  it('envio válido → 200, status sent e doc_id gravado', async () => {
    const res = mkRes();
    await send(mkReq('POST', { channels: ['email'] }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(cPending) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.status, 'sent');
    assert.ok(res._body.data.sentVia === 'email');
    const c = await db.select().from(contracts).where(eq(contracts.id, cPending)).limit(1);
    assert.ok(c[0].autentiqueDocId);
  });
});

describe('POST /api/webhooks/autentique', () => {
  it('assinatura inválida → 401', async () => {
    const res = mkRes();
    const payload = { eventId: 'x', type: 'signature.viewed', documentId: DOC_ID };
    await webhook(whReq(payload, 'errado'), res);
    assert.equal(res._status, 401);
  });

  it('payload incompleto → 400', async () => {
    const res = mkRes();
    const payload = { type: 'signature.viewed' };
    await webhook(whReq(payload, sign(payload)), res);
    assert.equal(res._status, 400);
  });

  it('documento desconhecido → 200 ignorado', async () => {
    const res = mkRes();
    const payload = { eventId: 'cs-unknown', type: 'signature.viewed', documentId: 'nao-existe' };
    await webhook(whReq(payload, sign(payload)), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.ignored, true);
  });

  it('signature.viewed → contrato vira viewed + evento na timeline', async () => {
    const res = mkRes();
    const payload = { eventId: 'cs-ev-viewed', type: 'signature.viewed', documentId: DOC_ID };
    await webhook(whReq(payload, sign(payload)), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.status, 'viewed');
    const c = await db.select().from(contracts).where(eq(contracts.id, cWebhook)).limit(1);
    assert.equal(c[0].status, 'viewed');
    assert.ok(c[0].viewedAt);
    const ev = await db.select().from(contractEvents).where(eq(contractEvents.eventId, 'cs-ev-viewed'));
    assert.equal(ev.length, 1);
  });

  it('mesmo event_id de novo → 200 duplicate (idempotente)', async () => {
    const res = mkRes();
    const payload = { eventId: 'cs-ev-viewed', type: 'signature.viewed', documentId: DOC_ID };
    await webhook(whReq(payload, sign(payload)), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.duplicate, true);
  });

  it('document.finished → contrato vira signed', async () => {
    const res = mkRes();
    const payload = { eventId: 'cs-ev-finished', type: 'document.finished', documentId: DOC_ID };
    await webhook(whReq(payload, sign(payload)), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.status, 'signed');
    const c = await db.select().from(contracts).where(eq(contracts.id, cWebhook)).limit(1);
    assert.equal(c[0].status, 'signed');
    assert.ok(c[0].signedAt);
  });
});
