/* Máquina de status do contrato pelo menu ⋮ de Alunos. As transições válidas
   dependem do status atual (DASHBOARD_PLAN / regra do CLAUDE.md): o menu só pode
   oferecer o que faz sentido. Aqui percorremos pending → enviado → assinado e
   conferimos que as opções aparecem/desaparecem na ordem certa. Serial. */
import { test, expect, type Page } from '@playwright/test';
import { freshSession, jclick, BASE } from './helpers';

test.describe.serial('Contrato — transições de status pelo menu ⋮', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  const openMenu = async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
  };

  test('pending oferece "Marcar como enviado" E "Marcar como assinado"', async () => {
    await openMenu();
    await expect(page.getByRole('menuitem', { name: 'Marcar como enviado' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('menuitem', { name: 'Marcar como assinado' })).toBeVisible();
    // executa a 1ª transição
    await jclick(page.getByRole('menuitem', { name: 'Marcar como enviado' }));
    await expect(page.getByText('Enviado', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('enviado NÃO oferece mais "Marcar como enviado", só "Marcar como assinado"', async () => {
    await openMenu();
    await expect(page.getByRole('menuitem', { name: 'Marcar como assinado' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('menuitem', { name: 'Marcar como enviado' }), 'não repete a transição já feita').toHaveCount(0);
    await jclick(page.getByRole('menuitem', { name: 'Marcar como assinado' }));
    await expect(page.getByText('Assinado', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('assinado é caminho encerrado: nenhuma transição de status no menu', async () => {
    await openMenu();
    // o menu ainda tem ações de aluno (desligar/excluir), mas nada de status.
    await expect(page.getByRole('menuitem', { name: /marcar como|reenviar contrato/i })).toHaveCount(0);
  });
});
