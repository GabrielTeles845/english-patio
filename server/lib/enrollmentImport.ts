// Importação de planilha de matrículas (DASHBOARD_API §4.7). Parser CSV + mapeamento
// das colunas do docs/planilha-modelo-matriculas.csv + validação (VALIDACOES §1–6)
// + dedup idempotente. XLSX é convertido para CSV antes (conversão deferida).
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { enrollments, students, responsibles, addresses, contracts, contractTemplates } from '../db/schema';
import {
  isFullName, isValidCPF, isValidPhone, isValidEmail, isValidCEP,
  isValidStudentBirthDate, isValidResponsibleBirthDate, brDateToISO, onlyDigits,
} from './validators';

// ── Parser CSV (RFC 4180: aspas, vírgula e quebra dentro de célula) ────────────
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', inQ = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\r') { /* ignora */ }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export interface ImportFamily {
  submissionId: string;
  rowIndex: number;
  studentNames: string[];
  students: { name: string; birthDate: string }[];
  legal: { name: string; cpf: string; phone: string; email: string; relationship: string; birthDate: string | null };
  second: { name: string; phone: string; relationship: string; cpf: string | null } | null;
  financialType: 'legal' | 'other';
  financialName: string;
  financialCpf: string;
  address: { cep: string; street: string; number: string; neighborhood: string; city: string; state: string };
  classFormat: 'sede' | 'domicilio';
  authMedia: boolean;
  pdfUrl: string;
}

const truthy = (v: string) => /^(sim|x|true|1|verdadeiro)$/i.test(v.trim());

function mapRow(cells: string[], idx: Record<string, number>, rowIndex: number): ImportFamily {
  const g = (label: string) => (cells[idx[label]] ?? '').trim();
  const kids: { name: string; birthDate: string }[] = [];
  const s1 = g('Nome Aluno 1');
  if (s1) kids.push({ name: s1, birthDate: brDateToISO(g('Data Nasc. Aluno 1')) ?? g('Data Nasc. Aluno 1') });
  const s2 = g('Nome Aluno 2');
  if (s2) kids.push({ name: s2, birthDate: brDateToISO(g('Data Nasc. Aluno 2')) ?? g('Data Nasc. Aluno 2') });

  const finName = g('Responsável Financeiro');
  const legalName = g('Responsável Legal');
  const isOther = finName !== '' && finName.toLowerCase() !== legalName.toLowerCase();

  const fmt = g('Formato Aula').toLowerCase();
  const family: ImportFamily = {
    submissionId: '',
    rowIndex,
    studentNames: kids.map((k) => k.name),
    students: kids,
    legal: {
      name: legalName, cpf: onlyDigits(g('CPF Responsável')), phone: onlyDigits(g('Telefone Responsável')),
      email: g('Email Responsável'), relationship: g('Parentesco'),
      birthDate: brDateToISO(g('Data Nasc. Responsável')),
    },
    second: g('Segundo Responsável')
      ? { name: g('Segundo Responsável'), phone: onlyDigits(g('Tel. Segundo Responsável')), relationship: g('Parentesco 2º Resp.'), cpf: g('CPF Segundo Responsável') ? onlyDigits(g('CPF Segundo Responsável')) : null }
      : null,
    financialType: isOther ? 'other' : 'legal',
    financialName: finName,
    financialCpf: onlyDigits(g('CPF Responsável Financeiro')),
    address: {
      cep: onlyDigits(g('CEP')), street: g('Endereço Completo'), number: 'S/N',
      neighborhood: g('Bairro'), city: g('Cidade'), state: g('Estado').trim().toUpperCase(),
    },
    classFormat: fmt.includes('domic') ? 'domicilio' : 'sede',
    authMedia: truthy(g('Autorização Mídia')),
    pdfUrl: g('Link PDF Contrato'),
  };

  // submission_id idempotente: hash do conteúdo, EXCETO Data/Hora e Link PDF (§4.7).
  const fingerprint = JSON.stringify({
    students: family.students, legalCpf: family.legal.cpf, legalName: family.legal.name,
    cep: family.address.cep, street: family.address.street,
  });
  family.submissionId = `import-${createHash('sha256').update(fingerprint).digest('hex').slice(0, 32)}`;
  return family;
}

