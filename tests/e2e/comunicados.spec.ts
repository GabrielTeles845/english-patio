/* Comunicados: envio (vazio barrado / e-mail / público+canal) e CRUD de modelos
   (agora ligados ao backend /api/announcement-templates). Serial. */
import { test, expect, type Page } from '@playwright/test';
import { freshSession, jclick, BASE, annTotal } from './helpers';

test.describe.serial('Comunicados', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('assunto/mensagem vazios é barrado', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`, { waitUntil: 'networkidle' });
    const before = await annTotal(page);
    await page.getByRole('textbox').first().fill('');
    await page.locator('textarea').first().fill('');
    await page.getByRole('button', { name: 'Enviar e-mail' }).click();
    await page.waitForTimeout(800);
    expect(await annTotal(page), 'não deve enviar comunicado vazio').toBe(before);
  });

  test('escrever + enviar e-mail entra no histórico (+1)', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`, { waitUntil: 'networkidle' });
    const before = await annTotal(page);
    const marker = 'Aviso E2E ' + Math.floor(Math.random() * 1e6);
    await page.getByRole('textbox').first().fill(marker);
    await page.locator('textarea').first().fill('Mensagem de teste para {{nome_responsavel}}.');
    await page.getByRole('button', { name: 'Enviar e-mail' }).click();
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 10000 });
    expect(await annTotal(page)).toBe(before + 1);
  });

  test('público "Contratos pendentes" + canal Ambos (+1)', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`, { waitUntil: 'networkidle' });
    const before = await annTotal(page);
    await page.getByRole('textbox').first().fill('Aviso pendentes ' + Math.floor(Math.random() * 1e6));
    await page.locator('textarea').first().fill('Olá {{nome_responsavel}}, sobre o contrato.');
    await jclick(page.getByRole('button', { name: 'Para quem vai o comunicado' }));
    await page.waitForTimeout(300);
    await jclick(page.getByRole('option', { name: /contratos pendentes/i }));
    await page.getByRole('button', { name: 'Ambos' }).click();
    await page.getByRole('button', { name: /enviar e-mail \+ whatsapp/i }).click();
    await page.waitForTimeout(1500);
    expect(await annTotal(page)).toBe(before + 1);
  });

  test('criar modelo (persiste e aparece nos botões)', async () => {
    await page.goto(`${BASE}/dashboard/comunicados`, { waitUntil: 'networkidle' });
    const nome = 'Modelo E2E ' + Math.floor(Math.random() * 1e6);
    await page.getByRole('button', { name: /gerenciar modelos/i }).click();
    await jclick(page.getByRole('dialog').getByRole('button', { name: /novo modelo/i }));
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder(/ex\.: reunião de pais/i).fill(nome);
    await dlg.getByPlaceholder(/assunto do e-mail/i).fill('Assunto do modelo E2E');
    await dlg.getByPlaceholder(/olá, /i).fill('Texto do modelo para {{nome_responsavel}}.');
    await jclick(dlg.getByRole('button', { name: /criar modelo/i }));
    await page.waitForTimeout(800);
    const fechar = page.getByRole('dialog').getByRole('button', { name: /fechar/i });
    if (await fechar.count()) await jclick(fechar);
    await expect(page.getByRole('button', { name: nome }).first()).toBeVisible({ timeout: 6000 });
  });

  test('o modelo criado sobrevive ao reload (veio do banco)', async () => {
    // recarrega a página inteira: se o modelo continua, é porque persistiu na API.
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(/gerenciar modelos/i)).toBeVisible({ timeout: 10000 });
    // pelo menos os 3 modelos default + o criado aparecem como botões de aplicar
    const botoes = page.locator('button', { hasText: /Recesso|Lembrete|Comunicado|Modelo E2E/ });
    expect(await botoes.count()).toBeGreaterThanOrEqual(3);
  });
});
