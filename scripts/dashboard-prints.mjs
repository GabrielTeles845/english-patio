/**
 * Prints automatizados do preview da dashboard (public/dashboard.html).
 * Abre a página num Chromium real (CDNs de verdade), faz login, navega por
 * todas as telas e abre os principais modais, salvando screenshots em
 * /tmp/dashboard-prints/ — desktop (1440×900) e mobile (390×844).
 *
 * Rodar:  node scripts/dashboard-prints.mjs
 * (usa o playwright já instalado no projeto lp-valhalla)
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '/Users/gabrielteles/Projetos/lp-valhalla/node_modules/playwright/index.mjs';

const OUT = '/tmp/dashboard-prints';
mkdirSync(OUT, { recursive: true });
const url = new URL('../public/dashboard.html', import.meta.url).href;

const browser = await chromium.launch();

async function boot(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1.5 });
  await page.addInitScript(() => localStorage.setItem('ep-tours-off', '1'));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => doLogin());
  await page.waitForTimeout(900); // gráficos + ícones
  return page;
}

const shot = async (page, name, full = true) => {
  // espera o overlay de skeleton (#mainSkel.on, dura ~560ms) sair antes de capturar
  await page.waitForFunction(() => { const o = document.getElementById('mainSkel'); return !o || !o.classList.contains('on'); }).catch(() => {});
  await page.waitForTimeout(350);
  // modais são position:fixed — fullPage embaralha o overlay em páginas altas
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full && !name.includes('modal') });
  console.log('  📸 ' + name);
};

/* ---------- desktop ---------- */
const d = await boot({ width: 1440, height: 900 });

for (const view of ['overview', 'alunos', 'agenda', 'contratos', 'emails', 'editor', 'usuarios', 'atividade', 'config', 'notifs']) {
  await d.evaluate(v => go(v), view);
  await shot(d, `desktop-${view}`);
}

/* ---------- agenda: visões, página da sala, mover e modais ---------- */
await d.evaluate(() => { go('agenda'); setAgView('grade'); setAgPar('ter-qui'); });
await shot(d, 'desktop-agenda-grade-terqui');
await d.evaluate(() => { setAgPar('seg-qua'); toggleAgVagas(); });
await shot(d, 'desktop-agenda-so-com-vagas');
await d.evaluate(() => { toggleAgVagas(); setAgView('salas'); });
await shot(d, 'desktop-agenda-salas');
await d.evaluate(() => openSalaView('green'));
await shot(d, 'desktop-agenda-sala-green');
await d.evaluate(() => setAgView('niveis'));
await shot(d, 'desktop-agenda-niveis');
await d.evaluate(() => { setAgView('grade'); const f = semTurmaKids()[0]; openMoverKid(f.s.id, f.ki); });
await shot(d, 'desktop-agenda-modal-alocar');
await d.evaluate(() => { closeModal(); openNewTurma('lavender', 'seg-qua', '10:30'); });
await shot(d, 'desktop-agenda-modal-nova-turma');
await d.evaluate(() => { closeModal(); openTurmaModal(TURMAS.find(t => activeKidsIn(t.id) >= t.cap).id); });
await shot(d, 'desktop-agenda-modal-turma-cheia');
await d.evaluate(() => { closeModal(); openAgExport(); });
await shot(d, 'desktop-agenda-modal-exportar');
await d.evaluate(() => { closeModal(); openSalasManage(); });
await shot(d, 'desktop-agenda-modal-salas');
await d.evaluate(() => closeModal());

// telas derivadas e estados
await d.evaluate(() => { setOvCohort('next'); go('overview'); });
await shot(d, 'desktop-overview-coorte-2026-2');
await d.evaluate(() => setOvCohort(''));

await d.evaluate(() => openDetail(STUDENTS.filter(s => s.active !== false && isFuture(s))[0].id));
await shot(d, 'desktop-detalhe-comeca-jul');

await d.evaluate(() => openDetail(STUDENTS.find(s => s.exit)?.id ?? STUDENTS[0].id));
await shot(d, 'desktop-detalhe-desligado');

await d.evaluate(() => openModelos());
await shot(d, 'desktop-modelos');
await d.evaluate(() => openTplMap(3)); // o modelo com campos pendentes
await shot(d, 'desktop-modelos-mapeamento');

// modais principais
const modais = [
  ['modal-nova-matricula', 'openNewEnrollment()'],
  ['modal-desligar', 'openExitModal(STUDENTS.find(s=>s.active!==false).id)'],
  ['modal-editar', 'openEditEnrollment(STUDENTS.find(s=>s.active!==false).id)'],
  ['modal-excluir', 'openDeleteModal(STUDENTS.find(s=>s.active!==false).id)'],
  ['modal-importar-planilha', 'openImportModal()'],
  ['modal-importar-resultado', "openImportModal();runImport(IMPORT_SAMPLE,'planilha de exemplo')"],
  ['modal-contrato', 'openContractModal(STUDENTS[1].id)'],
  ['modal-contrato-visualizado', "openContractModal(STUDENTS.find(s=>s.status==='viewed').id)"],
  ['modal-contrato-parado', 'openContractModal(STUDENTS.find(s=>isStale(s)).id)'],
  ['modal-importar-pdf', 'openTplImport()'],
  ['modal-conta', 'openAccountModal()'],
];
for (const [name, code] of modais) {
  await d.evaluate(c => { closeModal(); eval(c); }, code);
  await shot(d, `desktop-${name}`);
}
await d.evaluate(() => closeModal());

// menu ⋮ aberto (o title= vira data-tip pelo upgrade de tooltips)
await d.evaluate(() => {
  go('alunos');
  const btn = document.querySelector('#tableBody [data-tip="Todas as ações"], #tableBody button[title="Todas as ações"]');
  openRowMenu({ stopPropagation(){}, currentTarget: btn }, filteredStudents()[0].id);
});
await shot(d, 'desktop-menu-acoes');

// tema escuro + sidebar amarela
await d.evaluate(() => { document.documentElement.classList.add('dark'); refreshCharts?.(); go('overview'); });
await shot(d, 'desktop-overview-dark');
await d.evaluate(() => { document.documentElement.classList.remove('dark'); setSidebarTheme('yellow'); });
await shot(d, 'desktop-overview-sidebar-amarela');
await d.evaluate(() => setSidebarTheme('blue'));
await d.close();

/* ---------- mobile ---------- */
const m = await boot({ width: 390, height: 844 });
for (const view of ['overview', 'alunos', 'agenda', 'contratos', 'emails']) {
  await m.evaluate(v => go(v), view);
  await shot(m, `mobile-${view}`);
}
await m.evaluate(() => { go('agenda'); openSalaView('green'); });
await shot(m, 'mobile-agenda-sala-green');
await m.evaluate(() => toggleFilters('fRow', 'fChev') ?? go('alunos'));
await m.evaluate(() => go('alunos'));
await m.evaluate(() => toggleFilters('fRow', 'fChev'));
await shot(m, 'mobile-alunos-filtros-abertos');
await m.evaluate(() => openNewEnrollment());
await shot(m, 'mobile-modal-nova-matricula');
await m.close();

await browser.close();
console.log('\nPrints em ' + OUT);
