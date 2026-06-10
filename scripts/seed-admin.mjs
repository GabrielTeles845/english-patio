// Bootstrap do 1º Diretor (DASHBOARD_PLAN §3/§6.10). Resolve o ovo-e-galinha:
// não há cadastro aberto, então a conta inicial é semeada. Idempotente
// (ON CONFLICT DO NOTHING). Rodar com: npm run db:seed
//
// Lê SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD do ambiente; default admin@email.com /
// Senh@12345 (10 chars, política VALIDACOES §8). Nasce com must_change_password=true.
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const email = (process.env.SEED_ADMIN_EMAIL || 'admin@email.com').trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || 'Senh@12345';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Use: node --env-file=.env scripts/seed-admin.mjs');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const passwordHash = await bcrypt.hash(password, 12);

const rows = await sql`
  INSERT INTO users (name, email, password_hash, role, must_change_password)
  VALUES ('Diretor', ${email}, ${passwordHash}, 'director', true)
  ON CONFLICT (email) DO NOTHING
  RETURNING id, email, role`;

if (rows.length) {
  console.log('1º Diretor semeado:', rows[0]);
  console.log('Senha provisória:', password, '(troca obrigatória no 1º acesso)');
} else {
  console.log('Já existe um usuário com este e-mail — nada a fazer:', email);
}
