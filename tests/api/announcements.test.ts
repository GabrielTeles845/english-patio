// Testes de integração de comunicados (DASHBOARD_API §8, só Diretor).
// Rodar: npm run test:api. Audiência escopada por período "2092.1" (1 família).
// Sem RESEND_API_KEY o e-mail é stub (tratado como aceito). Limpa no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';
import listSend from '../../api/announcements/index';
import preview from '../../api/announcements/preview';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, announcements, announcementRecipients, classes, contracts, rooms, levels } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-ann-dir@example.com';
const SEC = 'apitest-ann-sec@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2092.1';
const SUB = 'apitest-ann-enrollment';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sec: Awaited<ReturnType<typeof loginAs>>;
let dirId = 0;
const aud = { period: PERIOD };

async function cleanup() {
  const er = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.submissionId, SUB));
  const ids = er.map((r) => r.id);
  if (dirId) {
    const anns = await db.select({ id: announcements.id }).from(announcements).where(eq(announcements.createdBy, dirId));
    const aids = anns.map((a) => a.id);
    if (aids.length) {
      await db.delete(announcementRecipients).where(inArray(announcementRecipients.announcementId, aids));
      await db.delete(announcements).where(inArray(announcements.id, aids));
    }
  }
  if (ids.length) {
    await db.delete(students).where(inArray(students.enrollmentId, ids));
    await db.delete(responsibles).where(inArray(responsibles.enrollmentId, ids));
    await db.delete(enrollments).where(inArray(enrollments.id, ids));
  }
}

before(async () => {
  await clearAttempts(DIR, SEC);
  dirId = await seedUser(DIR, PASS, { role: 'director' });
  await seedUser(SEC, PASS, { role: 'secretary' });
  dir = await loginAs(DIR, PASS);
  sec = await loginAs(SEC, PASS);
  await cleanup();

  const e = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB, classFormat: 'sede', financialResponsibleType: 'legal',
    authorizationContract: true, scheduleConfirmed: true, period: PERIOD,
  }).returning();
  await db.insert(students).values({ enrollmentId: e[0].id, name: 'Helena Comunicado', birthDate: '2016-05-10', isActive: true });
  await db.insert(responsibles).values({ enrollmentId: e[0].id, type: 'legal', name: 'Mariana Comunicado', email: 'mae@example.com', phone: '62992148870' });
});
after(async () => {
  await cleanup();
  await removeUser(DIR, SEC);
  await clearAttempts(DIR, SEC);
});