// Reasons (PT) por que uma família precisa de revisão; vazio = ok.
export function reviewReasons(f: ImportFamily): string[] {
  const r: string[] = [];
  if (!f.students.length) r.push('Sem aluno');
  f.students.forEach((s, i) => {
    if (!isFullName(s.name)) r.push(`Nome do aluno ${i + 1} incompleto`);
    if (!isValidStudentBirthDate(deISO(s.birthDate))) r.push(`Data de nascimento do aluno ${i + 1} inválida`);
  });
  if (!isFullName(f.legal.name)) r.push('Nome do responsável incompleto');
  if (!isValidCPF(f.legal.cpf)) r.push('CPF do responsável inválido');
  if (!isValidPhone(f.legal.phone)) r.push('Telefone do responsável inválido');
  if (!isValidEmail(f.legal.email)) r.push('E-mail do responsável inválido');
  if (f.legal.birthDate && !isValidResponsibleBirthDate(deISO(f.legal.birthDate))) r.push('Data de nascimento do responsável inválida');
  if (f.second && f.second.phone && !isValidPhone(f.second.phone)) r.push('Telefone do segundo responsável inválido');
  if (f.financialType === 'other') {
    if (!isFullName(f.financialName)) r.push('Nome do responsável financeiro incompleto');
    if (!isValidCPF(f.financialCpf)) r.push('CPF do responsável financeiro inválido');
  }
  if (!isValidCEP(f.address.cep)) r.push('CEP inválido');
  if (f.address.state !== 'GO') r.push('Endereço fora de Goiás');
  if (!f.address.neighborhood || !f.address.city) r.push('Endereço incompleto');
  return r;
}

// converte 'aaaa-mm-dd' de volta p/ 'dd/mm/aaaa' (os validadores BR esperam isso).
function deISO(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export interface ImportAnalysis {
  unique: ImportFamily[]; // 1 por submissionId (1ª ocorrência), válidas e inválidas
  duplicatesRemoved: number;
  needsReview: { rowIndex: number; submissionId: string; reasons: string[] }[];
  ok: ImportFamily[]; // unique sem reasons
}

export function analyzeImport(csv: string): ImportAnalysis {
  const rows = parseCSV(csv);
  if (rows.length < 2) return { unique: [], duplicatesRemoved: 0, needsReview: [], ok: [] };
  const header = rows[0].map((h) => h.trim());
  const idx: Record<string, number> = {};
  header.forEach((h, i) => { idx[h] = i; });

  const seen = new Set<string>();
  const unique: ImportFamily[] = [];
  let duplicatesRemoved = 0;
  for (let i = 1; i < rows.length; i++) {
    const fam = mapRow(rows[i], idx, i);
    if (seen.has(fam.submissionId)) { duplicatesRemoved++; continue; }
    seen.add(fam.submissionId);
    unique.push(fam);
  }
  const needsReview: ImportAnalysis['needsReview'] = [];
  const ok: ImportFamily[] = [];
  for (const f of unique) {
    const reasons = reviewReasons(f);
    if (reasons.length) needsReview.push({ rowIndex: f.rowIndex, submissionId: f.submissionId, reasons });
    else ok.push(f);
  }
  return { unique, duplicatesRemoved, needsReview, ok };
}

// Persiste uma família importada (idempotente: chamador garante submissionId novo).
export async function insertImportedFamily(f: ImportFamily, period: string): Promise<number> {
  const tpl = await db.select({ id: contractTemplates.id }).from(contractTemplates).where(eq(contractTemplates.isActive, true)).limit(1);
  const e = await db.insert(enrollments).values({
    source: 'import', submissionId: f.submissionId, classFormat: f.classFormat, paymentMethod: 'boleto-6x',
    financialResponsibleType: f.financialType, authorizationMedia: f.authMedia,
    authorizationContract: true, scheduleConfirmed: true, period,
  }).returning();
  const id = e[0].id;
  await db.insert(students).values(f.students.map((s) => ({ enrollmentId: id, name: s.name.trim(), birthDate: s.birthDate })));
  const resps: (typeof responsibles.$inferInsert)[] = [{
    enrollmentId: id, type: 'legal', name: f.legal.name.trim(), cpf: f.legal.cpf, phone: f.legal.phone,
    email: f.legal.email.trim(), relationship: f.legal.relationship.trim() || null, birthDate: f.legal.birthDate,
  }];
  if (f.second) resps.push({ enrollmentId: id, type: 'second', name: f.second.name.trim(), phone: f.second.phone || null, relationship: f.second.relationship.trim() || null, cpf: f.second.cpf });
  if (f.financialType === 'other') resps.push({ enrollmentId: id, type: 'financial', name: f.financialName.trim(), cpf: f.financialCpf });
  await db.insert(responsibles).values(resps);
  await db.insert(addresses).values({
    enrollmentId: id, cep: f.address.cep, street: f.address.street.trim() || 'Importado', number: f.address.number,
    neighborhood: f.address.neighborhood.trim() || 'Importado', city: f.address.city.trim() || 'Goiânia', state: 'GO',
  });
  await db.insert(contracts).values({ enrollmentId: id, status: 'pending', templateId: tpl.length ? tpl[0].id : null });
  return id;
}
