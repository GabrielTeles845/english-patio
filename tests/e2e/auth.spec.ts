/* Autenticação: login (senha errada, e-mail inexistente, vazio, mal-formado,
   válido), olhinho da senha, "Esqueci a senha" e redefinição com token falso.
   Cada teste usa um contexto novo (sem sessão) com os tours desligados. */
import { test, expect, type Browser, type Page } from '@playwright/test';
import { reseed, cleanContext, BASE, ADMIN } from './helpers';

// Página nova e isolada na tela de login (contexto próprio = sem sessão).
async function loginPage(browser: Browser): Promise<Page> {
  const ctx = await cleanContext(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard/entrar`, { waitUntil: 'networkidle' });
  return page;
}

test.describe('Autenticação', () => {
  test.beforeAll(() => reseed());

  test('senha errada: mostra "E-mail ou senha incorretos." e fica no login', async ({ browser }) => {
    const page = await loginPage(browser);
    await page.fill('input[type=email]', ADMIN.email);
    await page.fill('input[type=password]', 'SenhaErrada@9');
    await page.click('button[type=submit]');
    await expect(page.getByRole('status')).toContainText(/incorret/i, { timeout: 8000 });
    await expect(page, 'deve continuar na tela de login').toHaveURL(/\/entrar$/);
    await page.context().close();
  });

  test('e-mail inexistente: mesma mensagem genérica (anti-enumeração)', async ({ browser }) => {
    const page = await loginPage(browser);
    await page.fill('input[type=email]', 'naoexiste@englishpatio.com.br');
    await page.fill('input[type=password]', 'QualquerSenha@1');
    await page.click('button[type=submit]');
    await expect(page.getByRole('status')).toContainText(/incorret/i, { timeout: 8000 });
    await expect(page).toHaveURL(/\/entrar$/);
    await page.context().close();
  });

  test('campos vazios: não entra (continua no login)', async ({ browser }) => {
    const page = await loginPage(browser);
    await page.click('button[type=submit]');
    await page.waitForTimeout(1200);
    await expect(page, 'sem credenciais não pode navegar').toHaveURL(/\/entrar$/);
    await page.context().close();
  });

  test('e-mail mal-formado: barrado, não entra', async ({ browser }) => {
    const page = await loginPage(browser);
    await page.fill('input[type=email]', 'isto-nao-e-email');
    await page.fill('input[type=password]', 'QualquerSenha@1');
    await page.click('button[type=submit]');
    await page.waitForTimeout(1200);
    await expect(page, 'e-mail inválido não pode entrar').toHaveURL(/\/entrar$/);
    await page.context().close();
  });

  test('olhinho mostra/oculta a senha', async ({ browser }) => {
    const page = await loginPage(browser);
    const pw = page.locator('input[autocomplete="current-password"]');
    await pw.fill('Senh@12345');
    await expect(pw).toHaveAttribute('type', 'password');
    await page.locator('button[data-tip="Mostrar/ocultar senha"]').click();
    await expect(pw, 'olhinho deve revelar a senha').toHaveAttribute('type', 'text');
    await page.locator('button[data-tip="Mostrar/ocultar senha"]').click();
    await expect(pw, 'clicar de novo deve ocultar').toHaveAttribute('type', 'password');
    await page.context().close();
  });

  test('"Esqueci a senha": abre o modal e valida o e-mail', async ({ browser }) => {
    const page = await loginPage(browser);
    await page.getByRole('button', { name: /esqueci a senha/i }).click();
    await expect(page.getByText(/recuperar senha/i)).toBeVisible({ timeout: 6000 });
    // e-mail inválido → erro inline, não envia
    await page.getByPlaceholder('seu@email.com').fill('invalido');
    await page.getByRole('button', { name: /enviar link/i }).click();
    await expect(page.getByText(/e-mail válido/i)).toBeVisible({ timeout: 6000 });
    // e-mail válido → fecha o modal com aviso (anti-enumeração)
    await page.getByPlaceholder('seu@email.com').fill(ADMIN.email);
    await page.getByRole('button', { name: /enviar link/i }).click();
    await expect(page.getByText(/recuperar senha/i)).toBeHidden({ timeout: 8000 });
    await page.context().close();
  });

  test('login válido entra na dashboard', async ({ browser }) => {
    const page = await loginPage(browser);
    await page.fill('input[type=email]', ADMIN.email);
    await page.fill('input[type=password]', ADMIN.password);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.endsWith('/entrar'), { timeout: 20000 }).catch(() => {}),
      page.click('button[type=submit]'),
    ]);
    await page.waitForTimeout(800);
    await expect(page, 'não deve estar mais no login').not.toHaveURL(/\/entrar$/);
    await page.context().close();
  });

  test('redefinir senha com token falso → link inválido', async ({ browser }) => {
    const ctx = await cleanContext(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/redefinir?token=fake-e2e`, { waitUntil: 'networkidle' });
    await page.locator('input[type=password]').nth(0).fill('Senha@1234');
    await page.locator('input[type=password]').nth(1).fill('Senha@1234');
    await page.getByRole('button', { name: /redefinir senha/i }).click();
    await expect(page.getByText(/link inv[áa]lido ou expirado/i)).toBeVisible({ timeout: 10000 });
    await ctx.close();
  });
});
