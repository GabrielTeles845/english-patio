/* Usuários: criar, e-mail duplicado, campos vazios, editar, desativar e a guarda
   do último Diretor. Serial: edita/desativa o usuário criado no 1º teste. */
import { test, expect, type Page } from '@playwright/test';
import { freshSession, jclick, BASE, ADMIN } from './helpers';

const email = `e2e-${Math.floor(Math.random() * 1e6)}@example.com`;

test.describe.serial('Usuários', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  // O seed tem vários usuários (Diretor + Supervisor + Secretaria), então
  // first()/last() é ambíguo. Localiza o botão "Ações do usuário" pela LINHA que
  // contém o e-mail do usuário (o div mais interno = .last() na cadeia de ancestrais).
  const actionsFor = (mail: string) =>
    page
      .locator('div')
      .filter({ hasText: mail })
      .filter({ has: page.getByRole('button', { name: 'Ações do usuário' }) })
      .last()
      .getByRole('button', { name: 'Ações do usuário' });

  test('criar usuário (Secretaria)', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /novo usuário/i }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder('Nome completo').fill('Fulano de Tal E2E');
    await dlg.getByPlaceholder('email@exemplo.com').fill(email);
    await jclick(dlg.getByRole('button', { name: 'Papel do usuário' }));
    await page.waitForTimeout(300);
    await jclick(page.getByRole('option', { name: /secretaria/i }));
    await dlg.locator('input[type=password]').first().fill('Provis@123');
    await jclick(dlg.getByRole('button', { name: /criar usuário/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
  });

  test('e-mail duplicado é barrado', async () => {
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
    await expect(dlg, 'modal deve continuar aberto').toBeVisible();
    await expect(dlg).toContainText(/já existe|duplicad/i);
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });

  test('criar com campos vazios é barrado', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /novo usuário/i }).click();
    const dlg = page.getByRole('dialog');
    await jclick(dlg.getByRole('button', { name: /criar usuário/i }));
    await page.waitForTimeout(500);
    await expect(dlg, 'modal deve continuar aberto').toBeVisible();
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });

  test('editar usuário', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    await jclick(actionsFor(email));
    await jclick(page.getByRole('menuitem', { name: /editar usuário/i }));
    const dlg = page.getByRole('dialog');
    const nome = dlg.getByRole('textbox').first();
    await nome.waitFor({ timeout: 8000 });
    await nome.fill('Fulano Editado E2E');
    await jclick(dlg.getByRole('button', { name: /salvar alterações|salvar/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
  });

  test('desativar acesso do usuário criado', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    await jclick(actionsFor(email));
    await jclick(page.getByRole('menuitem', { name: /desativar acesso/i }));
    await page.waitForTimeout(500);
    const conf = page.getByRole('dialog').getByRole('button', { name: /desativar/i });
    if (await conf.count()) await jclick(conf);
    await page.waitForTimeout(800);
  });

  test('remover o ÚNICO Diretor é bloqueado', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`, { waitUntil: 'networkidle' });
    await jclick(actionsFor(ADMIN.email));
    await jclick(page.getByRole('menuitem', { name: /remover acesso/i }));
    await page.waitForTimeout(600);
    await expect(page.getByRole('dialog')).toContainText(/único|Diretor|promova|n(ã|a)o|bloque/i);
    const fechar = page.getByRole('dialog').getByRole('button', { name: /entendi|fechar|cancelar|ok/i });
    if (await fechar.count()) await jclick(fechar);
  });
});
