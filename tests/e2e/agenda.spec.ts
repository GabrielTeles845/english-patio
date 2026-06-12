/* Agenda (CRUD de turma/sala) + ciclo de vida do aluno (mover/desligar/reativar/
   excluir). Serial: a turma criada no 1º teste é usada na alocação. */
import { test, expect, type Page } from '@playwright/test';
import { freshSession, jclick, pickCs, BASE, classCount, roomCount, enrollItems, api } from './helpers';

test.describe.serial('Agenda & ciclo de vida do aluno', () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await freshSession(browser);
  });
  test.afterAll(async () => {
    await page.context().close();
  });

  test('criar turma (sala/dias/horário/nível/vagas)', async () => {
    await page.goto(`${BASE}/dashboard/agenda`, { waitUntil: 'networkidle' });
    const before = await classCount(page);
    await page.getByRole('button', { name: /nova turma/i }).click();
    const dlg = page.getByRole('dialog');
    await pickCs(page, dlg, 0); // Sala (1ª opção)
    await pickCs(page, dlg, 1, 'Seg/Qua'); // Dias
    await pickCs(page, dlg, 2, '8:30'); // Horário
    await pickCs(page, dlg, 3); // Nível (1ª)
    await dlg.locator('input').first().fill('7'); // Vagas
    await jclick(dlg.getByRole('button', { name: /criar turma/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
    expect(await classCount(page)).toBe(before + 1);
  });

  test('criar turma em slot ocupado é barrado', async () => {
    await page.goto(`${BASE}/dashboard/agenda`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /nova turma/i }).click();
    const dlg = page.getByRole('dialog');
    await pickCs(page, dlg, 0);
    await pickCs(page, dlg, 1, 'Seg/Qua');
    await pickCs(page, dlg, 2, '8:30'); // mesmo slot
    await pickCs(page, dlg, 3);
    await dlg.locator('input').first().fill('7');
    await jclick(dlg.getByRole('button', { name: /criar turma/i }));
    await page.waitForTimeout(1000);
    await expect(dlg, 'modal deve continuar aberto — slot ocupado').toBeVisible();
    await jclick(dlg.getByRole('button', { name: /cancelar/i }));
  });

  test('criar sala', async () => {
    await page.goto(`${BASE}/dashboard/agenda`, { waitUntil: 'networkidle' });
    const before = await roomCount(page);
    await page.getByRole('button', { name: /salas & teachers/i }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByPlaceholder(/nome da sala nova/i).fill('Sala E2E ' + Math.floor(Math.random() * 1e6));
    await jclick(dlg.getByRole('button', { name: /adicionar|criar|^\+/i }));
    await page.waitForTimeout(1200);
    expect(await roomCount(page)).toBeGreaterThan(before);
    await jclick(dlg.getByRole('button', { name: /fechar/i }));
  });

  test('aluno: mover/alocar em turma (na ficha)', async () => {
    const items = await enrollItems(page);
    const sid = items[0].id;
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: /ver ficha completa/i }).click();
    await page.waitForURL(/\/dashboard\/alunos\/\d+/, { timeout: 8000 });
    await page.getByRole('button', { name: /^(Alocar|Mover)$/ }).first().click();
    const dlg = page.getByRole('dialog');
    await jclick(dlg.locator('button').filter({ hasText: /Seg\/Qua|Ter\/Qui/ }).first());
    await page.waitForTimeout(200);
    await jclick(dlg.getByRole('button', { name: /^(Mover|Alocar|Confirmar)/ }));
    await page.waitForTimeout(1200);
    const det = (await api(page, `/api/enrollments/${sid}`)) as { students: Array<{ classId: number | null }> };
    expect(det.students[0].classId, 'aluno deve ficar com turma').not.toBeNull();
  });

  test('aluno: desligar (com motivo)', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: /desligar aluno/i }).click();
    const dlg = page.getByRole('dialog');
    await jclick(dlg.getByText('Concluiu o curso'));
    await jclick(dlg.getByRole('button', { name: /desligar aluno/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
  });

  test('aluno: reativar', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    const re = page.getByRole('menuitem', { name: /reativar aluno/i });
    await re.waitFor({ timeout: 5000 });
    await re.click();
    await page.waitForTimeout(1000);
  });

  test('aluno: excluir matrícula', async () => {
    await page.goto(`${BASE}/dashboard/alunos`, { waitUntil: 'networkidle' });
    const before = (await enrollItems(page)).length;
    await page.getByRole('button', { name: 'Todas as ações' }).first().click();
    await page.getByRole('menuitem', { name: /excluir matrícula/i }).click();
    const dlg = page.getByRole('dialog');
    await jclick(dlg.getByText(/entendi que a exclusão é definitiva/i));
    await jclick(dlg.getByRole('button', { name: /excluir de vez/i }));
    await dlg.waitFor({ state: 'detached', timeout: 10000 });
    expect((await enrollItems(page)).length).toBe(before - 1);
  });
});
