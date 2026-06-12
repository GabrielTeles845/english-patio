/* E2E de FLUXOS (parte 2): Agenda (CRUD de turma/sala), mover de turma,
   desligar/reativar/excluir aluno, e Nova matrícula com DADOS ERRADOS.
   Dirige a UI contra o servidor local + banco local. Pré-req: dev-server :4321.
   HEADED=1 abre o Chrome visível. Uso: node scripts/e2e-flows-2.mjs */
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

/* intercepta as APIs de CEP (sem rede): 74230-110→GO, 01001-000→SP (fora de GO). */
async function routeCep(page) {
  await page.route('**viacep.com.br/**', (route) => {
    const sp = route.request().url().includes('01001');
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sp
      ? { cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }
      : { cep: '74230-110', logradouro: 'Rua T-55', bairro: 'Setor Bueno', localidade: 'Goiânia', uf: 'GO' }) });
  });
  for (const d of ['brasilapi.com.br', 'opencep.com', 'apicep.com']) await page.route(`**${d}/**`, (route) => route.abort());
}

const api = (page, path) => page.evaluate((p) => fetch(p).then((r) => r.json()).then((j) => j.data), path);
const classCount = async (page) => (await api(page, '/api/classes'))?.length ?? 0;
const roomCount = async (page) => (await api(page, '/api/rooms'))?.length ?? 0;
const enrollItems = async (page) => (await api(page, '/api/enrollments?pageSize=50'))?.items ?? [];

/* escolhe a i-ésima opção de um CSelect (sem aria-label): abre o gatilho .cs e
   clica a opção (renderizada em portal, no escopo da página). */