describe('POST /api/announcements/preview', () => {
  it('Secretaria → 403', async () => {
    const res = mkRes();
    await preview(mkReq('POST', { subject: 'A', body: 'B' }, { cookie: sec.cookies, csrf: sec.csrf }), res);
    assert.equal(res._status, 403);
  });

  it('variável aberta sem fechar → 400', async () => {
    const res = mkRes();
    await preview(mkReq('POST', { subject: 'Oi', body: 'Olá {{nome_responsavel', audienceFilter: aud }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
  });

  it('render com a família da audiência (variáveis substituídas)', async () => {
    const res = mkRes();
    await preview(mkReq('POST', { subject: 'Oi {{nome_responsavel}}', body: 'Aluno: {{nome_aluno}}', audienceFilter: aud }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.audienceCount, 1);
    assert.equal(res._body.data.subject, 'Oi Mariana Comunicado');
    assert.equal(res._body.data.body, 'Aluno: Helena Comunicado');
  });
});

describe('POST /api/announcements', () => {
  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await listSend(mkReq('POST', { subject: 'A', body: 'B', channels: ['email'], audienceFilter: aud }, { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('sem canal → 400', async () => {
    const res = mkRes();
    await listSend(mkReq('POST', { subject: 'A', body: 'B', channels: [], audienceFilter: aud }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 400);
  });

  it('envio por e-mail → 201, destinatário criado e contado', async () => {
    const res = mkRes();
    await listSend(mkReq('POST', { subject: 'Aviso {{nome_responsavel}}', body: 'Olá', channels: ['email'], audienceFilter: aud }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 201);
    assert.equal(res._body.data.recipients, 1);
    assert.equal(res._body.data.sent, 1);
    const ann = await db.select().from(announcements).where(eq(announcements.id, res._body.data.announcementId)).limit(1);
    assert.equal(ann[0].status, 'sent');
  });

  it('WhatsApp → 201 com destinatário "prepared"', async () => {
    const res = mkRes();
    await listSend(mkReq('POST', { subject: 'Aviso', body: 'Olá', channels: ['whatsapp'], audienceFilter: aud }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 201);
    assert.equal(res._body.data.prepared, 1);
    const rcp = await db.select().from(announcementRecipients).where(eq(announcementRecipients.announcementId, res._body.data.announcementId));
    assert.equal(rcp[0].status, 'prepared');
  });
});

describe('GET /api/announcements', () => {
  it('Diretor → 200 com histórico e recipientCount', async () => {
    const res = mkRes();
    await listSend(mkReq('GET', undefined, { cookie: dir.cookies }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.items.length >= 1);
    assert.ok('recipientCount' in res._body.data.items[0]);
  });
});

/* audiência segmentada (filtros da tela: dia-par da turma e contrato pendente).
   Aloca o aluno da família de teste numa turma Seg/Qua e cria um contrato pendente,
   tudo escopado ao período PERIOD (1 família) para isolar a contagem. */
describe('resolveAudience — segmentos da tela (via preview)', () => {
  let enrollmentId = 0;
  let studentId = 0;
  let classId = 0;
  let contractId = 0;

  before(async () => {
    const e = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.submissionId, SUB)).limit(1);
    enrollmentId = e[0].id;
    const st = await db.select({ id: students.id }).from(students).where(eq(students.enrollmentId, enrollmentId)).limit(1);
    studentId = st[0].id;
    const room = await db.select({ id: rooms.id }).from(rooms).limit(1);
    const level = await db.select({ id: levels.id }).from(levels).limit(1);
    const c = await db.insert(classes).values({
      roomId: room[0].id, dayPair: 'seg-qua', startTime: '8:30', levelId: level[0].id, capacity: 7, period: PERIOD,
    }).returning();
    classId = c[0].id;
    await db.update(students).set({ classId }).where(eq(students.id, studentId));
    const ct = await db.insert(contracts).values({ enrollmentId, status: 'pending' }).returning();
    contractId = ct[0].id;
  });

  after(async () => {
    if (contractId) await db.delete(contracts).where(eq(contracts.id, contractId));
    if (studentId) await db.update(students).set({ classId: null }).where(eq(students.id, studentId));
    if (classId) await db.delete(classes).where(eq(classes.id, classId));
  });

  const previewCount = async (audienceFilter: Record<string, unknown>): Promise<number> => {
    const res = mkRes();
    await preview(mkReq('POST', { subject: 'Oi', body: 'Olá', audienceFilter }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 200);
    return res._body.data.audienceCount;
  };

  it('dayPair seg-qua inclui a família; ter-qui exclui', async () => {
    assert.equal(await previewCount({ period: PERIOD, dayPair: 'seg-qua' }), 1);
    assert.equal(await previewCount({ period: PERIOD, dayPair: 'ter-qui' }), 0);
  });

  it('pendingContract inclui contrato pending/sent/viewed e exclui assinado', async () => {
    assert.equal(await previewCount({ period: PERIOD, pendingContract: true }), 1);
    await db.update(contracts).set({ status: 'signed' }).where(eq(contracts.id, contractId));
    assert.equal(await previewCount({ period: PERIOD, pendingContract: true }), 0);
    await db.update(contracts).set({ status: 'pending' }).where(eq(contracts.id, contractId));
  });
});
