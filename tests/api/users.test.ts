// Testes de integração do CRUD de usuários (DASHBOARD_API §10) + unidade da
// guarda do último Diretor. Rodar: npm run test:api. Tudo só-Diretor.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { inArray } from 'drizzle-orm';
import usersHandler from '../../routes/users/index';
import userPatch from '../../routes/users/[id]/index';
import userDeactivate from '../../routes/users/[id]/deactivate';
import { db } from '../../server/db/client';
import { activityLog } from '../../server/db/schema';
import { blocksLastDirector } from '../../server/lib/users';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-ucrud-dir@example.com';
const SEC = 'apitest-ucrud-sec@example.com';
const NEW = 'apitest-ucrud-new@example.com';
const PTGT = 'apitest-ucrud-patch@example.com';
const DTGT = 'apitest-ucrud-deact@example.com';
const PASS = 'Senh@12345';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;
let dirId = 0;
let secId = 0;

before(async () => {
  await clearAttempts(DIR, SEC);
  await removeUser(NEW, PTGT, DTGT);
  dirId = await seedUser(DIR, PASS, { role: 'director' });
  secId = await seedUser(SEC, PASS, { role: 'secretary' });
  dir = await loginAs(DIR, PASS);
  sec = await loginAs(SEC, PASS);
});
after(async () => {
  await db.delete(activityLog).where(inArray(activityLog.actorId, [dirId, secId]));
  await removeUser(DIR, SEC, NEW, PTGT, DTGT);
  await clearAttempts(DIR, SEC);
});

describe('GET /api/users', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await usersHandler(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });

  it('Secretaria → 403 FORBIDDEN', async () => {
    const res = mkRes();
    await usersHandler(mkReq('GET', undefined, { cookie: sec.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('Diretor → 200, inclui os de teste e nunca expõe password_hash', async () => {
    const res = mkRes();
    await usersHandler(mkReq('GET', undefined, { cookie: dir.cookies }), res);
    assert.equal(res._status, 200);
    const emails = res._body.data.map((u: any) => u.email);
    assert.ok(emails.includes(DIR) && emails.includes(SEC));
    assert.ok(res._body.data.every((u: any) => !('passwordHash' in u)));
  });
});

describe('POST /api/users', () => {
  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await usersHandler(mkReq('POST', { name: 'Fulano de Tal', email: NEW, role: 'secretary', tempPassword: PASS }, { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('senha fraca → 400 WEAK_PASSWORD', async () => {
    const res = mkRes();
    await usersHandler(mkReq('POST', { name: 'Fulano de Tal', email: NEW, role: 'secretary', tempPassword: 'abc' }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'WEAK_PASSWORD');
  });

  it('nome incompleto → 400', async () => {
    const res = mkRes();
    await usersHandler(mkReq('POST', { name: 'Fulano', email: NEW, role: 'secretary', tempPassword: PASS }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.name);
  });

  it('criação válida → 201 (mustChangePassword true, sem hash)', async () => {
    const res = mkRes();
    await usersHandler(mkReq('POST', { name: 'Fulano de Tal', email: NEW, role: 'supervisor', tempPassword: PASS }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 201);
    assert.equal(res._body.data.role, 'supervisor');
    assert.equal(res._body.data.mustChangePassword, true);
    assert.ok(!('passwordHash' in res._body.data));
  });

  it('e-mail duplicado → 409 EMAIL_TAKEN', async () => {
    const res = mkRes();
    await usersHandler(mkReq('POST', { name: 'Outro Nome', email: NEW.toUpperCase(), role: 'secretary', tempPassword: PASS }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 409);
    assert.equal(res._body.error.code, 'EMAIL_TAKEN');
  });
});

describe('PATCH /api/users/:id', () => {
  let id = 0;
  before(async () => { id = await seedUser(PTGT, PASS, { role: 'secretary' }); });

  it('id inexistente → 404', async () => {
    const res = mkRes();
    await userPatch(mkReq('PATCH', { name: 'Nome Novo' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await userPatch(mkReq('PATCH', { name: 'Nome Novo' }, { cookie: dir.cookies, query: { id: String(id) } }), res);
    assert.equal(res._status, 403);
  });

  it('nome incompleto → 400', async () => {
    const res = mkRes();
    await userPatch(mkReq('PATCH', { name: 'Solo' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 400);
  });

  it('atualiza nome + papel → 200', async () => {
    const res = mkRes();
    await userPatch(mkReq('PATCH', { name: 'Nome Completo', role: 'supervisor' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.name, 'Nome Completo');
    assert.equal(res._body.data.role, 'supervisor');
  });

  it('e-mail já em uso → 409 EMAIL_TAKEN', async () => {
    const res = mkRes();
    await userPatch(mkReq('PATCH', { email: DIR }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 409);
    assert.equal(res._body.error.code, 'EMAIL_TAKEN');
  });
});

describe('POST /api/users/:id/deactivate', () => {
  let id = 0;
  before(async () => { id = await seedUser(DTGT, PASS, { role: 'secretary' }); });

  it('id inexistente → 404', async () => {
    const res = mkRes();
    await userDeactivate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await userDeactivate(mkReq('POST', undefined, { cookie: dir.cookies, query: { id: String(id) } }), res);
    assert.equal(res._status, 403);
  });

  it('desativa → 200 e isActive false', async () => {
    const res = mkRes();
    await userDeactivate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.isActive, false);
  });
});

// Guarda do último Diretor — função pura (a contagem real é global e o admin
// semeado é sempre Diretor ativo, então isto não é disparável em integração).
describe('blocksLastDirector (unidade)', () => {
  const dirActive = { role: 'director', isActive: true };
  it('alvo não-Diretor → false', () => {
    assert.equal(blocksLastDirector({ role: 'secretary', isActive: true }, 1), false);
  });
  it('com 2+ Diretores ativos → false (desativar)', () => {
    assert.equal(blocksLastDirector(dirActive, 2), false);
  });
  it('último Diretor ativo, desativar → true', () => {
    assert.equal(blocksLastDirector(dirActive, 1), true);
  });
  it('último Diretor ativo, rebaixar p/ supervisor → true', () => {
    assert.equal(blocksLastDirector(dirActive, 1, 'supervisor'), true);
  });
  it('último Diretor ativo, mantendo director → false', () => {
    assert.equal(blocksLastDirector(dirActive, 1, 'director'), false);
  });
  it('Diretor inativo → false', () => {
    assert.equal(blocksLastDirector({ role: 'director', isActive: false }, 1), false);
  });
});
