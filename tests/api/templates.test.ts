// Testes de integração dos modelos de contrato (DASHBOARD_API §7, só Diretor).
// Rodar: npm run test:api. Nome com prefixo "ZZTpl ". Limpa no fim — anulando
// antes qualquer contrato que referencie os modelos (FK), pois a criação de
// matrícula paralela pode carimbar o template ativo.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray, like } from 'drizzle-orm';
import listCreate from '../../api/templates/index';
import byId from '../../api/templates/[id]/index';
import activate from '../../api/templates/[id]/activate';
import { db } from '../../server/db/client';
import { contractTemplates, contracts } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-tpl-dir@example.com';
const SEC = 'apitest-tpl-sec@example.com';
const PASS = 'Senh@12345';
const PREFIX = 'ZZTpl ';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;

const MAPPED = [{ key: 'nome', mapped: true }, { key: 'cpf', page: 1, x: 10, y: 20 }];
const PENDING = [{ key: 'nome', mapped: true }, { key: 'cpf' }];

async function cleanup() {
  const ts = await db.select({ id: contractTemplates.id }).from(contractTemplates).where(like(contractTemplates.name, `${PREFIX}%`));
  const ids = ts.map((t) => t.id);
  if (ids.length) {
    await db.update(contracts).set({ templateId: null }).where(inArray(contracts.templateId, ids));
    await db.delete(contractTemplates).where(inArray(contractTemplates.id, ids));
  }
}
async function mkTemplate(name: string, fieldMap: unknown) {
  const r = await db.insert(contractTemplates).values({ name: `${PREFIX}${name}`, pdfUrl: 'https://x/y.pdf', fieldMap }).returning();
  return r[0].id;
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

describe('GET/POST /api/templates', () => {
  it('Secretaria → 403 (só Diretor)', async () => {
    const res = mkRes();
    await listCreate(mkReq('GET', undefined, { cookie: sec.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('POST sem CSRF → 403', async () => {
    const res = mkRes();
    await listCreate(mkReq('POST', { name: `${PREFIX}A`, pdfUrl: 'x' }, { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('POST sem pdf → 400', async () => {
    const res = mkRes();
    await listCreate(mkReq('POST', { name: `${PREFIX}A` }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.pdfUrl);
  });

  it('POST válido → 201, inativo por padrão', async () => {
    const res = mkRes();
    await listCreate(mkReq('POST', { name: `${PREFIX}Contrato 2026`, pdfUrl: 'https://x/y.pdf', fieldMap: MAPPED }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 201);
    assert.equal(res._body.data.isActive, false);
  });
});

describe('PATCH/DELETE /api/templates/:id', () => {
  it('PATCH renomeia → 200', async () => {
    const id = await mkTemplate('Velho', MAPPED);
    const res = mkRes();
    await byId(mkReq('PATCH', { name: `${PREFIX}Novo Nome` }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.name, `${PREFIX}Novo Nome`);
  });

  it('PATCH id inexistente → 404', async () => {
    const res = mkRes();
    await byId(mkReq('PATCH', { name: `${PREFIX}X` }, { cookie: dir.cookies, csrf: dir.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('DELETE arquiva → archivedAt + inativo', async () => {
    const id = await mkTemplate('ArquivarMe', MAPPED);
    const res = mkRes();
    await byId(mkReq('DELETE', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.archivedAt);
    assert.equal(res._body.data.isActive, false);
  });
});

describe('POST /api/templates/:id/activate', () => {
  it('campos pendentes → 422 UNMAPPED_FIELDS', async () => {
    const id = await mkTemplate('Pendente', PENDING);
    const res = mkRes();
    await activate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'UNMAPPED_FIELDS');
  });

  it('ativa e desativa os outros', async () => {
    const a = await mkTemplate('Ativo A', MAPPED);
    const b = await mkTemplate('Ativo B', MAPPED);
    const r1 = mkRes();
    await activate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(a) } }), r1);
    assert.equal(r1._body.data.isActive, true);

    const r2 = mkRes();
    await activate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(b) } }), r2);
    assert.equal(r2._body.data.isActive, true);

    const reA = await db.select().from(contractTemplates).where(eq(contractTemplates.id, a)).limit(1);
    assert.equal(reA[0].isActive, false); // A foi desativado ao ativar B
  });

  it('arquivado → 422 ARCHIVED', async () => {
    const id = await mkTemplate('Arquivado', MAPPED);
    await db.update(contractTemplates).set({ archivedAt: new Date() }).where(eq(contractTemplates.id, id));
    const res = mkRes();
    await activate(mkReq('POST', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'ARCHIVED');
  });
});
