// Testes de integração de esqueci/redefinir senha (DASHBOARD_API §1).
// Rodar: npm run test:api. Sem RESEND_API_KEY o envio é stub (não bloqueia).
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import forgot from '../../api/auth/forgot';
import reset from '../../api/auth/reset';
import { db } from '../../server/db/client';
import { passwordResetTokens } from '../../server/db/schema';
import { hashToken } from '../../server/lib/resetToken';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, clearAttemptsByIp, loginAs } from './_helpers';

const EMAIL = 'apitest-reset@example.com';
const PASS = 'Senh@12345';
const NEW_PASS = 'NovaSenh@2026';
let userId = 0;

async function clearTokens() {
  if (userId) await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
}
async function insertToken(rawToken: string, expiresAt: Date): Promise<void> {
  await db.insert(passwordResetTokens).values({ userId, tokenHash: hashToken(rawToken), expiresAt });
}

before(async () => {
  await clearAttempts(EMAIL);
  await clearAttemptsByIp();
  userId = await seedUser(EMAIL, PASS, { role: 'director' });
  await clearTokens();
});
after(async () => {
  await clearTokens();
  await removeUser(EMAIL);
  await clearAttempts(EMAIL);
});

describe('POST /api/auth/forgot', () => {
  it('e-mail inválido → 400', async () => {
    const res = mkRes();
    await forgot(mkReq('POST', { email: 'naoeemail' }), res);
    assert.equal(res._status, 400);
  });

  it('e-mail desconhecido → 200 (não revela), sem token', async () => {
    const res = mkRes();
    await forgot(mkReq('POST', { email: 'inexistente-xyz@example.com' }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.ok, true);
  });

  it('e-mail conhecido → 200 e cria token', async () => {
    await clearTokens();
    const res = mkRes();
    await forgot(mkReq('POST', { email: EMAIL }), res);
    assert.equal(res._status, 200);
    const toks = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    assert.ok(toks.length >= 1);
  });
});

describe('POST /api/auth/reset', () => {
  it('token inválido → 400 INVALID_TOKEN', async () => {
    const res = mkRes();
    await reset(mkReq('POST', { token: 'naoexiste', password: NEW_PASS }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'INVALID_TOKEN');
  });

  it('senha fraca → 400 WEAK_PASSWORD', async () => {
    await clearTokens();
    await insertToken('tok-weak', new Date(Date.now() + 3600_000));
    const res = mkRes();
    await reset(mkReq('POST', { token: 'tok-weak', password: 'fraca' }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'WEAK_PASSWORD');
  });

  it('token expirado → 400 INVALID_TOKEN', async () => {
    await clearTokens();
    await insertToken('tok-exp', new Date(Date.now() - 1000));
    const res = mkRes();
    await reset(mkReq('POST', { token: 'tok-exp', password: NEW_PASS }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'INVALID_TOKEN');
  });

  it('token válido → 200, troca a senha (login novo funciona) e queima o token', async () => {
    await clearTokens();
    await clearAttemptsByIp();
    await insertToken('tok-ok', new Date(Date.now() + 3600_000));
    const res = mkRes();
    await reset(mkReq('POST', { token: 'tok-ok', password: NEW_PASS }), res);
    assert.equal(res._status, 200);

    // login com a nova senha funciona
    const session = await loginAs(EMAIL, NEW_PASS);
    assert.notEqual(session.session, '');

    // reusar o mesmo token → 400 (já usado)
    const again = mkRes();
    await reset(mkReq('POST', { token: 'tok-ok', password: NEW_PASS }), again);
    assert.equal(again._status, 400);
    assert.equal(again._body.error.code, 'INVALID_TOKEN');
  });
});
