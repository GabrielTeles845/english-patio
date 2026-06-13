/* Conta (troca de senha), Contratos (abrir + baixar PDF) e Editor de site
   (edição inline). Independentes — cada um com sua sessão limpa. */
import { test, expect, type Page } from '@playwright/test';
import { freshSession, jclick, BASE } from './helpers';

test.describe.serial('Conta · Contratos · Editor', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('conta: senha atual errada é barrada', async () => {
    await page.goto(`${BASE}/dashboard/visao-geral`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Minha conta' }).click();
    const dlg = page.getByRole('dialog');
    const pw = dlg.locator('input[type=password]');
    await pw.nth(0).fill('SenhaErrada@9');
    await pw.nth(1).fill('NovaSenha@123');
    await pw.nth(2).fill('NovaSenha@123');
    await jclick(dlg.getByRole('button', { name: /salvar alterações|salvar/i }));
    await page.waitForTimeout(1200);
    await expect(dlg, 'modal deve continuar aberto').toBeVisible();
    await expect(dlg).toContainText(/senha|incorret|inv[áa]lid|n(ã|a)o|errad/i);
    const cancelar = dlg.getByRole('button', { name: /cancelar|fechar/i });
    if (await cancelar.count()) await jclick(cancelar);
  });

  test('contratos: abrir contrato + baixar PDF (erro honesto NO_PDF)', async () => {
    await page.goto(`${BASE}/dashboard/contratos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Abrir' }).first().click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText(/assinatura digital/i)).toBeVisible({ timeout: 8000 });
    await jclick(dlg.getByRole('button', { name: /baixar pdf/i }));
    await expect(page.getByText(/ainda não gerado|não gerado/i)).toBeVisible({ timeout: 8000 });
  });

  test('editor de site: editar um texto inline (muda ao vivo)', async () => {
    await page.goto(`${BASE}/dashboard/editor`, { waitUntil: 'networkidle' });
    const novo = 'Texto E2E ' + Math.floor(Math.random() * 1e6);
    await page.locator('.editable').first().click();
    const ta = page.locator('textarea').first();
    await ta.waitFor({ timeout: 6000 });
    await ta.fill(novo);
    await page.waitForTimeout(400);
    await expect(page.getByText(novo).first()).toBeVisible({ timeout: 6000 });
  });
});

test.describe.serial('Contrato assinado não oferece WhatsApp', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('ao marcar como assinado, o botão verde some da tela Contratos', async () => {
    // marca o único contrato (pending) como assinado pelo menu ⋮ de Alunos
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: /marcar como assinado/i }).click();
    await expect(page.getByText('Assinado', { exact: false }).first()).toBeVisible({ timeout: 10000 });
    // na tela Contratos, contrato assinado é caminho encerrado: sem botão de WhatsApp
    // (clicar levaria a /remind, que o backend recusa com 422 ALREADY_SIGNED).
    await page.goto(`${BASE}/dashboard/contratos`, { waitUntil: 'networkidle' });
    await expect(page.getByText(/assinado/i).first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('button[data-tip$="no WhatsApp"]'),
      'contrato assinado não pode ter botão verde de WhatsApp',
    ).toHaveCount(0);
  });
});