async function pickCs(page, dlg, index, optionName) {
  await jclick(dlg.locator('.cs > button').nth(index));
  await page.waitForTimeout(250);
  const opt = optionName ? page.getByRole('option', { name: optionName, exact: false }) : page.getByRole('option');
  await jclick(opt);
  await page.waitForTimeout(150);
}

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
  await routeCep(page);
  page.on('pageerror', (e) => process.stdout.write(`     [pageerror] ${e.message}\n`));
  await login(page);
  console.log('login ok');

  // ================= AGENDA: CRUD =================
  await step('Agenda: criar turma (sala/dias/horário/nível/vagas)', async () => {
    await page.goto(`${BASE}/dashboard/agenda`, { waitUntil: 'networkidle' });
    const before = await classCount(page);
    await page.getByRole('button', { name: /nova turma/i }).click();
    const dlg = page.getByRole('dialog');
    await pickCs(page, dlg, 0); // Sala (1ª opção)
    await pickCs(page, dlg, 1, 'Seg/Qua'); // Dias
    await pickCs(page, dlg, 2, '8:30'); // Horário
    await pickCs(page, dlg, 3); // Nível (1ª)
    await dlg.locator('input').first().fill('7'); // Vagas
    await jclick(dlg.getByRole('button', { name: /criar turma/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
    assert((await classCount(page)) === before + 1, 'turma não foi criada');
  });

  await step('Agenda: criar turma em slot ocupado é barrado', async () => {
    await page.goto(`${BASE}/dashboard/agenda`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /nova turma/i }).click();
    const dlg = page.getByRole('dialog');
    await pickCs(page, dlg, 0); // mesma sala
    await pickCs(page, dlg, 1, 'Seg/Qua');
    await pickCs(page, dlg, 2, '8:30'); // mesmo horário → slot ocupado
    await pickCs(page, dlg, 3);
    await dlg.locator('input').first().fill('7');
    await jclick(dlg.getByRole('button', { name: /criar turma/i }));
    await page.waitForTimeout(1000);
    assert(await dlg.isVisible(), 'modal fechou — slot ocupado deveria barrar');
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });

  await step('Agenda: criar sala', async () => {
    await page.goto(`${BASE}/dashboard/agenda`, { waitUntil: 'networkidle' });
    const before = await roomCount(page);
    await page.getByRole('button', { name: /salas & teachers/i }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder(/nome da sala nova/i).fill('Sala E2E ' + Math.floor(Math.random() * 1e6)); // nome único (nome de sala é único)
    await jclick(dlg.getByRole('button', { name: /adicionar|criar|^\+/i }));
    await page.waitForTimeout(1200);
    assert((await roomCount(page)) > before, 'sala não foi criada');
    await jclick(dlg.getByRole('button', { name: /fechar/i }));
  });

  // ================= ALUNOS: mover / desligar / reativar / excluir =================
  await step('Aluno: mover/alocar em turma (na ficha)', async () => {
    const items = await enrollItems(page);
    const sid = items[0].id;
    await page.goto(`${BASE}/dashboard/alunos/${sid}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^(Alocar|Mover)$/ }).first().click();
    const dlg = page.getByRole('dialog');
    // escolhe a 1ª turma da lista (botão de turma) e confirma
    await jclick(dlg.locator('button').filter({ hasText: /Seg\/Qua|Ter\/Qui/ }).first());
    await page.waitForTimeout(200);
    await jclick(dlg.getByRole('button', { name: /^(Mover|Alocar|Confirmar)/ }));
    await page.waitForTimeout(1200);
    const det = await api(page, `/api/enrollments/${sid}`);
    assert(det.students[0].classId != null, 'aluno não ficou com turma');
  });

  await step('Aluno: desligar (com motivo)', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: /desligar aluno/i }).click();
    const dlg = page.getByRole('dialog');
    await jclick(dlg.getByText('Concluiu o curso'));
    await jclick(dlg.getByRole('button', { name: /desligar aluno/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
  });

  await step('Aluno: reativar', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    // o filtro pode esconder inativos; o menu da 1ª linha deve ter "Reativar"
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    const re = page.getByRole('menuitem', { name: /reativar aluno/i });
    if (await re.count()) { await re.click(); await page.waitForTimeout(1000); }
    else { await page.keyboard.press('Escape'); throw new Error('opção Reativar não apareceu no menu'); }
  });

  await step('Aluno: excluir matrícula', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    const before = (await enrollItems(page)).length;
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: /excluir matrícula/i }).click();
    const dlg = page.getByRole('dialog');
    await jclick(dlg.getByText(/entendi que a exclusão é definitiva/i)); // arma a exclusão
    await jclick(dlg.getByRole('button', { name: /excluir de vez/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
    assert((await enrollItems(page)).length === before - 1, 'matrícula não foi excluída');
  });

  // ================= NEGATIVO: Nova matrícula com dados errados =================
  await step('Nova matrícula: dados errados mostram os erros certos', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /nova matrícula/i }).first().click();
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder('Nome completo').first().fill('Joao'); // nome incompleto
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(0).fill('10/05/2016');
    await dlg.getByPlaceholder('Quem assina o contrato').fill('Maria Souza');
    await dlg.getByPlaceholder('000.000.000-00').first().fill('11111111111'); // CPF inválido
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(1).fill('15/03/1990');
    await dlg.getByPlaceholder('email@exemplo.com').fill('email-invalido'); // e-mail inválido
    await dlg.getByPlaceholder('(62) 9xxxx-xxxx').fill('6212345'); // telefone inválido
    await jclick(dlg.getByRole('button', { name: 'Parentesco', exact: true }));
    await page.waitForTimeout(300);
    await jclick(page.getByRole('option', { name: 'Mãe', exact: true }));
    await dlg.getByPlaceholder('00000-000').fill('01001000'); // CEP de SP → fora de GO (interceptado)
    await page.waitForTimeout(800);
    await jclick(dlg.getByRole('button', { name: /adicionar matrícula/i }));
    await page.waitForTimeout(600);
    assert(await dlg.isVisible(), 'modal fechou com dados inválidos (deveria barrar)');
    const txt = await dlg.innerText();
    assert(/nome e sobrenome|CPF|inválid/i.test(txt), 'não mostrou erro de nome/CPF');
    assert(/Goiás|GO/i.test(txt), 'não barrou CEP fora de Goiás');
  });

  await browser.close();
  const bad = results.filter((r) => !r.ok);
  console.log('\n================ FLUXOS 2 ================');
  console.log(`fluxos: ${results.length} · falhas: ${bad.length}`);
  for (const r of bad) console.log(`✗ ${r.label}\n   ${r.err}`);
  if (!bad.length) console.log('todos os fluxos (Agenda/mover/desligar/excluir/negativo) passaram. ✓');
  console.log('=========================================');
  process.exit(bad.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
