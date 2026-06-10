// Testes de integração das rotas de auth/conta (DASHBOARD_API §1) contra o Neon.
// Rodar: npm run test:api  (precisa de DATABASE_URL/JWT_SECRET no .env).
// Cada bloco usa usuários de teste dedicados, criados e removidos no setup/teardown
// — nunca toca no Diretor semeado.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import login from '../../api/auth/login';
import me from '../../api/auth/me';
import logout from '../../api/auth/logout';
import changePassword from '../../api/account/password';
import patchAccount from '../../api/account/index';
import {
  mkReq, mkRes, getCookie, cookieValue, seedUser, removeUser, clearAttempts,
} from './_helpers';

const PASS = 'Senh@12345';

describe('POST /api/auth/login', () => {
  const email = 'apitest-login@example.com';
  before(async () => { await clearAttempts(email); await seedUser(email, PASS, { mustChange: true }); });
  after(async () => { await removeUser(email); await clearAttempts(email); });

  it('rejeita método != POST com 405', async () => {
    const res = mkRes();
    await login(mkReq('GET', {}), res);
    assert.equal(res._status, 405);
  });

  it('rejeita body inválido com 400 + fields', async () => {
    const res = mkRes();
    await login(mkReq('POST', { email: 'nao-eh-email' }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'VALIDATION');
    assert.ok(res._body.error.fields);
  });

  it('credenciais inválidas → 401 BAD_CREDENTIALS (genérico)', async () => {
    const res = mkRes();
    await login(mkReq('POST', { email, password: 'errada123' }), res);
    assert.equal(res._status, 401);
    assert.equal(res._body.error.code, 'BAD_CREDENTIALS');
  });

  it('e-mail inexistente → 401 (não revela existência)', async () => {
    const res = mkRes();
    await login(mkReq('POST', { email: 'naoexiste@example.com', password: PASS }), res);
    assert.equal(res._status, 401);
  });

  it('login válido → 200, cookies de sessão/CSRF e payload', async () => {
    const res = mkRes();
    await login(mkReq('POST', { email, password: PASS }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.ok, true);
    assert.equal(res._body.data.user.role, 'director');
    assert.equal(res._body.data.mustChangePassword, true);
    assert.ok(getCookie(res, 'ep_session').length > 'ep_session='.length);
    assert.ok(getCookie(res, 'ep_csrf').length > 'ep_csrf='.length);
  });
});

describe('GET /api/auth/me + POST /api/auth/logout', () => {
  const email = 'apitest-me@example.com';
  let session = '';
  before(async () => {
    await clearAttempts(email);
    await seedUser(email, PASS);
    const res = mkRes();
    await login(mkReq('POST', { email, password: PASS }), res);
    session = getCookie(res, 'ep_session');
  });
  after(async () => { await removeUser(email); await clearAttempts(email); });

  it('me sem cookie → 401', async () => {
    const res = mkRes();
    await me(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });

  it('me com sessão → 200 e mesmo usuário', async () => {
    const res = mkRes();
    await me(mkReq('GET', undefined, { cookie: session }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.user.email, email);
  });

  it('logout limpa o cookie de sessão', async () => {
    const res = mkRes();
    await logout(mkReq('POST', undefined, { cookie: session }), res);
    assert.equal(res._status, 200);
    assert.equal(getCookie(res, 'ep_session'), 'ep_session=');
  });
});

describe('POST /api/account/password', () => {
  const email = 'apitest-pass@example.com';
  let session = '';
  let csrfPair = '';
  let csrf = '';
  // O navegador envia ambos os cookies; o CSRF double-submit confere o cookie
  // ep_csrf contra o header x-csrf-token.
  const cookies = () => `${session}; ${csrfPair}`;

  before(async () => {
    await clearAttempts(email);
    await seedUser(email, PASS, { mustChange: true });
    const res = mkRes();
    await login(mkReq('POST', { email, password: PASS }), res);
    session = getCookie(res, 'ep_session');
    csrfPair = getCookie(res, 'ep_csrf');
    csrf = cookieValue(csrfPair);
  });
  after(async () => { await removeUser(email); await clearAttempts(email); });

  it('sem sessão → 401', async () => {
    const res = mkRes();
    await changePassword(mkReq('POST', { newPassword: 'NovaSenh@2026' }), res);
    assert.equal(res._status, 401);
  });

  it('sem token CSRF → 403', async () => {
    const res = mkRes();
    await changePassword(mkReq('POST', { newPassword: 'NovaSenh@2026' }, { cookie: cookies() }), res);
    assert.equal(res._status, 403);
    assert.equal(res._body.error.code, 'CSRF');
  });

  it('senha fraca → 400 WEAK_PASSWORD', async () => {
    const res = mkRes();
    await changePassword(mkReq('POST', { newPassword: 'abc' }, { cookie: cookies(), csrf }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'WEAK_PASSWORD');
  });

  it('nova == atual → 400 SAME_PASSWORD', async () => {
    const res = mkRes();
    await changePassword(mkReq('POST', { newPassword: PASS }, { cookie: cookies(), csrf }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'SAME_PASSWORD');
  });

  it('1º acesso troca sem currentPassword → 200 e mustChangePassword=false', async () => {
    const res = mkRes();
    await changePassword(mkReq('POST', { newPassword: 'NovaSenh@2026' }, { cookie: cookies(), csrf }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.mustChangePassword, false);
    // sessão reemitida (a antiga foi invalidada pela troca)
    session = getCookie(res, 'ep_session');
    assert.ok(session.length > 'ep_session='.length);
  });

  it('fora do 1º acesso exige currentPassword → 400', async () => {
    const res = mkRes();
    await changePassword(mkReq('POST', { newPassword: 'OutraSenh@9' }, { cookie: cookies(), csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.currentPassword);
  });

  it('currentPassword errada → 400 WRONG_PASSWORD', async () => {
    const res = mkRes();
    await changePassword(
      mkReq('POST', { currentPassword: 'errada123', newPassword: 'OutraSenh@9' }, { cookie: cookies(), csrf }),
      res,
    );
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'WRONG_PASSWORD');
  });

  it('currentPassword correta → 200', async () => {
    const res = mkRes();
    await changePassword(
      mkReq('POST', { currentPassword: 'NovaSenh@2026', newPassword: 'OutraSenh@9' }, { cookie: cookies(), csrf }),
      res,
    );
    assert.equal(res._status, 200);
  });
});

describe('PATCH /api/account', () => {
  const email = 'apitest-acc@example.com';
  const taken = 'apitest-acc-taken@example.com';
  let session = '';
  let csrfPair = '';
  let csrf = '';
  const cookies = () => `${session}; ${csrfPair}`;

  before(async () => {
    await clearAttempts(email);
    await seedUser(email, PASS);
    await seedUser(taken, PASS);
    const res = mkRes();
    await login(mkReq('POST', { email, password: PASS }), res);
    session = getCookie(res, 'ep_session');
    csrfPair = getCookie(res, 'ep_csrf');
    csrf = cookieValue(csrfPair);
  });
  after(async () => { await removeUser(email, taken, 'apitest-acc-new@example.com'); await clearAttempts(email); });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await patchAccount(mkReq('PATCH', { name: 'Novo Nome' }, { cookie: cookies() }), res);
    assert.equal(res._status, 403);
  });

  it('body vazio → 400', async () => {
    const res = mkRes();
    await patchAccount(mkReq('PATCH', {}, { cookie: cookies(), csrf }), res);
    assert.equal(res._status, 400);
  });

  it('atualiza o nome → 200', async () => {
    const res = mkRes();
    await patchAccount(mkReq('PATCH', { name: 'Novo Nome' }, { cookie: cookies(), csrf }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.user.name, 'Novo Nome');
  });

  it('e-mail já em uso → 409 EMAIL_TAKEN', async () => {
    const res = mkRes();
    await patchAccount(mkReq('PATCH', { email: taken }, { cookie: cookies(), csrf }), res);
    assert.equal(res._status, 409);
    assert.equal(res._body.error.code, 'EMAIL_TAKEN');
  });

  it('e-mail novo e único → 200', async () => {
    const res = mkRes();
    await patchAccount(mkReq('PATCH', { email: 'apitest-acc-new@example.com' }, { cookie: cookies(), csrf }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.user.email, 'apitest-acc-new@example.com');
  });
});
