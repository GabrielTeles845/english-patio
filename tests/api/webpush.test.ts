// Testes do disparo de Web Push (server/lib/webpush.ts).
// No ambiente de teste NÃO há chaves VAPID, então sendPushToRoles deve ser um
// no-op gracioso: não lança e não mexe nas inscrições. (A entrega real exige um
// serviço de push externo e é coberta manualmente — ver MEMORY/docs.)
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { sendPushToRoles } from '../../server/lib/webpush';
import { db } from '../../server/db/client';
import { pushSubscriptions } from '../../server/db/schema';
import { seedUser, removeUser } from './_helpers';

const EMAIL = 'apitest-webpush@example.com';
const PASS = 'Senh@12345';
const EP = 'https://fcm.googleapis.com/fcm/send/apitest-webpush-endpoint';

describe('sendPushToRoles (sem VAPID no ambiente)', () => {
  let uid: number;
  before(async () => {
    uid = await seedUser(EMAIL, PASS, { role: 'director' });
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, EP));
    await db.insert(pushSubscriptions).values({ userId: uid, endpoint: EP, p256dh: 'p', auth: 'a' });
  });
  after(async () => {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, EP));
    await removeUser(EMAIL);
  });

  it('não lança quando o push está desligado', async () => {
    await assert.doesNotReject(() =>
      sendPushToRoles(['director', 'secretary'], { title: 'Teste', body: 'corpo', url: '/dashboard/' }),
    );
  });

  it('no-op não apaga inscrições existentes', async () => {
    await sendPushToRoles(['director'], { title: 'Teste' });
    const rows = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, EP));
    assert.equal(rows.length, 1);
  });
});
