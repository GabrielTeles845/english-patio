// Testes de integração das rotas de Agenda — salas e níveis (DASHBOARD_API §5).
// Rodar: npm run test:api. Cria salas de teste (prefixo "ZZTest ") e remove no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, like } from 'drizzle-orm';
import roomsHandler from '../../api/rooms/index';
import roomPatch from '../../api/rooms/[id]/index';
import roomDeactivate from '../../api/rooms/[id]/deactivate';
import levelsHandler from '../../api/levels';
import { db } from '../../server/db/client';
import { rooms, classes, levels } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const EMAIL = 'apitest-rooms@example.com';
const PASS = 'Senh@12345';
const PREFIX = 'ZZTest ';

let auth: { cookies: string; csrf: string };
const createdClassIds: number[] = [];

async function cleanupRooms() {
  // turmas de teste primeiro (FK), depois as salas de teste
  for (const id of createdClassIds) await db.delete(classes).where(eq(classes.id, id));
  await db.delete(rooms).where(like(rooms.name, `${PREFIX}%`));
}

before(async () => {
  await clearAttempts(EMAIL);
  await seedUser(EMAIL, PASS, { role: 'director' });
  auth = await loginAs(EMAIL, PASS);
  await cleanupRooms();
});
after(async () => {
  await cleanupRooms();
  await removeUser(EMAIL);
  await clearAttempts(EMAIL);
});

describe('GET /api/rooms e GET /api/levels', () => {
  it('rooms sem sessão → 401', async () => {
    const res = mkRes();
    await roomsHandler(mkReq('GET', undefined), res);
    assert.equal(res._status, 401);
  });

  it('rooms → 200 com as 13 salas semeadas', async () => {
    const res = mkRes();
    await roomsHandler(mkReq('GET', undefined, { cookie: auth.cookies }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.length >= 13, `esperava >=13, veio ${res._body.data.length}`);
    assert.ok(res._body.data.some((r: any) => r.name === 'Green Room'));
  });

  it('levels → 200 com 19 níveis em ordem', async () => {
    const res = mkRes();
    await levelsHandler(mkReq('GET', undefined, { cookie: auth.cookies }), res);
    assert.equal(res._status, 200);
    assert.ok(res._body.data.length >= 19);
    assert.equal(res._body.data[0].sortOrder, 1);
    assert.equal(res._body.data[0].key, 'fun-a');
  });
});

describe('POST /api/rooms', () => {
  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await roomsHandler(mkReq('POST', { name: `${PREFIX}Alpha`, color: '#123456' }, { cookie: auth.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('cor inválida → 400', async () => {
    const res = mkRes();
    await roomsHandler(mkReq('POST', { name: `${PREFIX}Beta`, color: 'vermelho' }, { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.fields.color);
  });

  it('nome acima de 40 → 400', async () => {
    const res = mkRes();
    await roomsHandler(mkReq('POST', { name: 'Z'.repeat(41), color: '#123456' }, { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 400);
  });

  it('criação válida → 201', async () => {
    const res = mkRes();
    await roomsHandler(mkReq('POST', { name: `${PREFIX}Alpha`, color: '#7CB342', teacherName: 'Prof Teste' }, { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 201);
    assert.equal(res._body.data.name, `${PREFIX}Alpha`);
    assert.equal(res._body.data.isActive, true);
    assert.equal(res._body.data.teacherName, 'Prof Teste');
  });

  it('nome duplicado (case-insensitive) → 409 ROOM_NAME_TAKEN', async () => {
    const res = mkRes();
    await roomsHandler(mkReq('POST', { name: `${PREFIX.toLowerCase()}alpha`, color: '#000000' }, { cookie: auth.cookies, csrf: auth.csrf }), res);
    assert.equal(res._status, 409);
    assert.equal(res._body.error.code, 'ROOM_NAME_TAKEN');
  });
});

describe('PATCH /api/rooms/:id', () => {
  let id = 0;
  before(async () => {
    const a = await db.insert(rooms).values({ name: `${PREFIX}Patch`, color: '#111111' }).returning();
    id = a[0].id;
    await db.insert(rooms).values({ name: `${PREFIX}Other`, color: '#222222' });
  });

  it('id inexistente → 404', async () => {
    const res = mkRes();
    await roomPatch(mkReq('PATCH', { name: `${PREFIX}X` }, { cookie: auth.cookies, csrf: auth.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await roomPatch(mkReq('PATCH', { name: `${PREFIX}X` }, { cookie: auth.cookies, query: { id: String(id) } }), res);
    assert.equal(res._status, 403);
  });

  it('renomeia + cor + teacher → 200', async () => {
    const res = mkRes();
    await roomPatch(mkReq('PATCH', { name: `${PREFIX}Renamed`, color: '#abcdef', teacherName: 'Nova Prof' }, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.name, `${PREFIX}Renamed`);
    assert.equal(res._body.data.color, '#abcdef');
    assert.equal(res._body.data.teacherName, 'Nova Prof');
  });

  it('renomear para nome de outra sala → 409', async () => {
    const res = mkRes();
    await roomPatch(mkReq('PATCH', { name: `${PREFIX}Other` }, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 409);
    assert.equal(res._body.error.code, 'ROOM_NAME_TAKEN');
  });

  it('limpa o professor (null) → 200', async () => {
    const res = mkRes();
    await roomPatch(mkReq('PATCH', { teacherName: null }, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(id) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.teacherName, null);
  });
});

describe('POST /api/rooms/:id/deactivate', () => {
  it('id inexistente → 404', async () => {
    const res = mkRes();
    await roomDeactivate(mkReq('POST', undefined, { cookie: auth.cookies, csrf: auth.csrf, query: { id: '99999999' } }), res);
    assert.equal(res._status, 404);
  });

  it('sala sem turmas → 200 e isActive false', async () => {
    const ins = await db.insert(rooms).values({ name: `${PREFIX}ToDeactivate`, color: '#333333' }).returning();
    const res = mkRes();
    await roomDeactivate(mkReq('POST', undefined, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(ins[0].id) } }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.isActive, false);
  });

  it('sala com turma → 422 ROOM_HAS_CLASSES', async () => {
    const ins = await db.insert(rooms).values({ name: `${PREFIX}WithClass`, color: '#444444' }).returning();
    const level = (await db.select().from(levels).limit(1))[0];
    const cls = await db.insert(classes).values({
      roomId: ins[0].id, dayPair: 'seg-qua', startTime: '8:30', levelId: level.id, period: '2099.1',
    }).returning();
    createdClassIds.push(cls[0].id);

    const res = mkRes();
    await roomDeactivate(mkReq('POST', undefined, { cookie: auth.cookies, csrf: auth.csrf, query: { id: String(ins[0].id) } }), res);
    assert.equal(res._status, 422);
    assert.equal(res._body.error.code, 'ROOM_HAS_CLASSES');
  });
});
