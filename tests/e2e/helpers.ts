/* Helpers da suíte de regressão E2E (Playwright Test). Reaproveita a lógica
   provada dos scripts scripts/e2e-*.mjs: clique via DOM, interceptação de CEP,
   login e reset do banco LOCAL entre os arquivos de teste. */
import { execFileSync } from 'node:child_process';
import type { Browser, Page, Locator } from '@playwright/test';

export const BASE = process.env.BASE || 'http://localhost:4321';
export const ADMIN = { email: 'admin@email.com', password: 'Senh@12345' };

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
  const ctx = await browser.newContext();
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

// Escolhe a i-ésima opção de um CSelect (sem aria-label): abre o gatilho .cs e
// clica a opção (renderizada em portal, no escopo da página).
export async function pickCs(page: Page, dlg: Locator, index: number, optionName?: string | RegExp): Promise<void> {
  await jclick(dlg.locator('.cs > button').nth(index));
  await page.waitForTimeout(250);
  const opt = optionName ? page.getByRole('option', { name: optionName }) : page.getByRole('option');
  await jclick(opt);
  await page.waitForTimeout(150);
}
