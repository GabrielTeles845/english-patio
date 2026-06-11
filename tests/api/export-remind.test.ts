// Testes de integração de export CSV (§4.8) e cobrança de contrato (§6).
// Rodar: npm run test:api. Períodos únicos "2090.1"/"2090.2". Limpa no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';
import exportCsv from '../../api/enrollments/export';
import remind from '../../api/contracts/[id]/remind';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, addresses, contracts, activityLog } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-xr-dir@example.com';
const SUP = 'apitest-xr-sup@example.com';
const PASS = 'Senh@12345';
const SUB1 = 'apitest-xr-fam1';
const SUB2 = 'apitest-xr-fam2';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
let dirId = 0;
let cPending = 0, cSigned = 0, cNoPhone = 0;

async function cleanup() {
  const er = await db.select({ id: enrollments.id }).from(enrollments).where(inArray(enrollments.submissionId, [SUB1, SUB2]));
  const ids = er.map((r) => r.id);
  if (ids.length) {
    await db.delete(contracts).where(inArray(contracts.enrollmentId, ids));
    await db.delete(students).where(inArray(students.enrollmentId, ids));
    await db.delete(responsibles).where(inArray(responsibles.enrollmentId, ids));
    await db.delete(addresses).where(inArray(addresses.enrollmentId, ids));
    await db.delete(enrollments).where(inArray(enrollments.id, ids));
  }
}

before(async () => {
  await clearAttempts(DIR, SUP);
  dirId = await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SUP, PASS, { role: 'supervisor' });
  dir = await loginAs(DIR, PASS);
  sup = await loginAs(SUP, PASS);
  await cleanup();

  // Família 1 (completa, período 2090.1)
  const e1 = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB1, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: '2090.1',
  }).returning();
  await db.insert(students).values({ enrollmentId: e1[0].id, name: 'Helena Export', birthDate: '2016-05-10' });
  await db.insert(responsibles).values({ enrollmentId: e1[0].id, type: 'legal', name: 'Mariana Export', cpf: '11144477735', phone: '62992148870', email: 'mae@example.com' });
  await db.insert(addresses).values({ enrollmentId: e1[0].id, cep: '74230110', street: 'Rua X', number: '1', neighborhood: 'Setor Export', city: 'Goiânia', state: 'GO' });
  cPending = (await db.insert(contracts).values({ enrollmentId: e1[0].id, status: 'pending' }).returning())[0].id;
  cSigned = (await db.insert(contracts).values({ enrollmentId: e1[0].id, status: 'signed' }).returning())[0].id;

  // Família 2 (responsável SEM telefone, período 2090.2)
  const e2 = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB2, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: '2090.2',
  }).returning();
  await db.insert(students).values({ enrollmentId: e2[0].id, name: 'Davi SemTel', birthDate: '2016-05-10' });
  await db.insert(responsibles).values({ enrollmentId: e2[0].id, type: 'legal', name: 'Aline SemTel' });
  cNoPhone = (await db.insert(contracts).values({ enrollmentId: e2[0].id, status: 'pending' }).returning())[0].id;
});
after(async () => {
  await cleanup();
  await db.delete(activityLog).where(eq(activityLog.actorId, dirId));
  await removeUser(DIR, SUP);
  await clearAttempts(DIR, SUP);
});

describe('GET /api/enrollments/export', () => {
  it('Supervisor → 403', async () => {
    const res = mkRes();
    await exportCsv(mkReq('GET', undefined, { cookie: sup.cookies, csrf: sup.csrf, query: { period: '2090.1' } }), res);
    assert.equal(res._status, 403);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await exportCsv(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: '2090.1' } }), res);
    assert.equal(res._status, 403);
  });

  it('Diretor → CSV com cabeçalho, aluno e CPF mascarado', async () => {
    const res = mkRes();
    await exportCsv(mkReq('GET', undefined, { cookie: dir.cookies, csrf: dir.csrf, query: { period: '2090.1' } }), res);
    assert.equal(res._status, 200);
    assert.match(String(res._headers['Content-Type']), /text\/csv/);
    const csv = String(res._body);
    assert.ok(csv.includes('id,periodo,status'));
    assert.ok(csv.includes('Helena Export'));
    assert.ok(csv.includes('111.•••.•••-35')); // CPF mascarado
  });
});

describe('POST /api/contracts/:id/remind', () => {
  it('Supervisor → 403', async () => {
    const res = mkRes();
    await remind(mkReq('POST', {}, { cookie: sup.cookies, csrf: sup.csrf, query: { id: String(cPending) } }), res);
    assert.equal(res._status, 403);
  });

  it('contrato inexistente → 404', async () => {
    const res = mkRes();
    await remind(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('já assinado → 422 ALREADY_SIGNED', async () => {
    const res = mkRes();
    await remind(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(cSigned) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'ALREADY_SIGNED');
  });

  it('responsável sem telefone → 422 NO_PHONE', async () => {
    const res = mkRes();
    await remind(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(cNoPhone) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'NO_PHONE');
  });

  it('prepara a cobrança → 200 com mensagem e link wa.me', async () => {
    const res = mkRes();
    await remind(mkReq('POST', {}, { cookie: dir.cookies, csrf: dir.csrf, query: { id: String(cPending) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.phone, '62992148870');
    assert.ok(res._body.data.message.includes('Mariana Export'));
    assert.ok(res._body.data.message.includes('Helena Export'));
    assert.ok(res._body.data.waLink.startsWith('https://wa.me/5562992148870?text='));
  });
});
