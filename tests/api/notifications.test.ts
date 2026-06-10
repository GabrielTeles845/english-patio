// Testes de integração de notificações (DASHBOARD_API §12).
// Rodar: npm run test:api. Diretor+Secretaria têm sino; Supervisor → 403.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { inArray } from 'drizzle-orm';
import notifList from '../../api/notifications/index';
import notifRead from '../../api/notifications/[id]/read';
import notifReadAll from '../../api/notifications/read-all';
import { db } from '../../server/db/client';
import { notifications } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-notif-dir@example.com';
const SEC = 'apitest-notif-sec@example.com';
const SUP = 'apitest-notif-sup@example.com';
const PASS = 'Senh@12345';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
let dirId = 0;
let secId = 0;
let supId = 0;

async function clearNotifs() {
  await db.delete(notifications).where(inArray(notifications.userId, [dirId, secId, supId]));
}

before(async () => {
  await clearAttempts(DIR, SEC, SUP);
  dirId = await seedUser(DIR, PASS, { role: 'director' });
  secId = await seedUser(SEC, PASS, { role: 'secretary' });
  supId = await seedUser(SUP, PASS, { role: 'supervisor' });
  dir = await loginAs(DIR, PASS);
  sup = await loginAs(SUP, PASS);
});
after(async () => {
  await clearNotifs();
  await removeUser(DIR, SEC, SUP);
  await clearAttempts(DIR, SEC, SUP);
});

describe('GET /api/notifications', () => {
  before(async () => {
    await clearNotifs();
    await db.insert(notifications).values({ userId: dirId, type: 'enroll', title: 'Nova matrícula' });
    await db.insert(notifications).values({ userId: dirId, type: 'signed', title: 'Contrato assinado', readAt: new Date() });
  });

  it('sem sessão → 401', async () => {
    const res = mkRes();
    await notifList(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });

  it('Supervisor → 403 (não tem sino)', async () => {
    const res = mkRes();
    await notifList(mkReq('GET', undefined, { cookie: sup.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('Diretor → 200 com suas notificações', async () => {
    const res = mkRes();
    await notifList(mkReq('GET', undefined, { cookie: dir.cookies }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.length, 2);
  });

  it('?unread=true → só as não-lidas', async () => {
    const res = mkRes();
    await notifList(mkReq('GET', undefined, { cookie: dir.cookies, query: { unread: 'true' } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.length, 1);
    assert.equal(res._body.data[0].readAt, null);
  });
});

describe('POST /api/notifications/read-all', () => {
  before(async () => {
    await clearNotifs();
    await db.insert(notifications).values({ userId: dirId, type: 'enroll', title: 'A' });
    await db.insert(notifications).values({ userId: dirId, type: 'viewed', title: 'B' });
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await notifReadAll(mkReq('POST', undefined, { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('marca todas → updated >= 2 e depois 0 não-lidas', async () => {
    const res = mkRes();
    await notifReadAll(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.updated >= 2);

    const after = mkRes();
    await notifList(mkReq('GET', undefined, { cookie: dir.cookies, query: { unread: 'true' } }), after);
    assert.equal(after._body.data.length, 0);
  });
});

describe('POST /api/notifications/:id/read', () => {
  let ownId = 0;
  let otherId = 0;
  before(async () => {
    await clearNotifs();
    const a = await db.insert(notifications).values({ userId: dirId, type: 'enroll', title: 'minha' }).returning();
    ownId = a[0].id;
    const b = await db.insert(notifications).values({ userId: secId, type: 'enroll', title: 'da secretaria' }).returning();
    otherId = b[0].id;
  });

  it('id inexistente → 404', async () => {
    const res = mkRes();
    await notifRead(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('notificação de outro usuário → 404 (não vaza)', async () => {
    const res = mkRes();
    await notifRead(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(otherId) } }), res);
    assert.equal(res._status, 404);
  });

  it('própria → 200 e readAt preenchido', async () => {
    const res = mkRes();
    await notifRead(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(ownId) } }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.readAt);
  });
});
