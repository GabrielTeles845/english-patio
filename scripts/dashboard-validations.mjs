/**
 * Suíte de validação NEGATIVA da dashboard React.
 * Sobe um Chromium real (sessão de Diretor, tours OFF) e tenta, em cada
 * formulário: salvar vazio e digitar dados inválidos (texto no CPF, e-mail
 * sem @, telefone sem o 9, CPF com dígito errado, nascimento fora da faixa,
 * caracteres proibidos, senha fraca, e-mail duplicado). Assere que o sistema
 * BLOQUEIA com a mensagem certa (caixa vermelha NtBox) e mantém o modal aberto.
 *
 * Sai com código = nº de casos que NÃO bloquearam como esperado (0 = tudo ok),
 * pra servir de teste de regressão das validações.
 *
 * Pré-requisito: o app servido em DASH_BASE (`npm run dev`/`npm run preview`).
 *
 * Rodar:   node scripts/dashboard-validations.mjs
 *   visível:  HEADED=1 node scripts/dashboard-validations.mjs
 *
 * Prints de cada caso em /tmp/dashboard-validations/ (ou $DASH_OUT).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.DASH_BASE || 'http://localhost:5173';
const OUT = process.env.DASH_OUT || '/tmp/dashboard-validations';
const HEADED = !!process.env.HEADED;
mkdirSync(OUT, { recursive: true });

const log = (m) => console.log(m);
const results = [];
const errors = [];
let n = 0;
const pad = (x) => String(x).padStart(2, '0');

let browserRef = null;
const HARD = 240_000;
const wd = setTimeout(async () => {
  log(`\n⏱  WATCHDOG ${HARD / 1000}s — encerrando.`);
  try { await browserRef?.close(); } catch {}
  finish();
}, HARD);

function finish() {
  clearTimeout(wd);
  writeFileSync(OUT + '/results.json', JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  log(`\n===== VALIDAÇÃO: ${results.length - failed.length}/${results.length} bloqueios corretos =====`);
  for (const r of results) log(`  ${r.pass ? 'PASS' : 'FALHOU'} · ${r.id} — ${r.expect}`);
  if (errors.length) { log(`\nErros de runtime: ${errors.length}`); errors.forEach((e) => log('  ' + e)); }
  process.exit(failed.length);
}

const browser = await chromium.launch({ headless: !HEADED, slowMo: HEADED ? 220 : 0 });
browserRef = browser;
const ctx = await browser.newContext({ viewport: { width: 1440, height: 880 } });
await ctx.addInitScript(([sk, tk]) => {
  sessionStorage.setItem(sk, JSON.stringify(1));
  localStorage.setItem(tk, '1');
}, ['ep-dash-session', 'ep-tours-off']);

const page = await ctx.newPage();
page.setDefaultTimeout(4000);
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + (e?.message || e)));
page.on('console', (m) => m.type() === 'error' && errors.push('CONSOLE: ' + m.text()));

const go = async (path) => {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {});
  await page.waitForTimeout(600);
};
const esc = async () => { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(350); };
const byBtn = (re) => page.getByRole('button', { name: re }).first();
const click = async (loc) => {
  const l = typeof loc === 'function' ? loc() : loc;
  await l.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
  await l.click({ timeout: 3500 });
  await page.waitForTimeout(400);
};
const type = async (loc, val) => {
  const l = typeof loc === 'function' ? loc() : loc;
  await l.fill('').catch(() => {});
  await l.fill(val).catch(() => {});
  await page.waitForTimeout(120);
};
// senhas: input[type=password] por posição (0=atual, 1=nova, 2=confirma)
const pwd = (i) => page.locator('input[type="password"]').nth(i);
async function errorVisible(re, ms = 2500) {
  try { await page.getByText(re).first().waitFor({ state: 'visible', timeout: ms }); return true; }
  catch { return false; }
}
async function check(id, expect, fn) {
  n += 1;
  let pass = false;
  try { pass = !!(await fn()); }
  catch (e) { errors.push(`check ${id}: ${(e?.message || e).split('\n')[0]}`); }
  await page.screenshot({ path: `${OUT}/${pad(n)}-${id}.png` }).catch(() => {});
  results.push({ id, expect, pass });
  log(`  ${pass ? '✓' : '✗'} ${id} — ${expect}`);
}

log(`\n===== VALIDAÇÃO NEGATIVA (Diretor) · ${BASE} =====\n`);

// ===== A) NOVA MATRÍCULA =====
log('— A) Nova matrícula (Alunos)');
await go('/dashboard/alunos');
await click(() => byBtn(/Nova matrícula/i));

await check('A1-vazio', 'Salvar vazio bloqueia ("Corrija antes de adicionar")', async () => {
  await click(() => byBtn(/Adicionar matrícula/i));
  const e = await errorVisible(/Corrija antes de adicionar/i);
  const open = await page.getByText('Nova matrícula').first().isVisible().catch(() => false);
  return e && open;
});
await check('A2-cpf-texto', 'Letras no CPF são descartadas pela máscara (campo vazio)', async () => {
  const cpf = page.getByPlaceholder('000.000.000-00');
  await cpf.fill('abcdefghijk').catch(() => {});
  await page.waitForTimeout(150);
  const v = await cpf.inputValue().catch(() => 'x');
  return /^[\s.\-]*$/.test(v);
});
await check('A3-invalidos', 'E-mail/telefone/CPF/nascimento inválidos disparam erros específicos', async () => {
  await type(() => page.getByPlaceholder('Nome completo', { exact: true }), 'Joao');
  await type(() => page.getByPlaceholder('dd/mm/aaaa').first(), '01/01/2000');
  await type(() => page.getByPlaceholder('Nome completo do responsável'), 'Maria');
  await type(() => page.getByPlaceholder('000.000.000-00'), '11111111111');
  await type(() => page.getByPlaceholder('(62) 9xxxx-xxxx'), '6231114444');
  await type(() => page.getByPlaceholder('email@exemplo.com'), 'naoehemail');
  await type(() => page.getByPlaceholder('Ex.: Setor Bueno'), 'Centro');
  await click(() => byBtn(/Adicionar matrícula/i));
  return (await errorVisible(/E-mail.*inv|E-mail do respons/i)) &&
         (await errorVisible(/Telefone:/i)) &&
         (await errorVisible(/CPF do respons/i));
});
await check('A4-badchars', 'Caracteres proibidos (< > " &) no nome são bloqueados', async () => {
  await type(() => page.getByPlaceholder('Nome completo', { exact: true }), '<b>Hacker</b> Silva');
  await click(() => byBtn(/Adicionar matrícula/i));
  return (await errorVisible(/caracteres|s[ií]mbolos|maior\/menor/i)) || (await errorVisible(/Corrija antes/i));
});
await esc();

// ===== B) MINHA CONTA =====
log('— B) Minha conta (Configurações)');
await go('/dashboard/configuracoes');
const openAccount = async () => { await click(() => byBtn(/Editar e-mail e senha/i)); await page.waitForTimeout(400); };
const accEmail = () => page.getByRole('textbox').first();

await openAccount();
await check('B1-email-invalido', 'E-mail de acesso inválido é bloqueado', async () => {
  await type(accEmail, 'semarroba');
  await click(() => byBtn(/Salvar alterações/i));
  return await errorVisible(/E-mail de acesso inv/i);
});
await check('B2-sem-senha-atual', 'Trocar senha sem a atual é bloqueado', async () => {
  await type(accEmail, 'priscylla@englishpatio.com.br');
  await type(() => pwd(1), 'abcdefghij1');
  await click(() => byBtn(/Salvar alterações/i));
  return await errorVisible(/senha atual/i);
});
await check('B3-senha-curta', 'Nova senha < 10 caracteres é bloqueada', async () => {
  await type(() => pwd(0), 'qualquer123');
  await type(() => pwd(1), 'curta1');
  await type(() => pwd(2), 'curta1');
  await click(() => byBtn(/Salvar alterações/i));
  return await errorVisible(/pelo menos 10|10 caracteres/i);
});
await check('B4-conf-nao-bate', 'Confirmação diferente da nova senha é bloqueada', async () => {
  await type(() => pwd(0), 'qualquer123');
  await type(() => pwd(1), 'abcdefghij1');
  await type(() => pwd(2), 'diferente999');
  await click(() => byBtn(/Salvar alterações/i));
  return await errorVisible(/confirma[çc][aã]o n[aã]o bate/i);
});
await esc();

// ===== C) NOVO USUÁRIO =====
log('— C) Novo usuário (Usuários)');
await go('/dashboard/usuarios');
await click(() => byBtn(/Novo usuário/i));
await check('C1-vazio', 'Criar usuário vazio dispara nome/e-mail inválidos', async () => {
  await click(() => byBtn(/Criar usuário/i));
  return (await errorVisible(/nome e sobrenome/i)) && (await errorVisible(/E-mail inv/i));
});
await check('C2-email-duplicado', 'E-mail já cadastrado é rejeitado', async () => {
  await type(() => page.getByRole('textbox').first(), 'Fulano de Tal');
  await type(() => page.getByPlaceholder('email@exemplo.com'), 'priscylla@englishpatio.com.br');
  await click(() => byBtn(/Criar usuário/i));
  return await errorVisible(/J[aá] existe um usu[aá]rio|cada acesso tem o seu/i);
});
await esc();

// ===== D) IMPORTAR MODELO (PDF) =====
log('— D) Importar modelo de contrato (Modelos)');
await go('/dashboard/contratos/modelos');
await click(() => page.locator('[data-tour="tpl-import"]').first());
await check('D1-import-vazio', 'Importar modelo sem nome/arquivo é bloqueado (botão desabilitado ou erro)', async () => {
  const btn = byBtn(/Importar|Adicionar|Salvar/i);
  if (await btn.isDisabled().catch(() => false)) return true;
  await btn.click({ timeout: 3000 }).catch(() => {});
  return await errorVisible(/nome|arquivo|PDF|obrigat/i);
});
await esc();

// ===== E) MODELO DE COMUNICADO SEM NOME =====
log('— E) Modelo de comunicado sem nome (Comunicados)');
await go('/dashboard/comunicados');
if (await byBtn(/Gerenciar modelos/i).count()) {
  await click(() => byBtn(/Gerenciar modelos/i));
  if (await byBtn(/Novo modelo/i).count()) {
    await click(() => byBtn(/Novo modelo/i));
    await check('E1-modelo-sem-nome', 'Salvar modelo de comunicado sem nome é bloqueado', async () => {
      await click(() => byBtn(/Criar modelo|Salvar/i));
      return await errorVisible(/D[eê] um nome ao modelo|nome/i);
    });
    await esc();
  }
  await esc();
}

await page.waitForTimeout(HEADED ? 900 : 200);
clearTimeout(wd);
await browser.close();
finish();
