// Testes de integração da criação manual de matrícula (DASHBOARD_API §4.1/4.2).
// Rodar: npm run test:api. Cria com período "2095.1"; rastreia os ids criados e
// limpa tudo (matrícula + filhos + notif + log) no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { and, eq, inArray } from 'drizzle-orm';
import createList from '../../api/enrollments/index';
import { db } from '../../server/db/client';
import {
  enrollments, students, responsibles, addresses, contracts, notifications, activityLog,
} from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-ecreate-dir@example.com';
const SUP = 'apitest-ecreate-sup@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2095.1';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
const created: number[] = []; // enrollment ids criados

// CPFs válidos (dígitos verificadores corretos) — repetição é permitida (família).
const CPF_A = '11144477735';
const CPF_B = '52998224725';

function validForm(over: Record<string, unknown> = {}) {
  return {
    student1Name: 'Helena Duarte Lima', student1BirthDate: '14/02/2018', student1Age: '8',
    hasStudent2: false, student2Name: '', student2BirthDate: '', student2Age: '',
    responsibleName: 'Mariana Duarte Lima', responsibleBirthDate: '09/05/1989',
    responsibleCPF: CPF_A, responsiblePhone: '(62) 99214-8870',
    responsibleRelationship: 'Mãe', responsibleEmail: 'mariana@gmail.com',
    hasSecondResponsible: false, secondResponsibleName: '', secondResponsibleCPF: '',
    secondResponsiblePhone: '', secondResponsibleRelationship: '',
    financialResponsibleType: 'legal', financialResponsibleName: '', financialResponsibleCPF: '',
    cep: '74230-110', street: 'Rua T-55', number: '180', complement: 'Apto 902',
    neighborhood: 'Setor Bueno', city: 'Goiânia', state: 'GO', paymentMethod: 'boleto-6x',
    classFormat: 'sede', schedule: 'seg-qua',
    scheduleDay1Start: '8:30', scheduleDay1End: '9:30', scheduleDay2Start: '8:30', scheduleDay2End: '9:30',
    authorizationMedia: true, authorizationContract: true, scheduleConfirmed: true,
    ...over,
  };
}
function body(formOver: Record<string, unknown> = {}) {
  return { source: 'manual', period: PERIOD, formData: validForm(formOver) };
}

before(async () => {
  await clearAttempts(DIR, SUP);
  await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SUP, PASS, { role: 'supervisor' });
  dir = await loginAs(DIR, PASS);
  sup = await loginAs(SUP, PASS);
});
after(async () => {
  if (created.length) {
    const kids = await db.select({ id: students.id }).from(students).where(inArray(students.enrollmentId, created));
    const kidIds = kids.map((k) => k.id);
    if (kidIds.length) await db.delete(notifications).where(inArray(notifications.studentId, kidIds));
    await db.delete(contracts).where(inArray(contracts.enrollmentId, created));
    await db.delete(students).where(inArray(students.enrollmentId, created));
    await db.delete(responsibles).where(inArray(responsibles.enrollmentId, created));
    await db.delete(addresses).where(inArray(addresses.enrollmentId, created));
    await db.delete(activityLog).where(and(eq(activityLog.action, 'enrollment_created'), inArray(activityLog.targetId, created)));
    await db.delete(enrollments).where(inArray(enrollments.id, created));
  }
  await removeUser(DIR, SUP);
  await clearAttempts(DIR, SUP);
});

describe('POST /api/enrollments', () => {
  it('sem sessão → 401', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body(), {}), res);
    assert.equal(res._status, 401);
  });

  it('Supervisor → 403 (só director/secretary criam)', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body(), { cookie: sup.cookies, csrf: sup.csrf }), res);
    assert.equal(res._status, 403);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body(), { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('CPF inválido → 400 com fields.responsibleCPF', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body({ responsibleCPF: '12345678900' }), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.responsibleCPF);
  });

  it('telefone sem 9 → 400 com fields.responsiblePhone', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body({ responsiblePhone: '(62) 8214-8870' }), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.responsiblePhone);
  });

  it('aceite do contrato ausente → 400', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body({ authorizationContract: false }), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.authorizationContract);
  });

  it('endereço fora de GO → 422 OUTSIDE_GO', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body({ state: 'SP' }), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'OUTSIDE_GO');
  });

  it('criação válida → 201 com enrollmentId/students/contractId + persistência', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body(), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 201);
    const { enrollmentId, students: kids, contractId } = res._body.data;
    created.push(enrollmentId);
    assert.equal(kids.length, 1);
    assert.ok(contractId);

    const e = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1);
    assert.equal(e[0].paymentMethod, 'boleto-6x');
    assert.equal(e[0].source, 'manual');
    assert.ok(e[0].submissionId.startsWith('manual-'));

    const legal = await db.select().from(responsibles).where(and(eq(responsibles.enrollmentId, enrollmentId), eq(responsibles.type, 'legal')));
    assert.equal(legal[0].cpf, CPF_A); // gravado só com dígitos
    const addr = await db.select().from(addresses).where(eq(addresses.enrollmentId, enrollmentId));
    assert.equal(addr[0].state, 'GO');
    assert.equal(addr[0].cep, '74230110');
    const ctr = await db.select().from(contracts).where(eq(contracts.enrollmentId, enrollmentId));
    assert.equal(ctr[0].status, 'pending');
  });

  it('cria notificação e log para a matrícula', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body(), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 201);
    const { enrollmentId, students: kids } = res._body.data;
    created.push(enrollmentId);

    const notif = await db.select().from(notifications).where(eq(notifications.studentId, kids[0].id));
    assert.ok(notif.length >= 1);
    assert.equal(notif[0].type, 'enroll');
    const log = await db.select().from(activityLog).where(and(eq(activityLog.action, 'enrollment_created'), eq(activityLog.targetId, enrollmentId)));
    assert.ok(log.length >= 1);
  });

  it('2 alunos + segundo responsável + financeiro "other" → 2 students e 3 responsibles', async () => {
    const res = mkRes();
    await createList(mkReq('POST', body({
      hasStudent2: true, student2Name: 'Théo Andrade Rocha', student2BirthDate: '22/08/2015', student2Age: '10',
      hasSecondResponsible: true, secondResponsibleName: 'Rafael Lima', secondResponsibleCPF: CPF_B,
      secondResponsiblePhone: '(62) 98112-4471', secondResponsibleRelationship: 'Pai',
      financialResponsibleType: 'other', financialResponsibleName: 'Bruno Rocha', financialResponsibleCPF: CPF_B,
    }), { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 201);
    const { enrollmentId, students: kids } = res._body.data;
    created.push(enrollmentId);
    assert.equal(kids.length, 2);

    const rs = await db.select().from(responsibles).where(eq(responsibles.enrollmentId, enrollmentId));
    const types = rs.map((r) => r.type).sort();
    assert.deepEqual(types, ['financial', 'legal', 'second']);
  });
});
