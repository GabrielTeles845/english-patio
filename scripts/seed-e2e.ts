/* Seed mínimo para o E2E (banco LOCAL, .env.test): 1 Diretor para logar +
   1 matrícula completa (aluno + responsável + endereço + contrato) para as
   telas renderizarem com conteúdo. Idempotente.
   Uso: node --env-file=.env.test --import tsx scripts/seed-e2e.ts */
import { eq } from 'drizzle-orm';
import { db } from '../server/db/client';
import { users, enrollments, students, responsibles, addresses, contracts } from '../server/db/schema';
import { hashPassword } from '../server/lib/password';

// trava: este seed APAGA/insere dados — só roda em banco local.
const DBURL = process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(DBURL)) {
  console.error(`seed-e2e recusado: DATABASE_URL não é local (${DBURL.replace(/:[^:@]*@/, ':***@')}). Use .env.test.`);
  process.exit(1);
}

const ADMIN_EMAIL = 'admin@email.com';
const ADMIN_PASS = 'Senh@12345';
const SUB = 'e2e-seed-familia';

async function main() {
  // admin (Diretor)
  await db.delete(users).where(eq(users.email, ADMIN_EMAIL));
  await db.insert(users).values({
    name: 'Admin E2E', email: ADMIN_EMAIL, passwordHash: await hashPassword(ADMIN_PASS),
    role: 'director', mustChangePassword: false,
  });

  // matrícula de exemplo (limpa a anterior pelo submissionId)
  const old = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.submissionId, SUB));
  for (const e of old) {
    await db.delete(contracts).where(eq(contracts.enrollmentId, e.id));
    await db.delete(students).where(eq(students.enrollmentId, e.id));
    await db.delete(responsibles).where(eq(responsibles.enrollmentId, e.id));
    await db.delete(addresses).where(eq(addresses.enrollmentId, e.id));
    await db.delete(enrollments).where(eq(enrollments.id, e.id));
  }

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
