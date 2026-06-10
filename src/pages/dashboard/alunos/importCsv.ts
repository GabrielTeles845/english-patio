import {
  badChars,
  onlyDigits,
  STUDENTS,
  validCPF,
  validEmail,
  type Student,
} from '../../../lib/dashboard/data';

/* Importação de planilha (CSV/XLSX) — port 1:1 do pipeline do preview
   (parseCSV l.4752, runImport l.4869). Regra central: linhas iguais em TUDO
   menos Data/Hora e Link do PDF são a mesma matrícula (o bug de voltar e
   re-gerar o contrato cria essas repetições) — fica só a primeira. */

export function parseCSV(text: string, sep: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}

export interface PendingStudent extends Student {
  _warn: string[];
  _skip?: boolean;
}

export interface ImportAnalysis {
  sourceName: string;
  linhas: number;        // linhas lidas (sem o cabeçalho)
  dups: number;          // repetidas removidas
  jaExiste: number;      // já estavam na dashboard
  incompletas: number;   // sem aluno ou responsável
  hasSinceCol: boolean;  // a planilha tem a coluna "Na escola desde"?
  pending: PendingStudent[];
}

export type ImportResult = { ok: true; data: ImportAnalysis } | { ok: false; error: string };

/* port de runImport (l.4869) — só a análise; quem aplica é applyImport na UI */
export function analyzeImport(rawText: string, sourceName: string): ImportResult {
  const text = rawText.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/)[0] || '';
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = parseCSV(text, sep);
  if (rows.length < 2) return { ok: false, error: 'A planilha está vazia (só o cabeçalho ou nada). Confira o arquivo.' };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => head.findIndex((h) => h.includes(name));
  const C = {
    ts: col('data/hora'), a1: col('nome aluno 1'), b1: col('nasc. aluno 1'), i1: col('idade aluno 1'),
    a2: col('nome aluno 2'), b2: col('nasc. aluno 2'), i2: col('idade aluno 2'),
    resp: col('responsável legal'), cpf: col('cpf responsável'), tel: col('telefone'), mail: col('email'),
    rel: head.findIndex((h) => h === 'parentesco'), rb: col('nasc. responsável'),
    sr: col('segundo responsável'), srt: col('tel. segundo'), srr: col('parentesco 2'),
    fin: col('responsável financeiro'), cep: col('cep'), end: col('endereço'), hood: col('bairro'),
    city: col('cidade'), uf: col('estado'), media: col('mídia'), pdf: col('link'), since: col('na escola desde'),
  };
  if (C.a1 < 0 || C.resp < 0)
    return { ok: false, error: 'Esse arquivo não parece ser a planilha de matrículas — faltam as colunas <b>Nome Aluno 1</b> e <b>Responsável Legal</b>.' };
  /* validação em camadas:
     1. linhas idênticas (fora Data/Hora e Link do PDF) somem sozinhas — é o bug de re-gerar o contrato;
     2. aluno+responsável que já estão na dashboard não duplicam;
     3. mesmo aluno+responsável DUAS vezes na planilha com dados diferentes → vale a linha mais
        recente, marcada para conferir;
     4. nome de aluno que já existe na dashboard com OUTRO responsável → possível homônimo (ou a
        mesma criança digitada de novo), marcado para conferir;
     5. CPF / telefone / data de nascimento fora do formato → marcado para conferir. */
  const norm = (v: unknown) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const keyOf = (r: string[]) => r.filter((_, i) => i !== C.ts && i !== C.pdf).map(norm).join('|');
  const existing = new Set(STUDENTS.flatMap((s) => s.kids.map((k) => norm(k.n) + '|' + norm(s.resp.n))));
  const ownerOf = new Map<string, string>();
  STUDENTS.forEach((s) => s.kids.forEach((k) => { const n = norm(k.n); if (!ownerOf.has(n)) ownerOf.set(n, s.resp.n); }));
  /* CPF → nome do responsável já na dashboard (mesmo CPF + outro nome = provável digitação errada;
     mesmo CPF + mesmo nome = família com matrículas separadas, segue normal) */
  const cpfOwnerMap = new Map<string, string>();
  STUDENTS.forEach((s) => { const c = onlyDigits(s.resp.cpf); if (c.length === 11 && !cpfOwnerMap.has(c)) cpfOwnerMap.set(c, s.resp.n); });
  const seen = new Set<string>(), byKid = new Map<string, string[]>();
  const nameWarns: Record<string, string[]> = {}, dataWarns: Record<string, string[]> = {};
  let dups = 0, jaExiste = 0, incompletas = 0;
  const val = (r: string[], i: number) => { const v = i >= 0 ? String(r[i] ?? '').trim() : ''; return v === '-' ? '' : v; };
  for (const r of rows.slice(1)) {
    const a1 = val(r, C.a1), resp = val(r, C.resp);
    if (!a1 || !resp) { incompletas++; continue; }
    const k = keyOf(r);
    if (seen.has(k)) { dups++; continue; }
    seen.add(k);
    const kid = norm(a1) + '|' + norm(resp);
    if (existing.has(kid)) { jaExiste++; continue; }
    if (byKid.has(kid)) {
      const w = (nameWarns[kid] = nameWarns[kid] || []);
      if (!w.some((x) => x.includes('mais de uma versão')))
        w.push('A planilha tem mais de uma versão desta matrícula com dados diferentes — ficou valendo a linha mais recente.');
    } else {
      const owner = ownerOf.get(norm(a1));
      if (owner)
        (nameWarns[kid] = nameWarns[kid] || []).push(
          `Já existe um aluno com esse nome na dashboard (responsável: ${owner}) — confira se não é a mesma criança cadastrada duas vezes.`,
        );
    }
    const issues: string[] = [];
    const cpf = val(r, C.cpf), tel = val(r, C.tel), b1 = val(r, C.b1), mail = val(r, C.mail), uf = val(r, C.uf);
    if (cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) issues.push(`CPF do responsável fora do padrão: “${cpf}”.`);
    else if (cpf && !validCPF(cpf)) issues.push(`CPF com dígitos verificadores inválidos: “${cpf}” — provável erro de digitação.`);
    else if (cpf) {
      const own = cpfOwnerMap.get(onlyDigits(cpf));
      if (own && norm(own) !== norm(resp)) issues.push(`Este CPF já está na dashboard no nome de ${own} — confira se o CPF ou o nome estão certos.`);
    }
    if (tel && !/^\(\d{2}\)\s?9?\d{4}-\d{4}$/.test(tel)) issues.push(`Telefone fora do padrão: “${tel}”.`);
    if (b1 && !/^\d{2}\/\d{2}\/\d{4}$/.test(b1)) issues.push(`Data de nascimento fora do padrão: “${b1}”.`);
    if (mail && !validEmail(mail)) issues.push(`E-mail fora do padrão: “${mail}”.`);
    if (uf && uf.toUpperCase() !== 'GO') issues.push(`Endereço fora de Goiás (“${uf}”) — o site só aceita matrículas de GO.`);
    if (badChars(a1) || badChars(resp)) issues.push('Nome do aluno ou do responsável com caracteres especiais — confira antes de importar.');
    if (issues.length) dataWarns[kid] = issues;
    else delete dataWarns[kid];
    byKid.set(kid, r); // a última linha do mesmo aluno+responsável vence
  }
  const novos = [...byKid.entries()];
  /* monta as matrículas — alunos importados chegam SEM turma e caem na fila "aguardando
     turma": a planilha não diz o dia nem o horário que a família escolheu, então alocar
     sozinho colocaria a criança num horário errado em silêncio. A equipe aloca pela Agenda. */
  const ageFrom = (b: string, fb: string): number => {
    const p = b.split('/').map(Number);
    return p[2] > 1900 ? 2026 - p[2] - (p[1] * 100 + p[0] > 603 ? 1 : 0) : parseInt(fb, 10) || 8;
  };
  const mkImpKid = (n: string, b: string, fb: string) => ({ n, b: b || '—', age: ageFrom(b, fb), tid: null });
  let nid = Math.max(...STUDENTS.map((s) => s.id)) + 1;
  const pending: PendingStudent[] = novos.map(([kid, r]) => {
    const kids = [mkImpKid(val(r, C.a1), val(r, C.b1), val(r, C.i1))];
    if (val(r, C.a2)) kids.push(mkImpKid(val(r, C.a2), val(r, C.b2), val(r, C.i2)));
    const ts = val(r, C.ts), dParts = ts.split(' ');
    const date = /^\d{2}\/\d{2}\/\d{4}$/.test(dParts[0]) ? dParts[0] : '03/06/2026';
    const hora = /^\d{1,2}:\d{2}/.test(dParts[1] || '') ? dParts[1].split(':').slice(0, 2).join('h') : '';
    const endRaw = val(r, C.end), ci = endRaw.indexOf(',');
    const o: PendingStudent = {
      id: nid++,
      kids,
      resp: { n: val(r, C.resp), cpf: val(r, C.cpf) || '—', phone: val(r, C.tel) || '—', email: val(r, C.mail) || '—', rel: val(r, C.rel) || 'Responsável', b: val(r, C.rb) || '—' },
      second: val(r, C.sr) ? { n: val(r, C.sr), phone: val(r, C.srt) || '—', rel: val(r, C.srr) || 'Responsável' } : null,
      fin: val(r, C.fin) || val(r, C.resp),
      addr: { cep: val(r, C.cep) || '—', street: ci > 0 ? endRaw.slice(0, ci) : endRaw || '—', num: ci > 0 ? endRaw.slice(ci + 1).trim() : '', comp: '', bairro: val(r, C.hood) || '—', city: val(r, C.city) || 'Goiânia', uf: val(r, C.uf) || 'GO' },
      pay: 'Boleto',
      status: 'signed',
      media: norm(val(r, C.media)) !== 'não',
      date,
      hora,
      _warn: [...(nameWarns[kid] || []), ...(dataWarns[kid] || [])],
    };
    /* "na escola desde" só vem se a planilha tiver a coluna — senão fica em branco p/ preencher depois */
    const sv = val(r, C.since);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(sv)) o.since = sv;
    return o;
  });
  return {
    ok: true,
    data: { sourceName, linhas: rows.length - 1, dups, jaExiste, incompletas, hasSinceCol: C.since >= 0, pending },
  };
}
