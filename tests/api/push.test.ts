// Testes do POST /api/notifications/subscribe (inscrição de Web Push).
// Cobre RBAC (só director/secretary), CSRF, validação e upsert por endpoint.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import subscribe from '../../routes/notifications/subscribe';
import { db } from '../../server/db/client';
import { pushSubscriptions } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, loginAs } from './_helpers';

const DIR = 'apitest-push-dir@example.com';
const SEC = 'apitest-push-sec@example.com';
const SUP = 'apitest-push-sup@example.com';
const PASS = 'Senh@12345';
const EP = 'https://fcm.googleapis.com/fcm/send/apitest-endpoint-123';
const SUB = (over: Record<string, unknown> = {}) => ({ endpoint: EP, keys: { p256dh: 'p256dh-aaa', auth: 'auth-bbb' }, ...over });

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
let dirId: number;
let secId: number;

async function rows() {
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, EP));
}

describe('POST /api/notifications/subscribe', () => {
  before(async () => {
    dirId = await seedUser(DIR, PASS, { role: 'director' });
    secId = await seedUser(SEC, PASS, { role: 'secretary' });
    await seedUser(SUP, PASS, { role: 'supervisor' });
    dir = await loginAs(DIR, PASS);
    sec = await loginAs(SEC, PASS);
    sup = await loginAs(SUP, PASS);
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, EP));
  });
  after(async () => {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, EP));
    await removeUser(DIR, SEC, SUP);
  });

  it('rejeita método != POST com 405', async () => {
    const res = mkRes();
    await subscribe(mkReq('GET', undefined, { cookie: dir.cookies }), res);
    assert.equal(res._status, 405);
  });

  it('sem sessão → 401', async () => {
    const res = mkRes();
    await subscribe(mkReq('POST', SUB()), res);
    assert.equal(res._status, 401);
  });

  it('supervisor (sem sino) → 403', async () => {
    const res = mkRes();
    await subscribe(mkReq('POST', SUB(), { cookie: sup.cookies, csrf: sup.csrf }), res);
    assert.equal(res._status, 403);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await subscribe(mkReq('POST', SUB(), { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
    assert.equal(res._body.error.code, 'CSRF');
  });

  it('body inválido (endpoint não-URL) → 400', async () => {
    const res = mkRes();
    await subscribe(mkReq('POST', SUB({ endpoint: 'nao-eh-url' }), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'VALIDATION');
  });

  it('body inválido (keys faltando) → 400', async () => {
    const res = mkRes();
    await subscribe(mkReq('POST', { endpoint: EP }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
  });

  it('director válido → 200 e grava a inscrição', async () => {
    const res = mkRes();
    await subscribe(mkReq('POST', SUB(), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.subscribed, true);
    const r = await rows();
    assert.equal(r.length, 1);
    assert.equal(r[0].userId, dirId);
    assert.equal(r[0].p256dh, 'p256dh-aaa');
  });

  it('re-inscrição do mesmo endpoint faz upsert (1 linha, chaves atualizadas)', async () => {
    const res = mkRes();
    await subscribe(mkReq('POST', SUB({ keys: { p256dh: 'p256dh-novo', auth: 'auth-novo' } }), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 200);
    const r = await rows();
    assert.equal(r.length, 1);
    assert.equal(r[0].p256dh, 'p256dh-novo');
  });

  it('outro usuário no mesmo navegador reaponta o userId', async () => {
    const res = mkRes();
    await subscribe(mkReq('POST', SUB(), { cookie: sec.cookies, csrf: sec.csrf }), res);
    assert.equal(res._status, 200);
    const r = await rows();
    assert.equal(r.length, 1);
    assert.equal(r[0].userId, secId);
  });
});
