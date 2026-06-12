/* Smoke E2E: loga na dashboard e ABRE cada tela contra o servidor local
   (scripts/dev-server.ts + banco local). Captura erros de runtime (pageerror)
   e console.error por rota. Objetivo: pegar telas que quebram ao renderizar com
   dados reais — o que tsc/build não pegam.
   Uso: node scripts/e2e-smoke.mjs   (precisa do dev-server na PORT 4321) */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4321';
const ADMIN = { email: 'admin@email.com', password: 'Senh@12345' };

// ruído conhecido que não é bug da tela. O 401 é o bootstrap de auth (GET
// /auth/me) numa aba sem sessão — esperado nas páginas públicas (login/reset),
// igual em produção.
const NOISE = [/favicon/i, /\/dashboard\.html/i, /Failed to load resource.*font/i, /net::ERR_/i, /status of 401/i];
const isNoise = (s) => NOISE.some((re) => re.test(s));

const results = [];

async function visit(page, label, url, after) {
  const errors = [];
  const onConsole = (m) => { if (m.type() === 'error' && !isNoise(m.text())) errors.push('console: ' + m.text()); };
  const onPageErr = (e) => errors.push('pageerror: ' + (e.message || String(e)));
  page.on('console', onConsole);
  page.on('pageerror', onPageErr);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(700); // deixa efeitos/loaders assentarem
    if (after) await after(page);
    await page.waitForTimeout(300);
  } catch (e) {
    errors.push('navegação: ' + (e.message || String(e)));
  }
  page.off('console', onConsole);
  page.off('pageerror', onPageErr);
  results.push({ label, url: url.replace(BASE, ''), errors });
  process.stdout.write(errors.length ? `  ✗ ${label} (${errors.length})\n` : `  ✓ ${label}\n`);
}

async function main() {
  const headed = !!process.env.HEADED; // HEADED=1 abre o Chrome visível
  const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 250 : 0 });
  const page = await browser.newPage();

  // login
  console.log('· login');
  await page.goto(`${BASE}/dashboard/entrar`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', ADMIN.email);
  await page.fill('input[type=password]', ADMIN.password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.endsWith('/entrar'), { timeout: 20000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ]);
  await page.waitForTimeout(1000);
  const loggedIn = !page.url().endsWith('/entrar');
  console.log(loggedIn ? '  ✓ login ok → ' + page.url().replace(BASE, '') : '  ✗ login FALHOU');
  if (!loggedIn) { await browser.close(); dump(); process.exit(1); }

  // descobre o id da matrícula semeada (pra abrir a ficha)
  const sid = await page.evaluate(async () => {
    const r = await fetch('/api/enrollments?pageSize=1').then((x) => x.json());
    return r?.data?.items?.[0]?.id ?? null;
  });

  console.log('· telas autenticadas');
  await visit(page, 'Visão geral', `${BASE}/dashboard/visao-geral`);
  await visit(page, 'Alunos', `${BASE}/dashboard/alunos`);
  if (sid) await visit(page, 'Ficha do aluno', `${BASE}/dashboard/alunos/${sid}`);
  await visit(page, 'Agenda', `${BASE}/dashboard/agenda`);
  await visit(page, 'Contratos', `${BASE}/dashboard/contratos`);
  await visit(page, 'Modelos de contrato', `${BASE}/dashboard/contratos/modelos`);
  await visit(page, 'Comunicados', `${BASE}/dashboard/comunicados`);
  await visit(page, 'Editor de site', `${BASE}/dashboard/editor`);
  await visit(page, 'Usuários', `${BASE}/dashboard/usuarios`);
  await visit(page, 'Atividade', `${BASE}/dashboard/atividade`);
  await visit(page, 'Configurações', `${BASE}/dashboard/configuracoes`);

  // interações-chave (abrir modais muito ligados)
  console.log('· interações');
  await visit(page, 'Alunos → abrir "Nova matrícula"', `${BASE}/dashboard/alunos`, async (p) => {
    const btn = p.getByRole('button', { name: /nova matrícula/i }).first();
    if (await btn.count()) { await btn.click(); await p.waitForTimeout(600); }
  });
  await visit(page, 'Comunicados → "Ver como chega"', `${BASE}/dashboard/comunicados`, async (p) => {
    const btn = p.getByRole('button', { name: /ver como chega/i }).first();
    if (await btn.count()) { await btn.click(); await p.waitForTimeout(600); }
  });

  // páginas públicas de reset
  console.log('· redefinir senha (público)');
  // contexto novo (sem sessão) pra simular link do e-mail
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await visit(p2, 'Redefinir (sem token)', `${BASE}/dashboard/redefinir`, async (p) => {
    await p.getByText(/link inválido ou expirado/i).first().waitFor({ timeout: 5000 });
  });
  await visit(p2, 'Redefinir (com token)', `${BASE}/dashboard/redefinir?token=fake-token-123`, async (p) => {
    await p.getByText(/ao menos 10 caracteres/i).first().waitFor({ timeout: 5000 }); // checklist da política
  });
  await ctx2.close();

  await browser.close();
  dump();
  const bad = results.filter((r) => r.errors.length);
  process.exit(bad.length ? 1 : 0);
}

function dump() {
  const bad = results.filter((r) => r.errors.length);
  console.log('\n================ RESULTADO ================');
  console.log(`telas verificadas: ${results.length} · com erro: ${bad.length}`);
  for (const r of bad) {
    console.log(`\n✗ ${r.label}  [${r.url}]`);
    for (const e of r.errors.slice(0, 6)) console.log('   - ' + e.slice(0, 300));
  }
  if (!bad.length) console.log('todas as telas abriram sem erro de runtime/console. ✓');
  console.log('==========================================');
}

main().catch((e) => { console.error(e); process.exit(1); });
