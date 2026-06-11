// Testes de integração de comunicados (DASHBOARD_API §8, só Diretor).
// Rodar: npm run test:api. Audiência escopada por período "2092.1" (1 família).
// Sem RESEND_API_KEY o e-mail é stub (tratado como aceito). Limpa no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';
import listSend from '../../api/announcements/index';
import preview from '../../api/announcements/preview';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, announcements, announcementRecipients } from '../../server/db/schema';
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
