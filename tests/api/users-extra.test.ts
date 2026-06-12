// Testes das rotas novas de usuário: reactivate + DELETE (DASHBOARD_API §10).
// Rodar: npm run test:api.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import reactivate from '../../routes/users/[id]/reactivate';
import deactivate from '../../routes/users/[id]/deactivate';
import byId from '../../routes/users/[id]/index';
import { db } from '../../server/db/client';
import { users } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-ux-dir@example.com';
const SEC_ACTOR = 'apitest-ux-secactor@example.com';
const TARGET = 'apitest-ux-target@example.com';
const PASS = 'Senh@12345';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;

before(async () => {
  await clearAttempts(DIR, SEC_ACTOR, TARGET);
  await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SEC_ACTOR, PASS, { role: 'secretary' });
  dir = await loginAs(DIR, PASS);
  sec = await loginAs(SEC_ACTOR, PASS);
});
after(async () => {
  await removeUser(DIR, SEC_ACTOR, TARGET);
  await clearAttempts(DIR, SEC_ACTOR, TARGET);
});

describe('POST /api/users/:id/reactivate', () => {
  it('Secretaria → 403', async () => {
    const tid = await seedUser(TARGET, PASS, { role: 'secretary' });
    const res = mkRes();
    await reactivate(mkReq('POST', undefined, { cookie: sec.cookies, csrf: sec.csrf, query: { id: String(tid) } }), res);
    assert.equal(res._status, 403);
  });

  it('desativar e reativar → isActive volta a true', async () => {
    const tid = await seedUser(TARGET, PASS, { role: 'secretary' });
    const d = mkRes();
    await deactivate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(tid) } }), d);
    assert.equal(d._status, 200);
    assert.equal(d._body.data.isActive, false);

    const r = mkRes();
    await reactivate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(tid) } }), r);
    assert.equal(r._status, 200);
    assert.equal(r._body.data.isActive, true);
  });
});

describe('DELETE /api/users/:id', () => {
  it('sem CSRF → 403', async () => {
    const tid = await seedUser(TARGET, PASS, { role: 'secretary' });
    const res = mkRes();
    await byId(mkReq('DELETE', undefined, { cookie: dir.cookies, query: { id: String(tid) } }), res);
    assert.equal(res._status, 403);
  });

  it('remove uma secretária → 200 e some do banco', async () => {
    const tid = await seedUser(TARGET, PASS, { role: 'secretary' });
    const res = mkRes();
    await byId(mkReq('DELETE', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(tid) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.id, tid);
    const gone = await db.select().from(users).where(eq(users.id, tid));
    assert.equal(gone.length, 0);
  });
});
