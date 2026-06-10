// Testes de integração do registro de atividades (DASHBOARD_API §11).
// Rodar: npm run test:api. Cobre o RBAC só-director (Secretaria toma 403).
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import activityHandler from '../../api/activity';
import { db } from '../../server/db/client';
import { activityLog } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-activity-dir@example.com';
const SEC = 'apitest-activity-sec@example.com';
const PASS = 'Senh@12345';

let dirAuth: { cookies: string };
let secAuth: { cookies: string };
let dirId = 0;
let secId = 0;

before(async () => {
  await clearAttempts(DIR, SEC);
  dirId = await seedUser(DIR, PASS, { role: 'director' });
  secId = await seedUser(SEC, PASS, { role: 'secretary' });
  dirAuth = await loginAs(DIR, PASS); // gera uma entrada 'login' no activity_log
  secAuth = await loginAs(SEC, PASS);
});
after(async () => {
  // remove as entradas de auditoria dos usuários de teste antes de apagá-los
  await db.delete(activityLog).where(eq(activityLog.actorId, dirId));
  await db.delete(activityLog).where(eq(activityLog.actorId, secId));
  await removeUser(DIR, SEC);
  await clearAttempts(DIR, SEC);
});

describe('GET /api/activity', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await activityHandler(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });

  it('Secretaria (não-Diretor) → 403 FORBIDDEN', async () => {
    const res = mkRes();
    await activityHandler(mkReq('GET', undefined, { cookie: secAuth.cookies }), res);
    assert.equal(res._status, 403);
    assert.equal(res._body.error.code, 'FORBIDDEN');
  });

  it('Diretor → 200 com envelope paginado', async () => {
    const res = mkRes();
    await activityHandler(mkReq('GET', undefined, { cookie: dirAuth.cookies }), res);
    assert.equal(res._status, 200);
    assert.ok(Array.isArray(res._body.data.items));
    assert.equal(res._body.data.page, 1);
    assert.equal(res._body.data.pageSize, 20);
    assert.ok(res._body.data.total >= 1);
  });

  it('respeita pageSize', async () => {
    const res = mkRes();
    await activityHandler(mkReq('GET', undefined, { cookie: dirAuth.cookies, query: { pageSize: '1' } }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.items.length <= 1);
    assert.equal(res._body.data.pageSize, 1);
  });

  it('filtra por ator (userId) → só as ações do Diretor de teste', async () => {
    const res = mkRes();
    await activityHandler(mkReq('GET', undefined, { cookie: dirAuth.cookies, query: { actor: String(dirId) } }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.total >= 1);
    assert.equal(res._body.data.items[0].action, 'login');
    assert.equal(res._body.data.items[0].actorName, 'Teste');
  });

  it('filtra por q em ação → todos os itens contêm o termo', async () => {
    const res = mkRes();
    await activityHandler(mkReq('GET', undefined, { cookie: dirAuth.cookies, query: { q: 'login' } }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.items.every((i: any) => i.action.includes('login')));
  });
});
