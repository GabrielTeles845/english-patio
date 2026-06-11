// Testes de integração da leitura de matrículas (DASHBOARD_API §3).
// Rodar: npm run test:api. Usa período "2097.1" (distinto de rooms/classes que
// rodam em paralelo) e submissionId com prefixo "apitest-enroll-". Limpa tudo no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { and, eq, inArray, like } from 'drizzle-orm';
import listHandler from '../../api/enrollments/index';
import detailHandler from '../../api/enrollments/[id]';
import { db } from '../../server/db/client';
import {
  enrollments,
  students,
  responsibles,
  addresses,
  contracts,
  activityLog,
} from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-enroll-dir@example.com';
const SUP = 'apitest-enroll-sup@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2097.1';
const SUB_PREFIX = 'apitest-enroll-';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
let activeId = 0; // família com aluno ativo + contrato assinado
let inactiveId = 0; // família com aluno desligado, contrato pendente

async function cleanup() {
  const rows = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(like(enrollments.submissionId, `${SUB_PREFIX}%`));
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    await db.delete(contracts).where(inArray(contracts.enrollmentId, ids));
    await db.delete(students).where(inArray(students.enrollmentId, ids));
    await db.delete(responsibles).where(inArray(responsibles.enrollmentId, ids));
    await db.delete(addresses).where(inArray(addresses.enrollmentId, ids));
    await db.delete(enrollments).where(inArray(enrollments.id, ids));
  }
}

async function seedFamily(opts: {
  sub: string;
  kidName: string;
  respName: string;
  cpf: string;
  kidActive: boolean;
  contractStatus: 'pending' | 'signed';
  media: boolean;
  neighborhood: string;
}): Promise<number> {
  const e = await db
    .insert(enrollments)
    .values({
      source: 'manual',
      submissionId: opts.sub,
      classFormat: 'sede',
      financialResponsibleType: 'legal',
      authorizationMedia: opts.media,
      authorizationContract: true,
      scheduleConfirmed: true,
      period: PERIOD,
    })
    .returning();
  const id = e[0].id;
  await db.insert(students).values({
    enrollmentId: id,
    name: opts.kidName,
    birthDate: '2016-05-10',
    isActive: opts.kidActive,
  });
  await db.insert(responsibles).values({
    enrollmentId: id,
    type: 'legal',
    name: opts.respName,
    cpf: opts.cpf,
    phone: '62992148870',
    email: 'resp@example.com',
    relationship: 'Mãe',
  });
  await db.insert(addresses).values({
    enrollmentId: id,
    cep: '74230110',
    street: 'Rua T-55',
    number: '180',
    neighborhood: opts.neighborhood,
    city: 'Goiânia',
    state: 'GO',
  });
  await db.insert(contracts).values({ enrollmentId: id, status: opts.contractStatus });
  return id;
}

before(async () => {
  await clearAttempts(DIR, SUP);
  await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SUP, PASS, { role: 'supervisor' });
  dir = await loginAs(DIR, PASS);
  sup = await loginAs(SUP, PASS);
  await cleanup();
  activeId = await seedFamily({
    sub: `${SUB_PREFIX}ativa`, kidName: 'Helena Ativa', respName: 'Mariana Ativa',
    cpf: '04781233619', kidActive: true, contractStatus: 'signed', media: true, neighborhood: 'Setor Bueno',
  });
  inactiveId = await seedFamily({
    sub: `${SUB_PREFIX}inativa`, kidName: 'Davi Inativo', respName: 'Aline Inativa',
    cpf: '62077824530', kidActive: false, contractStatus: 'pending', media: false, neighborhood: 'Setor Sul',
  });
});
after(async () => {
  await cleanup();
  await db.delete(activityLog).where(
    and(eq(activityLog.action, 'view_student_pii'), inArray(activityLog.targetId, [activeId, inactiveId])),
  );
  await removeUser(DIR, SUP);
  await clearAttempts(DIR, SUP);
});

describe('GET /api/enrollments', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { query: { period: PERIOD } }), res);
    assert.equal(res._status, 401);
  });

  it('Supervisor → 200 (leitura permitida)', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: sup.cookies, query: { period: PERIOD } }), res);
    assert.equal(res._status, 200);
  });

  it('lista por período → as 2 famílias, com envelope paginado', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.total, 2);
    assert.equal(res._body.data.page, 1);
    assert.equal(res._body.data.items.length, 2);
  });

  it('CPF vem mascarado na lista', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD } }), res);
    const ativa = res._body.data.items.find((x: any) => x.id === activeId);
    assert.equal(ativa.responsible.cpf, '047.•••.•••-19');
    assert.equal(ativa.contractStatus, 'signed');
    assert.equal(ativa.neighborhood, 'Setor Bueno');
    assert.equal(ativa.kidCount, 1);
  });

  it('filtro status=active → só a família com aluno ativo', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD, status: 'active' } }), res);
    assert.equal(res._body.data.items.length, 1);
    assert.equal(res._body.data.items[0].id, activeId);
  });

  it('filtro status=inactive → só a família desligada', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD, status: 'inactive' } }), res);
    assert.equal(res._body.data.items.length, 1);
    assert.equal(res._body.data.items[0].id, inactiveId);
  });

  it('filtro contractStatus=signed → só a assinada', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD, contractStatus: 'signed' } }), res);
    assert.equal(res._body.data.items.length, 1);
    assert.equal(res._body.data.items[0].id, activeId);
  });

  it('busca q por nome do aluno → acha a família', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD, q: 'Helena Ativa' } }), res);
    assert.equal(res._body.data.items.length, 1);
    assert.equal(res._body.data.items[0].id, activeId);
  });

  it('paginação pageSize=1 → 1 item e total 2', async () => {
    const res = mkRes();
    await listHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { period: PERIOD, pageSize: '1', page: '1' } }), res);
    assert.equal(res._body.data.items.length, 1);
    assert.equal(res._body.data.total, 2);
    assert.equal(res._body.data.pageSize, 1);
  });
});

describe('GET /api/enrollments/:id', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await detailHandler(mkReq('GET', undefined, { query: { id: String(activeId) } }), res);
    assert.equal(res._status, 401);
  });

  it('id inexistente → 404', async () => {
    const res = mkRes();
    await detailHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('detalhe → CPF inteiro revelado + filhos/responsáveis/endereço/contrato', async () => {
    const res = mkRes();
    await detailHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { id: String(activeId) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.students.length, 1);
    assert.equal(res._body.data.responsibles[0].cpf, '047.812.336-19');
    assert.equal(res._body.data.address.neighborhood, 'Setor Bueno');
    assert.equal(res._body.data.contract.status, 'signed');
  });

  it('acesso ao detalhe grava log view_student_pii', async () => {
    const res = mkRes();
    await detailHandler(mkReq('GET', undefined, { cookie: dir.cookies, query: { id: String(inactiveId) } }), res);
    assert.equal(res._status, 200);
    const logs = await db
      .select({ id: activityLog.id })
      .from(activityLog)
      .where(and(eq(activityLog.action, 'view_student_pii'), eq(activityLog.targetId, inactiveId)));
    assert.ok(logs.length >= 1);
  });
});
