/* E2E de FLUXOS (parte 4): Comunicados (vazio barrado, público "pendentes" +
   canal Ambos, criar modelo), Contratos (abrir + baixar PDF = erro honesto
   NO_PDF) e Editor de site (editar texto inline). HEADED=1 abre o Chrome.
   Uso: node scripts/e2e-flows-4.mjs */
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
const annTotal = (page) => page.evaluate(() => fetch('/api/announcements?pageSize=1').then((r) => r.json()).then((j) => j.data?.total ?? 0));

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

  // ============== COMUNICADOS ==============
  await step('Comunicados: assunto/mensagem vazios é barrado', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`, { waitUntil: 'networkidle' });
    const before = await annTotal(page);
    await page.getByRole('textbox').first().fill(''); // limpa assunto
    await page.locator('textarea').first().fill(''); // limpa mensagem
    await page.getByRole('button', { name: 'Enviar e-mail' }).click();
    await page.waitForTimeout(800);
    assert((await annTotal(page)) === before, 'enviou comunicado vazio (deveria barrar)');
  });

  await step('Comunicados: público "Contratos pendentes" + canal Ambos', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`, { waitUntil: 'networkidle' });
    const before = await annTotal(page);
    await page.getByRole('textbox').first().fill('Aviso pendentes ' + Math.floor(Math.random() * 1e6));
    await page.locator('textarea').first().fill('Olá {{nome_responsavel}}, sobre o contrato.');
    await jclick(page.getByRole('button', { name: 'Para quem vai o comunicado' }));
    await page.waitForTimeout(300);
    await jclick(page.getByRole('option', { name: /contratos pendentes/i }));
    await page.getByRole('button', { name: 'Ambos' }).click(); // canal e-mail + WhatsApp
    await page.getByRole('button', { name: /enviar e-mail \+ whatsapp/i }).click();
    await page.waitForTimeout(1500);
    assert((await annTotal(page)) === before + 1, 'comunicado (pendentes/ambos) não foi enviado');
  });

  await step('Comunicados: criar modelo (aparece nos botões)', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`, { waitUntil: 'networkidle' });
    const nome = 'Modelo E2E ' + Math.floor(Math.random() * 1e6);
    await page.getByRole('button', { name: /gerenciar modelos/i }).click();
    await jclick(page.getByRole('dialog').getByRole('button', { name: /novo modelo/i }));
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder(/ex\.: reunião de pais/i).fill(nome);
    await dlg.getByPlaceholder(/assunto do e-mail/i).fill('Assunto do modelo E2E');
    await dlg.getByPlaceholder(/olá, /i).fill('Texto do modelo para {{nome_responsavel}}.');
    await jclick(dlg.getByRole('button', { name: /criar modelo/i }));
    await page.waitForTimeout(600);
    // fecha o gerenciador e confere o botão do modelo novo na composição
    const fechar = page.getByRole('dialog').getByRole('button', { name: /fechar/i });
    if (await fechar.count()) await jclick(fechar);
    await page.getByRole('button', { name: nome }).first().waitFor({ timeout: 6000 });
  });

  // ============== CONTRATOS ==============
  await step('Contratos: abrir contrato + baixar PDF (erro honesto NO_PDF)', async () => {
    await page.goto(`${BASE}/dashboard/contratos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Abrir' }).first().click();
    const dlg = page.getByRole('dialog');
    await dlg.getByText(/assinatura digital/i).waitFor({ timeout: 8000 }); // a timeline abriu
    await jclick(dlg.getByRole('button', { name: /baixar pdf/i }));
    await page.getByText(/ainda não gerado|não gerado/i).waitFor({ timeout: 8000 }); // toast honesto
  });

  // ============== EDITOR DE SITE ==============
  await step('Editor de site: editar um texto inline (muda ao vivo)', async () => {
    await page.goto(`${BASE}/dashboard/editor`, { waitUntil: 'networkidle' });
    const novo = 'Texto E2E ' + Math.floor(Math.random() * 1e6);
    await page.locator('.editable').first().click();
    const ta = page.locator('textarea').first();
    await ta.waitFor({ timeout: 6000 }); // painel lateral abriu
    await ta.fill(novo);
    await page.waitForTimeout(400);
    await page.getByText(novo).first().waitFor({ timeout: 6000 }); // mudou ao vivo na réplica
  });

  await browser.close();
  const bad = results.filter((r) => !r.ok);
  console.log('\n================ FLUXOS 4 ================');
  console.log(`fluxos: ${results.length} · falhas: ${bad.length}`);
  for (const r of bad) console.log(`✗ ${r.label}\n   ${r.err}`);
  if (!bad.length) console.log('todos os fluxos (Comunicados/Contratos/Editor) passaram. ✓');
  console.log('=========================================');
  process.exit(bad.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
