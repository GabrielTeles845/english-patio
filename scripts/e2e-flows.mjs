/* E2E de FLUXOS: dirige a UI de verdade (abre modais, preenche, envia) contra o
   servidor local + banco local, e confere que persiste. Complementa o smoke
   (que só abre as telas). Pré-req: dev-server na PORT 4321 + seed-e2e.
   Uso: node scripts/e2e-flows.mjs */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4321';
const ADMIN = { email: 'admin@email.com', password: 'Senh@12345' };

const results = [];
async function step(label, fn) {
  try {
    await fn();
    results.push({ label, ok: true });
    process.stdout.write(`  ✓ ${label}\n`);
  } catch (e) {
    results.push({ label, ok: false, err: (e.message || String(e)).slice(0, 240) });
    process.stdout.write(`  ✗ ${label}\n     ${(e.message || String(e)).slice(0, 200)}\n`);
  }
}

const enrollTotal = (page) => page.evaluate(async () => {
  const r = await fetch('/api/enrollments?pageSize=1').then((x) => x.json());
  return r?.data?.total ?? 0;
});
const annTotal = (page) => page.evaluate(async () => {
  const r = await fetch('/api/announcements?pageSize=1').then((x) => x.json());
  return r?.data?.total ?? 0;
});
function assert(cond, msg) { if (!cond) throw new Error(msg); }

/* clique via DOM (dispara o onClick real). Os botões dentro dos modais não passam
   na checagem de ESTABILIDADE do Playwright (o modal re-renderiza continuamente),
   então o clique de mouse "trava"; el.click() chama o mesmo handler e é confiável.
   Para verificar a FIAÇÃO (clicar→abrir/salvar→persistir) é o suficiente. */
async function jclick(loc) {
  const l = loc.first();
  await l.waitFor({ state: 'attached', timeout: 10000 });
  await l.evaluate((el) => el.click());
}

/* intercepta as 4 APIs de CEP (ViaCEP responde na hora; as outras abortam) —
   remove a dependência de rede que causava flake no autocomplete de endereço.
   74230-110 → GO (válido); 01001-000 → SP (fora de Goiás, p/ o teste negativo). */
async function routeCep(page) {
  await page.route('**viacep.com.br/**', (route) => {
    const sp = route.request().url().includes('01001');
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(sp
        ? { cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }
        : { cep: '74230-110', logradouro: 'Rua T-55', bairro: 'Setor Bueno', localidade: 'Goiânia', uf: 'GO' }),
    });
  });
  for (const d of ['brasilapi.com.br', 'opencep.com', 'apicep.com']) {
    await page.route(`**${d}/**`, (route) => route.abort());
  }
}

