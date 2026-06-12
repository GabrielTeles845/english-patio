/* Smoke: cada tela da dashboard abre e renderiza (sem crash), logado como
   Diretor. Garante que as rotas e o RequireAuth funcionam ponta a ponta. */
import { test, expect, type Page } from '@playwright/test';
import { freshSession, BASE } from './helpers';

const TELAS: Array<[string, string, RegExp]> = [
  ['Visão geral', 'visao-geral', /vis(ã|a)o geral|matr[íi]culas|ocupa/i],
  ['Alunos', 'alunos', /alunos|matr[íi]cula/i],
  ['Agenda', 'agenda', /agenda|turma/i],
  ['Contratos', 'contratos', /contrato/i],
  ['Modelos de contrato', 'contratos/modelos', /modelo/i],
  ['Comunicados', 'comunicados', /comunicado|modelo/i],
  ['Editor de site', 'editor', /editor|p[áa]gina|publicar/i],
  ['Usuários', 'usuarios', /usu[áa]rio/i],
  ['Atividade', 'atividade', /atividade|registro/i],
  ['Configurações', 'configuracoes', /configura|apar[êe]ncia|notifica/i],
];

test.describe.serial('Smoke — todas as telas abrem', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  for (const [nome, path, esperado] of TELAS) {
    test(`abre: ${nome}`, async () => {
      await page.goto(`${BASE}/dashboard/${path}`, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toContainText(esperado, { timeout: 12_000 });
      expect(page.url(), 'não deve cair no login').not.toMatch(/\/entrar$/);
    });
  }
});
