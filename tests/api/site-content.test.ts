// Testes de integração do Editor de site (DASHBOARD_API §13, só Diretor).
// Rodar: npm run test:api. pageKey "apitest-sc" para escopar. Limpa no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import handler from '../../api/site-content';
import { db } from '../../server/db/client';
import { siteContent } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-sc-dir@example.com';
const SEC = 'apitest-sc-sec@example.com';
const PASS = 'Senh@12345';
const PAGE = 'apitest-sc';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;

async function cleanup() {
  await db.delete(siteContent).where(eq(siteContent.pageKey, PAGE));
}
async function row(fieldKey: string) {
  const r = await db.select().from(siteContent).where(eq(siteContent.pageKey, PAGE));
  return r.find((x) => x.fieldKey === fieldKey);
}

before(async () => {
  await clearAttempts(DIR, SEC);
  await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SEC, PASS, { role: 'secretary' });
  dir = await loginAs(DIR, PASS);
  sec = await loginAs(SEC, PASS);
  await cleanup();
});
after(async () => {
  await cleanup();
  await removeUser(DIR, SEC);
  await clearAttempts(DIR, SEC);
});

describe('PATCH /api/site-content', () => {
  it('Secretaria → 403 (só Diretor)', async () => {
    const res = mkRes();
    await handler(mkReq('PATCH', { action: 'save', items: [] }, { cookie: sec.cookies, csrf: sec.csrf }), res);
    assert.equal(res._status, 403);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await handler(mkReq('PATCH', { action: 'save', items: [{ pageKey: PAGE, fieldKey: 'titulo-hero', value: 'Oi' }] }, { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('título acima de 120 → 400', async () => {
    const res = mkRes();
    await handler(mkReq('PATCH', { action: 'save', items: [{ pageKey: PAGE, fieldKey: 'titulo-hero', value: 'x'.repeat(121) }] }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields['items.0.value']);
  });

  it('salvar → grava rascunho (pending, value vazio)', async () => {
    const res = mkRes();
    await handler(mkReq('PATCH', {
      action: 'save',
      items: [
        { pageKey: PAGE, fieldKey: 'titulo-hero', value: 'Bem-vindo' },
        { pageKey: PAGE, fieldKey: 'paragrafo-sobre', value: 'Texto longo da seção sobre.' },
      ],
    }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.saved, 2);
    const r = await row('titulo-hero');
    assert.equal(r!.draftValue, 'Bem-vindo');
    assert.equal(r!.value, '');
  });

  it('publicar → move rascunho para value e limpa draft', async () => {
    const res = mkRes();
    await handler(mkReq('PATCH', { action: 'publish' }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.published >= 2);
    const r = await row('titulo-hero');
    assert.equal(r!.value, 'Bem-vindo');
    assert.equal(r!.draftValue, null);
    assert.ok(r!.publishedAt);
  });
});

describe('GET /api/site-content', () => {
  it('Diretor → 200 lista os campos (pending derivado)', async () => {
    // gera uma pendência nova
    const save = mkRes();
    await handler(mkReq('PATCH', { action: 'save', items: [{ pageKey: PAGE, fieldKey: 'titulo-hero', value: 'Editado' }] }, { cookie: dir.cookies, csrf: dir.csrf }), save);

    const res = mkRes();
    await handler(mkReq('GET', undefined, { cookie: dir.cookies }), res);
    assert.equal(res._status, 200);
    const mine = res._body.data.filter((x: any) => x.pageKey === PAGE);
    const hero = mine.find((x: any) => x.fieldKey === 'titulo-hero');
    assert.equal(hero.pending, true);
    assert.equal(hero.draftValue, 'Editado');
    assert.equal(hero.value, 'Bem-vindo'); // ainda o publicado anterior
  });

  it('sem sessão → 401', async () => {
    const res = mkRes();
    await handler(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });
});
