/* Lista de Alunos: busca, filtro por status de contrato e exportação. Filtros
   que escondem/mostram alunos errados levam a decisões erradas — daí a cobertura.
   Serial sobre a mesma sessão; o estado fresco tem 1 aluno com contrato pending. */
import { test, expect, type Page } from '@playwright/test';
import { statSync } from 'node:fs';
import { freshSession, jclick, BASE } from './helpers';

test.describe.serial('Alunos — busca, filtros e exportação', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('busca por nome filtra; termo sem match mostra o empty state', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await expect(page.getByText('Helena Duarte Lima').first()).toBeVisible({ timeout: 8000 });
    await page.fill('#alunoSearch', 'Helena');
    await expect(page.getByText('Helena Duarte Lima').first()).toBeVisible();
    await page.fill('#alunoSearch', 'zzznaoexistexyz');
    await expect(page.getByText(/Nenhum aluno bate com esses filtros/i)).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: /limpar filtros/i }).click();
    await expect(page.getByText('Helena Duarte Lima').first()).toBeVisible({ timeout: 6000 });
  });

  test('filtro por status do contrato esconde quem não bate e mostra quem bate', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await expect(page.getByText('Helena Duarte Lima').first()).toBeVisible({ timeout: 8000 });
    // o contrato semeado é "pending": filtrar por "Assinado" esconde o aluno
    await jclick(page.getByRole('button', { name: 'Filtrar por status do contrato' }));
    await jclick(page.getByRole('option', { name: 'Assinado', exact: true }));
    await expect(page.getByText(/Nenhum aluno bate com esses filtros/i)).toBeVisible({ timeout: 6000 });
    // filtrar por "Pendente" o traz de volta
    await jclick(page.getByRole('button', { name: 'Filtrar por status do contrato' }));
    await jclick(page.getByRole('option', { name: 'Pendente', exact: true }));
    await expect(page.getByText('Helena Duarte Lima').first()).toBeVisible({ timeout: 6000 });
  });

  test('exportar planilha baixa um CSV não-vazio', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /exportar planilha/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    const p = await download.path();
    expect(p, 'o arquivo baixado existe no disco').toBeTruthy();
    expect(statSync(p!).size, 'o CSV exportado não pode estar vazio').toBeGreaterThan(0);
  });
});
