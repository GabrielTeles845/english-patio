/* Helpers da suíte de regressão E2E (Playwright Test). Reaproveita a lógica
   provada dos scripts scripts/e2e-*.mjs: clique via DOM, interceptação de CEP,
   login e reset do banco LOCAL entre os arquivos de teste. */
import { execFileSync } from 'node:child_process';
import type { Browser, BrowserContext, Page, Locator } from '@playwright/test';

export const BASE = process.env.BASE || 'http://localhost:4321';
export const ADMIN = { email: 'admin@email.com', password: 'Senh@12345' };

// CAUSA RAIZ das travas da suíte: o tour guiado abre sozinho ~560ms depois de
// entrar em cada tela (Diretor, 1ª visita) e o overlay (zIndex 95) engole os
// cliques seguintes — o teste então estoura o actionTimeout. Aqui ligamos o
// opt-out global ANTES do app React montar, em todo contexto novo, para que
// NENHUM tour suba. Chave/valor conferem com src/lib/dashboard/tours.ts.
export async function killTours(ctx: BrowserContext): Promise<void> {
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('ep-tours-off', '1');
    } catch {
      /* about:blank pode não ter storage — ignora */
    }
  });
}

// Contexto novo já com os tours desligados. Use sempre isto no lugar de
// browser.newContext() cru, senão os tours voltam a travar os cliques.
export async function cleanContext(browser: Browser): Promise<BrowserContext> {
  const ctx = await browser.newContext();
  await killTours(ctx);
  return ctx;
}

// Reseta o banco LOCAL para o estado base (1 Diretor + 1 família + contrato
// pending). Recria o admin com novo id → quem chamar deve relogar em seguida.
export function reseed(): void {
  // timeout: o seed nunca pode pendurar a suíte (mata em 60s e estoura o teste).
  execFileSync('node', ['--env-file=.env.test', '--import', 'tsx', 'scripts/seed-e2e.ts'], {
    stdio: 'ignore',
    timeout: 60_000,
  });
}

// Clique via DOM: dispara o onClick real. Botões dentro de modais que
// re-renderizam não passam na checagem de estabilidade do Playwright; el.click()
// chama o mesmo handler e é confiável para verificar a fiação.
export async function jclick(loc: Locator): Promise<void> {
  const l = loc.first();
  await l.waitFor({ state: 'attached', timeout: 10000 });
  await l.evaluate((el) => (el as HTMLElement).click());
}

// Intercepta as 4 APIs de CEP (sem rede): 74230-110 → GO (válido);
// 01001-000 → SP (fora de Goiás, para o teste negativo).
export async function routeCep(page: Page): Promise<void> {
  await page.route('**viacep.com.br/**', (route) => {
    const sp = route.request().url().includes('01001');
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sp
        ? { cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }
        : { cep: '74230-110', logradouro: 'Rua T-55', bairro: 'Setor Bueno', localidade: 'Goiânia', uf: 'GO' }),
    });
  });
  for (const d of ['brasilapi.com.br', 'opencep.com', 'apicep.com']) {
    await page.route(`**${d}/**`, (route) => route.abort());
  }
}

export async function login(page: Page): Promise<void> {
  await page.goto(`${BASE}/dashboard/entrar`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', ADMIN.email);
  await page.fill('input[type=password]', ADMIN.password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.endsWith('/entrar'), { timeout: 20000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ]);
  await page.waitForTimeout(800);
  if (page.url().endsWith('/entrar')) throw new Error('login falhou');
}

// Sessão limpa para um arquivo de teste: reseta o banco, abre um contexto novo,
// intercepta CEP e loga. Cada spec roda em série sobre a mesma página.
export async function freshSession(browser: Browser): Promise<Page> {
  reseed();
  const ctx = await cleanContext(browser);
  const page = await ctx.newPage();
  await routeCep(page);
  await login(page);
  return page;
}

// Leitura da API de dentro da página (mesma sessão/cookies).
export const api = (page: Page, path: string): Promise<unknown> =>
  page.evaluate((p) => fetch(p).then((r) => r.json()).then((j) => j.data), path) as Promise<unknown>;

export const enrollTotal = async (page: Page): Promise<number> =>
  ((await api(page, '/api/enrollments?pageSize=1')) as { total?: number })?.total ?? 0;
export const annTotal = async (page: Page): Promise<number> =>
  ((await api(page, '/api/announcements?pageSize=1')) as { total?: number })?.total ?? 0;
export const enrollItems = async (page: Page): Promise<Array<{ id: number }>> =>
  ((await api(page, '/api/enrollments?pageSize=50')) as { items?: Array<{ id: number }> })?.items ?? [];
export const classCount = async (page: Page): Promise<number> =>
  ((await api(page, '/api/classes')) as unknown[])?.length ?? 0;
export const roomCount = async (page: Page): Promise<number> =>
  ((await api(page, '/api/rooms')) as unknown[])?.length ?? 0;

// Preenche a Nova matrícula com dados TODOS válidos (GO). Os testes de validação
// quebram UM campo depois para isolar cada regra. routeCep deve estar ativo.
export async function fillValidEnrollment(page: Page, dlg: Locator): Promise<void> {
  await dlg.getByPlaceholder('Nome completo').first().fill('Joao Pedro Da Silva');
  await dlg.getByPlaceholder('dd/mm/aaaa').nth(0).fill('10/05/2016');
  await dlg.getByPlaceholder('Quem assina o contrato').fill('Maria Aparecida Souza');
  await dlg.getByPlaceholder('000.000.000-00').first().fill('52998224725');
  await dlg.getByPlaceholder('dd/mm/aaaa').nth(1).fill('15/03/1988');
  await dlg.getByPlaceholder('email@exemplo.com').fill('maria.souza@example.com');
  await dlg.getByPlaceholder('(62) 9xxxx-xxxx').fill('62998887766');
  await jclick(dlg.getByRole('button', { name: 'Parentesco', exact: true }));
  await page.waitForTimeout(300);
  await jclick(page.getByRole('option', { name: 'Mãe', exact: true }));
  await dlg.getByPlaceholder('00000-000').fill('74230110'); // CEP GO
  await page.waitForTimeout(800);
  await dlg.getByLabel('Rua / avenida').fill('Rua T-55');
  await dlg.getByPlaceholder('123 ou s/n').fill('180');
  await dlg.getByLabel('Bairro').fill('Setor Bueno');
  await dlg.getByLabel('Cidade').fill('Goiânia');
  await jclick(dlg.getByText('A família leu e aceitou os termos do contrato'));
  await jclick(dlg.getByText('O horário das aulas foi confirmado com a família'));
}

// Escolhe a i-ésima opção de um CSelect (sem aria-label): abre o gatilho .cs e
// clica a opção (renderizada em portal, no escopo da página).
export async function pickCs(page: Page, dlg: Locator, index: number, optionName?: string | RegExp): Promise<void> {
  await jclick(dlg.locator('.cs > button').nth(index));
  await page.waitForTimeout(250);
  const opt = optionName ? page.getByRole('option', { name: optionName }) : page.getByRole('option');
  await jclick(opt);
  await page.waitForTimeout(150);
}
