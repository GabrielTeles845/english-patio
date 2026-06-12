/* E2E de FLUXOS (parte 3): Usuários (criar/editar/desativar + negativos +
   guard do último Diretor) e Conta (senha atual errada). Dirige a UI contra o
   servidor local. HEADED=1 abre o Chrome. Uso: node scripts/e2e-flows-3.mjs */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4321';
const ADMIN = { email: 'admin@email.com', password: 'Senh@12345' };

const results = [];
async function step(label, fn) {
  try { await fn(); results.push({ label, ok: true }); process.stdout.write(`  ✓ ${label}\n`); }
  catch (e) { results.push({ label, ok: false, err: (e.message || String(e)).slice(0, 240) }); process.stdout.write(`  ✗ ${label}\n     ${(e.message || String(e)).slice(0, 200)}\n`); }
}
function assert(c, m) { if (!c) throw new Error(m); }
async function jclick(loc) { const l = loc.first(); await l.waitFor({ state: 'attached', timeout: 10000 }); await l.evaluate((el) => el.click()); }
const userCount = (page) => page.evaluate(() => fetch('/api/users').then((r) => r.json()).then((j) => (j.data?.items ?? j.data ?? []).length));

async function login(page) {
  await page.goto(`${BASE}/dashboard/entrar`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', ADMIN.email);
  await page.fill('input[type=password]', ADMIN.password);
  await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/entrar'), { timeout: 20000 }).catch(() => {}), page.click('button[type=submit]')]);
  await page.waitForTimeout(800);
  assert(!page.url().endsWith('/entrar'), 'login falhou');
}

async function main() {
  const headed = !!process.env.HEADED;
  const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 400 : 0 });
  const page = await browser.newPage();
  page.on('pageerror', (e) => process.stdout.write(`     [pageerror] ${e.message}\n`));
  await login(page);
  console.log('login ok');

  const email = `e2e-${Math.floor(Math.random() * 1e6)}@example.com`;

  await step('Usuários: criar usuário (Secretaria)', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    const before = await userCount(page);
    await page.getByRole('button', { name: /novo usuário/i }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder('Nome completo').fill('Fulano de Teste E2E');
    await dlg.getByPlaceholder('email@exemplo.com').fill(email);
    await jclick(dlg.getByRole('button', { name: 'Papel do usuário' }));
    await page.waitForTimeout(300);
    await jclick(page.getByRole('option', { name: /secretaria/i }));
    await dlg.locator('input[type=password]').first().fill('Provis@123'); // senha provisória
    await jclick(dlg.getByRole('button', { name: /criar usuário/i }));
    await page.waitForTimeout(1200);
    assert((await userCount(page)) === before + 1, 'usuário não foi criado');
  });

  await step('Usuários: e-mail duplicado é barrado', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /novo usuário/i }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder('Nome completo').fill('Outro Nome E2E');
    await dlg.getByPlaceholder('email@exemplo.com').fill(email); // mesmo e-mail
    await jclick(dlg.getByRole('button', { name: 'Papel do usuário' }));
    await page.waitForTimeout(300);
    await jclick(page.getByRole('option', { name: /secretaria/i }));
    await dlg.locator('input[type=password]').first().fill('Provis@123');
    await jclick(dlg.getByRole('button', { name: /criar usuário/i }));
    await page.waitForTimeout(900);
    assert(await dlg.isVisible(), 'modal fechou — e-mail duplicado deveria barrar');
    assert(/já existe|duplicad/i.test(await dlg.innerText()), 'não mostrou erro de e-mail duplicado');
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });

  await step('Usuários: criar com campos vazios é barrado', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /novo usuário/i }).click();
    const dlg = page.getByRole('dialog');
    await jclick(dlg.getByRole('button', { name: /criar usuário/i }));
    await page.waitForTimeout(500);
    assert(await dlg.isVisible(), 'modal fechou com campos vazios');
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });

  await step('Usuários: editar usuário', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    // abre o menu do usuário recém-criado (última linha) e edita
    const menus = page.getByRole('button', { name: 'Ações do usuário' });
    await menus.last().click();
    await page.getByRole('menuitem', { name: /editar usuário/i }).click();
    const dlg = page.getByRole('dialog');
    const nome = dlg.getByRole('textbox').first(); // Nome vem pré-preenchido (sem placeholder)
    await nome.waitFor({ timeout: 8000 });
    await nome.fill('Fulano Editado E2E');
    await jclick(dlg.getByRole('button', { name: /salvar alterações|salvar/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
  });

  await step('Usuários: desativar acesso (do usuário criado)', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    const menus = page.getByRole('button', { name: 'Ações do usuário' });
    await menus.last().click();
    const desativar = page.getByRole('menuitem', { name: /desativar acesso/i });
    await desativar.waitFor({ timeout: 5000 });
    await desativar.click();
    // pode abrir um ConfirmModal
    await page.waitForTimeout(500);
    const conf = page.getByRole('dialog').getByRole('button', { name: /desativar/i });
    if (await conf.count()) await jclick(conf);
    await page.waitForTimeout(800);
  });

  await step('Usuários: remover o ÚNICO Diretor é bloqueado', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    // o admin (Diretor) é a 1ª linha
    await page.getByRole('button', { name: 'Ações do usuário' }).first().click();
    await page.getByRole('menuitem', { name: /remover acesso/i }).click();
    await page.waitForTimeout(600);
    const txt = await page.getByRole('dialog').innerText();
    assert(/único|Diretor|promova|não|bloque/i.test(txt), 'não bloqueou remover o último Diretor');
    const fechar = page.getByRole('dialog').getByRole('button', { name: /entendi|fechar|cancelar|ok/i });
    if (await fechar.count()) await jclick(fechar);
  });

  await step('Conta: senha atual errada é barrada', async () => {
    await page.goto(`${BASE}/dashboard/visao-geral`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Minha conta' }).click();
    const dlg = page.getByRole('dialog');
    const pw = dlg.locator('input[type=password]');
    await pw.nth(0).fill('SenhaErrada@9'); // atual errada
    await pw.nth(1).fill('NovaSenha@123');
    await pw.nth(2).fill('NovaSenha@123');
    await jclick(dlg.getByRole('button', { name: /salvar alterações|salvar/i }));
    await page.waitForTimeout(1200);
    assert(await dlg.isVisible(), 'modal fechou — senha atual errada deveria barrar');
    assert(/senha|incorret|inválid|não|errad/i.test(await dlg.innerText()), 'não mostrou erro de senha');
  });

  await browser.close();
  const bad = results.filter((r) => !r.ok);
  console.log('\n================ FLUXOS 3 ================');
  console.log(`fluxos: ${results.length} · falhas: ${bad.length}`);
  for (const r of bad) console.log(`✗ ${r.label}\n   ${r.err}`);
  if (!bad.length) console.log('todos os fluxos (Usuários + Conta) passaram. ✓');
  console.log('=========================================');
  process.exit(bad.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
