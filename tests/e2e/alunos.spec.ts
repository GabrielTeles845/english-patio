/* Alunos & matrículas: editar a família semeada, status de contrato, e Nova
   matrícula (vazio barrado, dados errados, happy-path) + importação. Serial:
   os testes compartilham a mesma sessão e dependem da ordem. */
import { test, expect, type Page } from '@playwright/test';
import { freshSession, jclick, BASE, enrollTotal } from './helpers';

test.describe.serial('Alunos & matrículas', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('cabeçalho concorda no singular com 1 aluno / 1 matrícula', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    // estado fresco tem 1 família/1 aluno → singular, não "1 alunos em 1 matrículas".
    await expect(page.getByText('1 aluno em 1 matrícula ativa')).toBeVisible({ timeout: 8000 });
  });

  test('editar matrícula (⋮ → Editar dados → Salvar persiste)', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: 'Editar dados' }).click();
    const dlg = page.getByRole('dialog');
    const save = dlg.getByRole('button', { name: /salvar alterações/i });
    await save.waitFor({ timeout: 10000 }); // form carregou (saiu do loading)
    await jclick(save);
    await dlg.waitFor({ state: 'detached', timeout: 10000 }); // fechou = salvou
  });

  test('contrato: ⋮ → Marcar como enviado', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: /marcar como enviado/i }).click();
    await expect(page.getByText('Enviado', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('nova matrícula: submit vazio é barrado', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /nova matrícula/i }).first().click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('button', { name: /adicionar matrícula/i }).click();
    await page.waitForTimeout(500);
    await expect(dlg, 'modal deve continuar aberto com form vazio').toBeVisible();
  });

  test('nova matrícula: dados errados mostram os erros certos', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /nova matrícula/i }).first().click();
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder('Nome completo').first().fill('Joao'); // nome incompleto
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(0).fill('10/05/2016');
    await dlg.getByPlaceholder('Quem assina o contrato').fill('Maria Souza');
    await dlg.getByPlaceholder('000.000.000-00').first().fill('11111111111'); // CPF inválido
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(1).fill('15/03/1990');
    await dlg.getByPlaceholder('email@exemplo.com').fill('email-invalido');
    await dlg.getByPlaceholder('(62) 9xxxx-xxxx').fill('6212345');
    await jclick(dlg.getByRole('button', { name: 'Parentesco', exact: true }));
    await page.waitForTimeout(300);
    await jclick(page.getByRole('option', { name: 'Mãe', exact: true }));
    await dlg.getByPlaceholder('00000-000').fill('01001000'); // CEP de SP → fora de GO
    await page.waitForTimeout(800);
    await jclick(dlg.getByRole('button', { name: /adicionar matrícula/i }));
    await page.waitForTimeout(600);
    await expect(dlg, 'modal deve continuar aberto com dados inválidos').toBeVisible();
    await expect(dlg).toContainText(/nome e sobrenome|CPF|inv[áa]lid/i);
    await expect(dlg).toContainText(/Goi[áa]s|GO/);
  });

  test('nova matrícula: preencher tudo certo persiste (+1)', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    const before = await enrollTotal(page);
    await page.getByRole('button', { name: /nova matrícula/i }).first().click();
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder('Nome completo').first().fill('Joao Pedro Da Silva');
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(0).fill('10/05/2016');
    await dlg.getByPlaceholder('Quem assina o contrato').fill('Maria Aparecida Souza');
    await dlg.getByPlaceholder('000.000.000-00').first().fill('52998224725'); // CPF válido
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(1).fill('15/03/1988');
    await dlg.getByPlaceholder('email@exemplo.com').fill('maria.souza@example.com');
    await dlg.getByPlaceholder('(62) 9xxxx-xxxx').fill('62998887766');
    await jclick(dlg.getByRole('button', { name: 'Parentesco', exact: true }));
    await page.waitForTimeout(350);
    await jclick(page.getByRole('option', { name: 'Mãe', exact: true }));
    await dlg.getByPlaceholder('00000-000').fill('74230110'); // CEP GO
    await page.waitForTimeout(800);
    await dlg.getByLabel('Rua / avenida').fill('Rua T-55');
    await dlg.getByPlaceholder('123 ou s/n').fill('180');
    await dlg.getByLabel('Bairro').fill('Setor Bueno');
    await dlg.getByLabel('Cidade').fill('Goiânia');
    await jclick(dlg.getByText('A família leu e aceitou os termos do contrato'));
    await jclick(dlg.getByText('O horário das aulas foi confirmado com a família'));
    await jclick(dlg.getByRole('button', { name: /adicionar matrícula/i }));
    await dlg.waitFor({ state: 'detached', timeout: 12000 }); // fechou = criou
    expect(await enrollTotal(page), 'a base deve ter +1 matrícula').toBe(before + 1);
  });

  test('importar planilha de exemplo (a base cresce)', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    const before = await enrollTotal(page);
    await page.getByRole('button', { name: /importar planilha/i }).click();
    await page.getByRole('button', { name: /testar com uma planilha de exemplo/i }).click();
    const importBtn = page.getByRole('button', { name: /importar \d+ matrícula/i });
    await importBtn.waitFor({ timeout: 10000 });
    await importBtn.click();
    await page.waitForTimeout(1500);
    expect(await enrollTotal(page), 'a base deve crescer após importar').toBeGreaterThan(before);
  });
});
