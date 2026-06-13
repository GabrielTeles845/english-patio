/* Conta, sino de notificações e sessão — fluxos de segurança que não tinham
   cobertura. Serial: o logout vem por último (encerra a sessão). O e-mail novo
   usa o padrão e2e-%@example.com para o seed limpar no próximo arquivo. */
import { test, expect, type Page } from '@playwright/test';
import { freshSession, jclick, api, BASE } from './helpers';

test.describe.serial('Conta · sino · sessão', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('sino abre o painel de notificações e "Marcar como lidas" não falha', async () => {
    await page.goto(`${BASE}/dashboard/visao-geral`, { waitUntil: 'networkidle' });
    await page.locator('button[data-tip="Notificações"]').click();
    await expect(page.getByText('Notificações', { exact: true }).first()).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: /marcar como lidas/i }).click();
    // depois de marcar, não pode sobrar badge de não-lidas no sino
    await expect(page.locator('button[data-tip="Notificações"] span')).toHaveCount(0);
  });

  test('editar o e-mail de acesso na conta persiste', async () => {
    const novo = 'e2e-conta-edit@example.com';
    await page.goto(`${BASE}/dashboard/visao-geral`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Minha conta' }).click();
    const dlg = page.getByRole('dialog');
    const campo = dlg.locator('input[type=email]');
    await campo.waitFor({ timeout: 8000 });
    await campo.fill(novo);
    await jclick(dlg.getByRole('button', { name: /salvar alterações/i }));
    await expect(page.getByText('Dados da conta atualizados!')).toBeVisible({ timeout: 8000 });
    // confirma no servidor: a sessão (mesmo id) passa a reportar o novo e-mail.
    const me = (await api(page, '/api/auth/me')) as { user?: { email?: string } };
    expect(me.user?.email).toBe(novo);
  });

  test('logout encerra a sessão e bloqueia rota protegida', async () => {
    await page.goto(`${BASE}/dashboard/visao-geral`, { waitUntil: 'networkidle' });
    await page.locator('button[data-tip="Sair do painel"]').click();
    await expect(page).toHaveURL(/\/dashboard\/entrar$/, { timeout: 8000 });
    // sem sessão, abrir uma rota protegida cai de volta no login
    await page.goto(`${BASE}/dashboard/visao-geral`);
    await expect(page).toHaveURL(/\/dashboard\/entrar$/, { timeout: 8000 });
  });
});
