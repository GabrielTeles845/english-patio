// Testes do CRUD de modelos de comunicado (/api/announcement-templates).
// RBAC director, CSRF, validação, duplicidade de nome e 404.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';
import listCreate from '../../routes/announcement-templates/index';
import byId from '../../routes/announcement-templates/[id]';
import { db } from '../../server/db/client';
import { announcementTemplates } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, loginAs } from './_helpers';

const DIR = 'apitest-tpl-dir@example.com';
const SEC = 'apitest-tpl-sec@example.com';
const PASS = 'Senh@12345';
const NAME = 'apitest Reunião de pais';
const NAME2 = 'apitest Aviso de feriado';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;

async function cleanup() {
  await db.delete(announcementTemplates).where(inArray(announcementTemplates.name, [NAME, NAME2]));
}

describe('/api/announcement-templates', () => {
  before(async () => {
    await seedUser(DIR, PASS, { role: 'director' });
    await seedUser(SEC, PASS, { role: 'secretary' });
    dir = await loginAs(DIR, PASS);
    sec = await loginAs(SEC, PASS);
    await cleanup();
  });
  after(async () => {
    await cleanup();
    await removeUser(DIR, SEC);
  });

  it('GET lista os modelos (inclui os 3 semeados na migration)', async () => {
    const res = mkRes();
    await listCreate(mkReq('GET', undefined, { cookie: dir.cookies }), res);
    assert.equal(res._status, 200);
    assert.ok(Array.isArray(res._body.data));
    assert.ok(res._body.data.length >= 3);
    const nomes = res._body.data.map((t: { name: string }) => t.name);
    assert.ok(nomes.includes('Comunicado geral'));
  });

  it('não-Diretor (secretaria) → 403', async () => {
    const res = mkRes();
    await listCreate(mkReq('GET', undefined, { cookie: sec.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('POST sem CSRF → 403', async () => {
    const res = mkRes();
    await listCreate(mkReq('POST', { name: NAME, subject: 'A', body: 'B' }, { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
    assert.equal(res._body.error.code, 'CSRF');
  });

  it('POST campos vazios → 400', async () => {
    const res = mkRes();
    await listCreate(mkReq('POST', { name: '', subject: '', body: '' }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.equal(res._body.error.code, 'VALIDATION');
  });

  let createdId: number;
  it('POST válido → 201 e devolve o modelo', async () => {
    const res = mkRes();
    await listCreate(
      mkReq('POST', { name: NAME, subject: 'Reunião — {{nome_aluno}}', body: 'Olá, {{nome_responsavel}}!' }, { cookie: dir.cookies, csrf: dir.csrf }),
      res,
    );
    assert.equal(res._status, 201);
    assert.equal(res._body.data.name, NAME);
    assert.equal(res._body.data.icon, 'file-text'); // default
    createdId = res._body.data.id;
    assert.ok(createdId > 0);
  });

  it('POST nome duplicado → 409', async () => {
    const res = mkRes();
    await listCreate(mkReq('POST', { name: NAME.toUpperCase(), subject: 'X', body: 'Y' }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 409);
    assert.equal(res._body.error.code, 'NAME_TAKEN');
  });

  it('PATCH edita nome/assunto/texto', async () => {
    const res = mkRes();
    await byId(mkReq('PATCH', { name: NAME2, subject: 'Novo assunto' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(createdId) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.name, NAME2);
    assert.equal(res._body.data.subject, 'Novo assunto');
  });

  it('PATCH id inexistente → 404', async () => {
    const res = mkRes();
    await byId(mkReq('PATCH', { name: 'Qualquer' }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('DELETE remove o modelo', async () => {
    const res = mkRes();
    await byId(mkReq('DELETE', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(createdId) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.deleted, true);
    const rows = await db.select().from(announcementTemplates).where(eq(announcementTemplates.id, createdId));
    assert.equal(rows.length, 0);
  });

  it('DELETE id inexistente → 404', async () => {
    const res = mkRes();
    await byId(mkReq('DELETE', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(createdId) } }), res);
    assert.equal(res._status, 404);
  });
});
