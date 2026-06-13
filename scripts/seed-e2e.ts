/* Seed mínimo para o E2E (banco LOCAL, .env.test): 1 Diretor para logar +
   1 matrícula completa (aluno + responsável + endereço + contrato) para as
   telas renderizarem com conteúdo. Idempotente.
   Uso: node --env-file=.env.test --import tsx scripts/seed-e2e.ts */
import { eq, like } from 'drizzle-orm';
import { db } from '../server/db/client';
import { users, enrollments, students, responsibles, addresses, contracts, contractEvents, announcements, announcementRecipients, classes } from '../server/db/schema';
import { hashPassword } from '../server/lib/password';

// trava: este seed APAGA/insere dados — só roda em banco local.
const DBURL = process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(DBURL)) {
  console.error(`seed-e2e recusado: DATABASE_URL não é local (${DBURL.replace(/:[^:@]*@/, ':***@')}). Use .env.test.`);
  process.exit(1);
}

const ADMIN_EMAIL = 'admin@email.com';
const ADMIN_PASS = 'Senh@12345';
const ROLE_PASS = 'Senh@12345';
const SUB = 'e2e-seed-familia';

async function main() {
  // admin (Diretor) + limpa usuários de teste de runs anteriores
  await db.delete(users).where(like(users.email, 'e2e-%@example.com'));
  await db.delete(users).where(eq(users.email, ADMIN_EMAIL));
  await db.insert(users).values({
    name: 'Admin E2E', email: ADMIN_EMAIL, passwordHash: await hashPassword(ADMIN_PASS),
    role: 'director', mustChangePassword: false,
  });
  // Supervisor + Secretaria para os testes de permissão por papel (RBAC do front).
  await db.insert(users).values([
    {
      name: 'Supervisor E2E', email: 'e2e-supervisor@example.com',
      passwordHash: await hashPassword(ROLE_PASS), role: 'supervisor', mustChangePassword: false,
    },
    {
      name: 'Secretaria E2E', email: 'e2e-secretaria@example.com',
      passwordHash: await hashPassword(ROLE_PASS), role: 'secretary', mustChangePassword: false,
    },
  ]);

  // base limpa a cada run (banco LOCAL) → E2E determinístico (import/contagens).
  // ordem respeita as FKs.
  await db.delete(announcementRecipients);
  await db.delete(announcements);
  await db.delete(contractEvents);
  await db.delete(contracts);
  await db.delete(students);
  await db.delete(classes); // turmas criadas em runs anteriores (E2E determinístico)
  await db.delete(responsibles);
  await db.delete(addresses);
  await db.delete(enrollments);

  const e = await db.insert(enrollments).values({
    source: 'manual', submissionId: SUB, classFormat: 'sede', paymentMethod: 'boleto-6x',
    financialResponsibleType: 'legal', authorizationMedia: true, authorizationContract: true,
    scheduleConfirmed: true, period: '2026.2',
  }).returning();
  const id = e[0].id;
  await db.insert(students).values({ enrollmentId: id, name: 'Helena Duarte Lima', birthDate: '2018-02-14', isActive: true });
  await db.insert(responsibles).values({
    enrollmentId: id, type: 'legal', name: 'Mariana Duarte Lima', cpf: '04781233619',
    phone: '62992148870', email: 'mariana.duarte@example.com', relationship: 'Mãe', birthDate: '1989-05-09',
  });
  await db.insert(addresses).values({
    enrollmentId: id, cep: '74230110', street: 'Rua T-55', number: '180', neighborhood: 'Setor Bueno', city: 'Goiânia', state: 'GO',
  });
  await db.insert(contracts).values({ enrollmentId: id, status: 'pending' });

  console.log(`seed-e2e ok: admin=${ADMIN_EMAIL} / ${ADMIN_PASS} · matrícula #${id}`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
