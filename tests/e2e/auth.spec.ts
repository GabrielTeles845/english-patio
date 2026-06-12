/* Autenticação: login válido/ inválido e redefinição de senha com token falso.
   Cada teste usa um contexto novo (sem sessão) — independentes. */
import { test, expect } from '@playwright/test';
import { reseed, BASE, ADMIN } from './helpers';

test.describe('Autenticação', () => {
  test.beforeAll(() => reseed());

  test('login com senha errada não entra (fica no login)', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/entrar`, { waitUntil: 'networkidle' });
    await page.fill('input[type=email]', ADMIN.email);
    await page.fill('input[type=password]', 'SenhaErrada@9');
    await page.click('button[type=submit]');
    await page.waitForTimeout(1500);
    expect(page.url(), 'deve continuar na tela de login').toMatch(/\/entrar$/);
    await ctx.close();
  });

  test('login válido entra na dashboard', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/entrar`, { waitUntil: 'networkidle' });
    await page.fill('input[type=email]', ADMIN.email);
    await page.fill('input[type=password]', ADMIN.password);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.endsWith('/entrar'), { timeout: 20000 }).catch(() => {}),
      page.click('button[type=submit]'),
    ]);
    await page.waitForTimeout(800);
    expect(page.url(), 'não deve estar mais no login').not.toMatch(/\/entrar$/);
    await ctx.close();
  });

  test('redefinir senha com token falso → link inválido', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/redefinir?token=fake-e2e`, { waitUntil: 'networkidle' });
    await page.locator('input[type=password]').nth(0).fill('Senha@1234');
    await page.locator('input[type=password]').nth(1).fill('Senha@1234');
    await page.getByRole('button', { name: /redefinir senha/i }).click();
    await expect(page.getByText(/link inv[áa]lido ou expirado/i)).toBeVisible({ timeout: 10000 });
    await ctx.close();
  });
});
