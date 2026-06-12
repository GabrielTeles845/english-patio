/* Validações — cobertura ampla. A Nova matrícula junta TODOS os erros numa caixa
   ao enviar, então cada teste preenche tudo VÁLIDO e quebra UM campo para isolar
   a regra. Cobre também as validações de Usuários e da Conta. */
import { test, expect, type Page, type Locator } from '@playwright/test';
import { freshSession, fillValidEnrollment, jclick, BASE } from './helpers';

async function openNovaMatricula(page: Page): Promise<Locator> {
  await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /nova matrícula/i }).first().click();
  return page.getByRole('dialog');
}
async function submit(page: Page, dlg: Locator): Promise<void> {
  await jclick(dlg.getByRole('button', { name: /adicionar matrícula/i }));
  await page.waitForTimeout(500);
}

test.describe.serial('Validações — Nova matrícula', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('form vazio lista os campos obrigatórios', async () => {
    const dlg = await openNovaMatricula(page);
    await submit(page, dlg);
    await expect(dlg).toBeVisible();
    for (const re of [/nome e sobrenome/i, /CPF do responsável/i, /E-mail do responsável/i, /Telefone do responsável/i, /Parentesco do responsável/i, /aceitar os termos/i, /horário/i, /CEP/i]) {
      await expect(dlg).toContainText(re);
    }
  });

  test('aluno acima de 20 anos é barrado', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(0).fill('10/05/1990'); // > 20 anos
    await submit(page, dlg);
    await expect(dlg).toContainText(/até 20 anos/i);
  });

  test('aluno com data no futuro é barrado', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(0).fill('10/05/2099');
    await submit(page, dlg);
    await expect(dlg).toContainText(/até 20 anos|data de nascimento/i);
  });

  test('responsável menor de 18 anos é barrado', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('dd/mm/aaaa').nth(1).fill('10/05/2015'); // < 18
    await submit(page, dlg);
    await expect(dlg).toContainText(/18 anos ou mais/i);
  });

  test('nome do aluno sem sobrenome é barrado', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('Nome completo').first().fill('Joao');
    await submit(page, dlg);
    await expect(dlg).toContainText(/Aluno 1: informe nome e sobrenome/i);
  });

  test('CPF do responsável com dígito errado é barrado', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('000.000.000-00').first().fill('11111111111');
    await submit(page, dlg);
    await expect(dlg).toContainText(/CPF do responsável: dígitos inválidos/i);
  });

  test('e-mail do responsável inválido é barrado', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('email@exemplo.com').fill('email-invalido');
    await submit(page, dlg);
    await expect(dlg).toContainText(/E-mail do responsável inválido/i);
  });

  test('telefone sem o 9 é barrado', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('(62) 9xxxx-xxxx').fill('6212345678'); // 3º dígito ≠ 9
    await submit(page, dlg);
    await expect(dlg).toContainText(/Telefone do responsável/i);
  });

  test('CEP fora de Goiás é barrado', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('00000-000').fill('01001000'); // SP (interceptado)
    await page.waitForTimeout(900);
    await submit(page, dlg);
    await expect(dlg).toContainText(/fora de Goi[áa]s/i);
  });

  test('caracteres proibidos no nome são barrados', async () => {
    const dlg = await openNovaMatricula(page);
    await fillValidEnrollment(page, dlg);
    await dlg.getByPlaceholder('Nome completo').first().fill('Joao <Silva>');
    await submit(page, dlg);
    await expect(dlg).toContainText(/caracteres especiais/i);
  });
});

test.describe.serial('Validações — Usuários', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  async function openNovo(): Promise<Locator> {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /novo usuário/i }).click();
    return page.getByRole('dialog');
  }
  async function pickPapel(dlg: Locator): Promise<void> {
    await jclick(dlg.getByRole('button', { name: 'Papel do usuário' }));
    await page.waitForTimeout(300);
    await jclick(page.getByRole('option', { name: /secretaria/i }));
  }

  test('senha provisória fraca é barrada', async () => {
    const dlg = await openNovo();
    await dlg.getByPlaceholder('Nome completo').fill('Fulano de Tal E2E');
    await dlg.getByPlaceholder('email@exemplo.com').fill('e2e-pwfraca@example.com');
    await pickPapel(dlg);
    await dlg.locator('input[type=password]').first().fill('abc'); // fraca
    await jclick(dlg.getByRole('button', { name: /criar usuário/i }));
    await page.waitForTimeout(500);
    await expect(dlg).toContainText(/pelo menos 10 caracteres/i);
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });

  test('e-mail inválido é barrado', async () => {
    const dlg = await openNovo();
    await dlg.getByPlaceholder('Nome completo').fill('Fulano de Tal E2E');
    await dlg.getByPlaceholder('email@exemplo.com').fill('xyz'); // sem @
    await pickPapel(dlg);
    await dlg.locator('input[type=password]').first().fill('Provis@123');
    await jclick(dlg.getByRole('button', { name: /criar usuário/i }));
    await page.waitForTimeout(500);
    await expect(dlg).toContainText(/E-mail inválido/i);
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });

  test('nome sem sobrenome é barrado', async () => {
    const dlg = await openNovo();
    await dlg.getByPlaceholder('Nome completo').fill('Fulano'); // só 1 nome
    await dlg.getByPlaceholder('email@exemplo.com').fill('e2e-nome@example.com');
    await pickPapel(dlg);
    await dlg.locator('input[type=password]').first().fill('Provis@123');
    await jclick(dlg.getByRole('button', { name: /criar usuário/i }));
    await page.waitForTimeout(500);
    await expect(dlg).toContainText(/Informe nome e sobrenome/i);
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });
});

test.describe.serial('Validações — Conta (troca de senha)', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  async function openConta(): Promise<Locator> {
    await page.goto(`${BASE}/dashboard/visao-geral`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Minha conta' }).click();
    return page.getByRole('dialog');
  }

  test('nova senha fraca é barrada', async () => {
    const dlg = await openConta();
    const pw = dlg.locator('input[type=password]');
    await pw.nth(0).fill('Senh@12345');
    await pw.nth(1).fill('abc');
    await pw.nth(2).fill('abc');
    await jclick(dlg.getByRole('button', { name: /salvar/i }));
    await page.waitForTimeout(800);
    await expect(dlg).toContainText(/pelo menos 10 caracteres/i);
  });

  test('confirmação diferente é barrada', async () => {
    const dlg = await openConta();
    const pw = dlg.locator('input[type=password]');
    await pw.nth(0).fill('Senh@12345');
    await pw.nth(1).fill('NovaSenha@123');
    await pw.nth(2).fill('Outra@99999');
    await jclick(dlg.getByRole('button', { name: /salvar/i }));
    await page.waitForTimeout(800);
    await expect(dlg).toContainText(/confirmação não bate/i);
  });

  test('senha atual em branco ao trocar é barrada', async () => {
    const dlg = await openConta();
    const pw = dlg.locator('input[type=password]');
    await pw.nth(1).fill('NovaSenha@123');
    await pw.nth(2).fill('NovaSenha@123');
    await jclick(dlg.getByRole('button', { name: /salvar/i }));
    await page.waitForTimeout(800);
    await expect(dlg).toContainText(/senha atual/i);
  });
});
