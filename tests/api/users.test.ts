// Testes de integração de GET /api/users (DASHBOARD_API §10).
// Rodar: npm run test:api. Só Diretor; nunca expõe password_hash.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import usersHandler from '../../api/users/index';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-users-dir@example.com';
const SEC = 'apitest-users-sec@example.com';
const PASS = 'Senh@12345';

let dirAuth: { cookies: string };
let secAuth: { cookies: string };

before(async () => {
  await clearAttempts(DIR, SEC);
  await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SEC, PASS, { role: 'secretary' });
  dirAuth = await loginAs(DIR, PASS);
  secAuth = await loginAs(SEC, PASS);
});
after(async () => {
  await removeUser(DIR, SEC);
  await clearAttempts(DIR, SEC);
});

describe('GET /api/users', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await usersHandler(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });

  it('Secretaria (não-Diretor) → 403 FORBIDDEN', async () => {
    const res = mkRes();
    await usersHandler(mkReq('GET', undefined, { cookie: secAuth.cookies }), res);
    assert.equal(res._status, 403);
    assert.equal(res._body.error.code, 'FORBIDDEN');
  });

  it('Diretor → 200, lista inclui os usuários de teste', async () => {
    const res = mkRes();
    await usersHandler(mkReq('GET', undefined, { cookie: dirAuth.cookies }), res);
    assert.equal(res._status, 200);
    assert.ok(Array.isArray(res._body.data));
    const emails = res._body.data.map((u: any) => u.email);
    assert.ok(emails.includes(DIR) && emails.includes(SEC));
  });

  it('nunca expõe password_hash', async () => {
    const res = mkRes();
    await usersHandler(mkReq('GET', undefined, { cookie: dirAuth.cookies }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.every((u: any) => !('passwordHash' in u) && !('password_hash' in u)));
  });
});