async function main() {
  // HEADED=1 abre o Chrome visível (com slowMo) pra assistir; senão, headless.
  const headed = !!process.env.HEADED;
  const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 400 : 0 });
  const page = await browser.newPage();
  await routeCep(page);
  page.on('pageerror', (e) => process.stdout.write(`     [pageerror] ${e.message}\n`));

  // login
  await page.goto(`${BASE}/dashboard/entrar`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', ADMIN.email);
  await page.fill('input[type=password]', ADMIN.password);
  await Promise.all([page.waitForURL((u) => !u.pathname.endsWith('/entrar'), { timeout: 20000 }).catch(() => {}), page.click('button[type=submit]')]);
  await page.waitForTimeout(800);
  assert(!page.url().endsWith('/entrar'), 'login falhou');
  console.log('login ok →', page.url().replace(BASE, ''));

  // 1) EDITAR matrícula (carrega ficha real + PATCH). Roda 1º, só a família semeada existe.
  await step('Editar matrícula: ⋮ → Editar dados → Salvar', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: 'Editar dados' }).click();
    const dlg = page.getByRole('dialog');
    const save = dlg.getByRole('button', { name: /salvar alterações/i });
    await save.waitFor({ timeout: 10000 }); // form carregou (saiu do loading)
    await jclick(save);
    await dlg.waitFor({ state: 'detached', timeout: 10000 }); // fechou = salvou
  });

  // 2) CONTRATO: marcar como enviado (status pending → sent)
  await step('Contrato: ⋮ → Marcar como enviado', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: /marcar como enviado/i }).click();
    await page.getByText('Enviado', { exact: false }).first().waitFor({ timeout: 10000 });
  });

  // 3) COMUNICADOS: escrever + enviar → aparece no histórico
  await step('Comunicados: escrever + enviar e-mail', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`, { waitUntil: 'networkidle' });
    const before = await annTotal(page);
    const marker = 'Aviso E2E ' + Math.floor(Math.random() * 1e6);
    await page.getByRole('textbox').first().fill(marker); // assunto
    await page.locator('textarea').first().fill('Mensagem de teste para {{nome_responsavel}}.');
    await page.getByRole('button', { name: 'Enviar e-mail' }).click();
    await page.getByText(marker).first().waitFor({ timeout: 10000 }); // entrou no histórico
    const after = await annTotal(page);
    assert(after === before + 1, `histórico não cresceu (${before}→${after})`);
  });

  // 4) IMPORTAR: planilha de exemplo → dry-run → commit → base cresce
  await step('Importar: planilha de exemplo → Importar', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    const before = await enrollTotal(page);
    await page.getByRole('button', { name: /importar planilha/i }).click();
    await page.getByRole('button', { name: /testar com uma planilha de exemplo/i }).click();
    const importBtn = page.getByRole('button', { name: /importar \d+ matrícula/i });
    await importBtn.waitFor({ timeout: 10000 });
    await importBtn.click();
    await page.waitForTimeout(1500);
    const after = await enrollTotal(page);
    assert(after > before, `base não cresceu na importação (${before}→${after})`);
  });

  // 5) NOVA MATRÍCULA: validação (vazio) + happy-path completo
  await step('Nova matrícula: submit vazio é barrado', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /nova matrícula/i }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('button', { name: /adicionar matrícula/i }).click();
    await page.waitForTimeout(500);
    assert(await dlg.isVisible(), 'modal fechou mesmo com form vazio (validação não barrou)');
  });
  await step('Nova matrícula: preencher tudo + salvar persiste', async () => {
    const before = await enrollTotal(page);
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder('Nome completo').first().fill('Joao Pedro Da Silva');
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(0).fill('10/05/2016'); // nasc. aluno
    await dlg.getByPlaceholder('Quem assina o contrato').fill('Maria Aparecida Souza');
    await dlg.getByPlaceholder('000.000.000-00').first().fill('52998224725'); // CPF válido
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(1).fill('15/03/1988'); // nasc. responsável
    await dlg.getByPlaceholder('email@exemplo.com').fill('maria.souza@example.com');
    await dlg.getByPlaceholder('(62) 9xxxx-xxxx').fill('62998887766');
    // Parentesco (CSelect) — obrigatório. O dropdown é portado pra fora do dialog,
    // então a opção é localizada no escopo da PÁGINA.
    await jclick(dlg.getByRole('button', { name: 'Parentesco', exact: true }));
    await page.waitForTimeout(350);
    await jclick(page.getByRole('option', { name: 'Mãe', exact: true }));
    await dlg.getByPlaceholder('00000-000').fill('74230110'); // CEP GO → dispara autocomplete
    await page.waitForTimeout(800); // CEP interceptado responde na hora
    await dlg.getByLabel('Rua / avenida').fill('Rua T-55');
    await dlg.getByPlaceholder('123 ou s/n').fill('180');
    await dlg.getByLabel('Bairro').fill('Setor Bueno');
    await dlg.getByLabel('Cidade').fill('Goiânia');
    // toggles obrigatórios: aceitar contrato + confirmar horário
    await jclick(dlg.getByText('A família leu e aceitou os termos do contrato'));
    await jclick(dlg.getByText('O horário das aulas foi confirmado com a família'));
    await jclick(dlg.getByRole('button', { name: /adicionar matrícula/i }));
    await dlg.waitFor({ state: 'detached', timeout: 12000 }); // fechou = criou
    const after = await enrollTotal(page);
    assert(after === before + 1, `não criou a matrícula (${before}→${after})`);
  });

  // 6) REDEFINIR SENHA com token falso → "link inválido" (POST /auth/reset)
  await step('Redefinir senha: token falso → link inválido', async () => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(`${BASE}/dashboard/redefinir?token=fake-e2e`, { waitUntil: 'networkidle' });
    await p.locator('input[type=password]').nth(0).fill('Senha@1234');
    await p.locator('input[type=password]').nth(1).fill('Senha@1234');
    await p.getByRole('button', { name: /redefinir senha/i }).click();
    await p.getByText(/link inválido ou expirado/i).waitFor({ timeout: 10000 });
    await ctx.close();
  });

  await browser.close();
  const bad = results.filter((r) => !r.ok);
  console.log('\n================ FLUXOS ================');
  console.log(`fluxos: ${results.length} · falhas: ${bad.length}`);
  for (const r of bad) console.log(`✗ ${r.label}\n   ${r.err}`);
  if (!bad.length) console.log('todos os fluxos de UI passaram (preencher/enviar/persistir). ✓');
  console.log('=======================================');
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
