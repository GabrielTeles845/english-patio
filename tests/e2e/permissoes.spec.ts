/* Permissões por papel (RBAC do front). A suíte normal roda como Diretor; aqui
   logamos como Supervisor e Secretaria e confirmamos que as telas/ações fora da
   matriz (DASHBOARD_PLAN §4) são bloqueadas: rota proibida redireciona pra home
   do papel, e a lista de Alunos é só-leitura para o Supervisor. */
import { test, expect, type Page } from '@playwright/test';
import { freshSessionAs, BASE, SUPERVISOR, SECRETARIA } from './helpers';

test.describe.serial('Permissões — Supervisor', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSessionAs(browser, SUPERVISOR);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('entra direto na Agenda (home do Supervisor)', async () => {
    await expect(page).toHaveURL(/\/dashboard\/agenda$/, { timeout: 8000 });
  });

  test('Visão geral é proibida → redireciona pra Agenda', async () => {
    await page.goto(`${BASE}/dashboard/visao-geral`);
    await expect(page).toHaveURL(/\/dashboard\/agenda$/, { timeout: 8000 });
  });

  test('Usuários é proibida → redireciona pra Agenda', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`);
    await expect(page).toHaveURL(/\/dashboard\/agenda$/, { timeout: 8000 });
  });

  test('Comunicados é proibida → redireciona pra Agenda', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`);
    await expect(page).toHaveURL(/\/dashboard\/agenda$/, { timeout: 8000 });
  });

  test('Alunos é só-leitura: sem Nova matrícula nem Importar planilha', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Alunos' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /nova matrícula/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /importar planilha/i })).toHaveCount(0);
  });
});

test.describe.serial('Permissões — Secretaria', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSessionAs(browser, SECRETARIA);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('entra direto em Alunos (home da Secretaria)', async () => {
    await expect(page).toHaveURL(/\/dashboard\/alunos$/, { timeout: 8000 });
  });

  test('Visão geral é proibida → redireciona pra Alunos', async () => {
    await page.goto(`${BASE}/dashboard/visao-geral`);
    await expect(page).toHaveURL(/\/dashboard\/alunos$/, { timeout: 8000 });
  });

  test('Usuários é proibida → redireciona pra Alunos', async () => {
    await page.goto(`${BASE}/dashboard/usuarios`);
    await expect(page).toHaveURL(/\/dashboard\/alunos$/, { timeout: 8000 });
  });

  test('Comunicados é proibida → redireciona pra Alunos', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`);
    await expect(page).toHaveURL(/\/dashboard\/alunos$/, { timeout: 8000 });
  });

  test('Contratos é permitida (Secretaria envia contratos)', async () => {
    await page.goto(`${BASE}/dashboard/contratos`);
    await expect(page).toHaveURL(/\/dashboard\/contratos$/, { timeout: 8000 });
  });

  test('Alunos permite cadastrar: tem Nova matrícula', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /nova matrícula/i }).first()).toBeVisible({ timeout: 8000 });
  });
});
