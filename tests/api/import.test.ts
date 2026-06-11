// Testes de integração da importação de planilha (DASHBOARD_API §4.7).
// Rodar: npm run test:api. Importa no período "2089.1" (único). Limpa no fim.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';
import dryRun from '../../api/enrollments/import/index';
import commit from '../../api/enrollments/import/commit';
import { db } from '../../server/db/client';
import { enrollments, students, responsibles, addresses, contracts, activityLog } from '../../server/db/schema';
import { mkReq, mkRes, seedUser, removeUser, clearAttempts, loginAs } from './_helpers';

const DIR = 'apitest-imp-dir@example.com';
const SUP = 'apitest-imp-sup@example.com';
const PASS = 'Senh@12345';
const PERIOD = '2089.1';

let dir: Awaited<ReturnType<typeof loginAs>>;
let sup: Awaited<ReturnType<typeof loginAs>>;
let dirId = 0;

const HEADER = [
  'Data/Hora', 'Nome Aluno 1', 'Data Nasc. Aluno 1', 'Idade Aluno 1', 'Nome Aluno 2', 'Data Nasc. Aluno 2', 'Idade Aluno 2',
  'Responsável Legal', 'CPF Responsável', 'Telefone Responsável', 'Email Responsável', 'Parentesco', 'Data Nasc. Responsável',
  'Segundo Responsável', 'Tel. Segundo Responsável', 'Parentesco 2º Resp.', 'CPF Segundo Responsável',
  'Responsável Financeiro', 'CPF Responsável Financeiro', 'CEP', 'Endereço Completo', 'Bairro', 'Cidade', 'Estado',
  'Formato Aula', 'Forma Pagamento', 'Autorização Mídia', 'Autorização Contrato', 'Horário Confirmado', 'Link PDF Contrato',
];
const COL = Object.fromEntries(HEADER.map((h, i) => [h, i]));

function row(over: Record<string, string>): string {
  const cells = new Array(HEADER.length).fill('');
  for (const [k, v] of Object.entries(over)) cells[COL[k]] = v;
  return cells.join(',');
}

const famA = {
  'Nome Aluno 1': 'Helena Importada Silva', 'Data Nasc. Aluno 1': '14/02/2018', 'Idade Aluno 1': '8',
  'Responsável Legal': 'Mariana Importada Silva', 'CPF Responsável': '111.444.777-35', 'Telefone Responsável': '(62) 99214-8870',
  'Email Responsável': 'mae@example.com', 'Parentesco': 'Mãe', 'Data Nasc. Responsável': '09/05/1989',
  'CEP': '74230-110', 'Endereço Completo': 'Rua T-55', 'Bairro': 'Setor Bueno', 'Cidade': 'Goiânia', 'Estado': 'GO',
  'Formato Aula': 'Na sede', 'Autorização Mídia': 'Sim', 'Autorização Contrato': 'Sim', 'Horário Confirmado': 'Sim',
};

// CSV: família A + duplicata de A (só muda Data/Hora e Link) + família B inválida (CPF ruim).
function buildCsv(): string {
  const a = row({ ...famA, 'Data/Hora': '01/06/2026 10:00', 'Link PDF Contrato': 'http://x/a.pdf' });
  const aDup = row({ ...famA, 'Data/Hora': '02/06/2026 11:00', 'Link PDF Contrato': 'http://x/b.pdf' });
  const b = row({
    'Data/Hora': '03/06/2026 09:00', 'Nome Aluno 1': 'Davi Invalido Souza', 'Data Nasc. Aluno 1': '10/10/2015',
    'Responsável Legal': 'Aline Invalido Souza', 'CPF Responsável': '123.456.789-00', 'Telefone Responsável': '(62) 99000-1111',
    'Email Responsável': 'pai@example.com', 'CEP': '74000-000', 'Endereço Completo': 'Rua Z', 'Bairro': 'Centro', 'Cidade': 'Goiânia', 'Estado': 'GO',
    'Formato Aula': 'Na sede', 'Autorização Contrato': 'Sim', 'Horário Confirmado': 'Sim',
  });
  return [HEADER.join(','), a, aDup, b].join('\n');
}

async function cleanup() {
  const er = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.period, PERIOD));
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
});
after(async () => {
  await cleanup();
  await db.delete(activityLog).where(eq(activityLog.actorId, dirId));
  await removeUser(DIR, SUP);
  await clearAttempts(DIR, SUP);
});

describe('POST /api/enrollments/import (dry-run)', () => {
  it('Supervisor → 403', async () => {
    const res = mkRes();
    await dryRun(mkReq('POST', { csv: buildCsv(), period: PERIOD }, { cookie: sup.cookies, csrf: sup.csrf }), res);
    assert.equal(res._status, 403);
  });

  it('sem CSRF → 403', async () => {
    const res = mkRes();
    await dryRun(mkReq('POST', { csv: buildCsv(), period: PERIOD }, { cookie: dir.cookies }), res);
    assert.equal(res._status, 403);
  });

  it('relatório: 1 a importar, 1 duplicata removida, 1 para revisão', async () => {
    const res = mkRes();
    await dryRun(mkReq('POST', { csv: buildCsv(), period: PERIOD }, { cookie: dir.cookies, csrf: dir.csrf }), res);
    assert.equal(res._status, 200);
    assert.equal(res._body.data.toImportCount, 1);
    assert.equal(res._body.data.duplicatesRemoved, 1);
    assert.equal(res._body.data.needsReview.length, 1);
    assert.ok(res._body.data.needsReview[0].reasons.some((r: string) => /CPF/.test(r)));
  });
});

describe('POST /api/enrollments/import/commit', () => {
  it('grava 1 família e é idempotente no reenvio', async () => {
    const r1 = mkRes();
    await commit(mkReq('POST', { csv: buildCsv(), period: PERIOD }, { cookie: dir.cookies, csrf: dir.csrf }), r1);
    assert.equal(r1._status, 200);
    assert.equal(r1._body.data.imported, 1);
    assert.equal(r1._body.data.needsReview, 1);

    // persistiu: 1 matrícula importada no período, com aluno e contrato
    const er = await db.select().from(enrollments).where(eq(enrollments.period, PERIOD));
    assert.equal(er.length, 1);
    assert.equal(er[0].source, 'import');

    // reenviar → nada novo (idempotente por submission_id)
    const r2 = mkRes();
    await commit(mkReq('POST', { csv: buildCsv(), period: PERIOD }, { cookie: dir.cookies, csrf: dir.csrf }), r2);
    assert.equal(r2._body.data.imported, 0);
    assert.equal(r2._body.data.skipped, 1);
    const er2 = await db.select().from(enrollments).where(eq(enrollments.period, PERIOD));
    assert.equal(er2.length, 1); // continua 1
  });
});
