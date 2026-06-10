/**
 * E2E de navegação da dashboard React (rotas /dashboard/<tela>).
 * Sobe um Chromium real, injeta sessão de Diretor + desliga os tours, e passeia
 * por TODAS as telas abrindo cada modal e as 4 visões da Agenda, capturando um
 * print de cada estado. Falha (exit 1) se qualquer erro de runtime/console
 * aparecer — serve de smoke test visual contra regressões.
 *
 * Pré-requisito: o app servido em DASH_BASE (suba com `npm run dev` ou
 * `npm run preview` noutro terminal).
 *
 * Rodar:   node scripts/dashboard-e2e.mjs
 *   visível:  HEADED=1 node scripts/dashboard-e2e.mjs
 *   outra URL: DASH_BASE=http://localhost:4173 node scripts/dashboard-e2e.mjs
 *
 * Prints em /tmp/dashboard-e2e/ (ou $DASH_OUT). Manifesto em manifest.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.DASH_BASE || 'http://localhost:5173';
const OUT = process.env.DASH_OUT || '/tmp/dashboard-e2e';
const HEADED = !!process.env.HEADED;
const SESSION_KEY = 'ep-dash-session';
const TOURS_OFF_KEY = 'ep-tours-off';
mkdirSync(OUT, { recursive: true });

const log = (m) => console.log(m);
const manifest = [];
const errors = [];
let n = 0;
const pad = (x) => String(x).padStart(2, '0');

let browserRef = null;
const HARD = 240_000;
const wd = setTimeout(async () => {
  log(`\n⏱  WATCHDOG ${HARD / 1000}s — encerrando à força.`);
  try { await browserRef?.close(); } catch {}
  finish(2);
}, HARD);

function finish(code) {
  clearTimeout(wd);
  writeFileSync(OUT + '/manifest.json', JSON.stringify(manifest, null, 2));
  log(`\n===== ERROS DE RUNTIME: ${errors.length} =====`);
  errors.forEach((e) => log('  ' + e));
  log(`\nPrints: ${manifest.length} em ${OUT}`);
  // erro de runtime derruba o smoke test
  process.exit(code !== 0 ? code : errors.length ? 1 : 0);
}

const browser = await chromium.launch({ headless: !HEADED, slowMo: HEADED ? 280 : 0 });
browserRef = browser;
const ctx = await browser.newContext({ viewport: { width: 1440, height: 880 } });
await ctx.addInitScript(([sk, tk]) => {
  sessionStorage.setItem(sk, JSON.stringify(1)); // Diretor (acesso total)
  localStorage.setItem(tk, '1');                 // tours OFF (evita spotlight/scroll)
}, [SESSION_KEY, TOURS_OFF_KEY]);

const page = await ctx.newPage();
page.setDefaultTimeout(4000);
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + (e?.message || e)));
page.on('console', (m) => m.type() === 'error' && errors.push('CONSOLE: ' + m.text()));

async function shot(name, desc, full = false) {
  n += 1;
  const file = `${OUT}/${pad(n)}-${name}.png`;
  try {
    await page.screenshot({ path: file, fullPage: full });
    manifest.push({ file, desc });
    log(`  📸 ${pad(n)}-${name}`);
  } catch (e) {
    log(`  ✗ print ${name}: ${(e?.message || e).split('\n')[0]}`);
  }
}
// roda uma ação com timeout próprio; nunca lança (passos ausentes são pulados)
async function act(desc, fn, ms = 6000) {
  try {
    await Promise.race([fn(), new Promise((_, r) => setTimeout(() => r(new Error('timeout ' + ms)), ms))]);
    return true;
  } catch (e) {
    log(`  ~ pulado (${desc}): ${(e?.message || e).split('\n')[0]}`);
    return false;
  }
}
const go = (path) => act('goto ' + path, async () => {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {});
  await page.waitForTimeout(700);
}, 12000);
const esc = async () => { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(450); };
const click = (loc, desc) => act('click ' + desc, async () => {
  const l = typeof loc === 'function' ? loc() : loc;
  await l.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
  await l.click({ timeout: 3500 });
  await page.waitForTimeout(650);
});
const byBtn = (re) => page.getByRole('button', { name: re }).first();

log(`\n===== E2E DASHBOARD (Diretor · tours OFF) · ${BASE} =====\n`);

// ---------- VISÃO GERAL ----------
await go('/dashboard/visao-geral');
await shot('overview', 'Visão geral: KPIs, gráficos, funil de contratos, vagas por sala/nível.', true);

// ---------- ALUNOS ----------
await go('/dashboard/alunos');
await shot('alunos-lista', 'Lista de alunos: tabela + filtros + menu ⋮ por linha.');
if (await click(() => byBtn(/Nova matrícula/i), 'Nova matrícula')) { await shot('alunos-nova', 'Modal "Nova matrícula".'); await esc(); }
if (await click(() => byBtn(/Importar/i), 'Importar')) { await shot('alunos-importar', 'Modal "Importar planilha".'); await esc(); }

const rowMenu = () => page.locator('[data-tip="Todas as ações"]').first();
if (await click(rowMenu, 'abrir ⋮')) {
  await shot('alunos-rowmenu', 'Menu ⋮ aberto (transições válidas pro status).');
  if (await click(() => page.getByText(/Editar dados/i).first(), 'Editar dados')) { await shot('alunos-editar', 'Modal "Editar dados".'); await esc(); }
}
if (await click(rowMenu, 'reabrir ⋮')) {
  if (await click(() => page.getByText(/Ver contrato/i).first(), 'Ver contrato')) { await shot('alunos-contrato', 'Modal do contrato (PDF + timeline).'); await esc(); }
}
if (await click(rowMenu, 'reabrir ⋮ (desligar)')) {
  if (await click(() => page.getByText(/Desligar aluno/i).first(), 'Desligar')) { await shot('alunos-desligar', 'Modal "Desligar aluno".'); await esc(); }
}
if (await click(rowMenu, 'reabrir ⋮ (excluir)')) {
  if (await click(() => page.getByText(/Excluir matrícula/i).first(), 'Excluir')) { await shot('alunos-excluir', 'Modal "Excluir matrícula".'); await esc(); }
}
await go('/dashboard/alunos/1');
await shot('aluno-detalhe', 'Ficha completa do aluno (pagamento = boleto/carnê 6x).', true);

// ---------- AGENDA (4 visões) ----------
await go('/dashboard/agenda');
await click(() => byBtn(/^Grade$/i), 'visão Grade'); await shot('agenda-grade', 'Agenda · GRADE.');
await click(() => byBtn(/^Salas$/i), 'visão Salas'); await shot('agenda-salas', 'Agenda · SALAS.');
await click(() => byBtn(/^Níveis$/i), 'visão Níveis'); await shot('agenda-niveis', 'Agenda · NÍVEIS.');
await click(() => byBtn(/^Mural$/i), 'visão Mural'); await shot('agenda-mural', 'Agenda · MURAL.');
if (await click(() => page.locator('[data-tour="ag-export"]').first(), 'Exportar imagens')) { await shot('agenda-export', 'Modal exportar imagens.'); await esc(); }
if (await click(() => page.locator('[data-tour="ag-nova"]').first(), 'Nova turma')) { await shot('agenda-novaturma', 'Modal "Nova turma".'); await esc(); }
if (await click(() => byBtn(/Salas & teachers/i), 'Salas & teachers')) { await shot('agenda-salasteachers', 'Modal "Salas & teachers".'); await esc(); }

// ---------- CONTRATOS / MODELOS ----------
await go('/dashboard/contratos');
await shot('contratos', 'Contratos (só leitura) com status + filtros.');
await go('/dashboard/contratos/modelos');
await shot('modelos', 'Modelos de contrato (cards, "Em uso").');
if (await click(() => page.locator('[data-tour="tpl-import"]').first(), 'Importar PDF')) { await shot('modelos-importar', 'Modal "Importar PDF".'); await esc(); }
if (await click(() => byBtn(/Ver mapeamento/i), 'Ver mapeamento')) { await shot('modelos-mapeamento', 'Mapeamento de campos no PDF.'); await esc(); }

// ---------- COMUNICADOS ----------
await go('/dashboard/comunicados');
await shot('comunicados', 'Comunicados: modelos, destinatários, canais, composição.');
if (await click(() => page.locator('[data-tour="prevbtn"]').first(), 'Ver como chega')) { await shot('comunicados-preview', 'Modal "Ver como chega".'); await esc(); }
if (await click(() => byBtn(/Gerenciar modelos/i), 'Gerenciar modelos')) { await shot('comunicados-modelos', 'Modal "Gerenciar modelos".'); await esc(); }

// ---------- EDITOR ----------
await go('/dashboard/editor');
await shot('editor', 'Editor do site: abas, preview, campos editáveis, Publicar.');
if (await click(() => page.locator('[data-tip="Como fica no celular"]').first(), 'toggle mobile')) { await shot('editor-mobile', 'Editor em preview MOBILE.'); }
await click(() => page.locator('[data-tip="Como fica no computador"]').first(), 'toggle desktop');
if (await click(() => page.locator('.editable').first(), 'campo editável')) { await shot('editor-painel', 'Painel de edição de texto.'); await esc(); }

// ---------- USUÁRIOS ----------
await go('/dashboard/usuarios');
await shot('usuarios', 'Usuários: papéis (Diretor/Supervisor/Secretaria), menu ⋮.');
if (await click(() => byBtn(/Novo usuário/i), 'Novo usuário')) { await shot('usuarios-novo', 'Modal "Novo usuário".'); await esc(); }

// ---------- ATIVIDADE ----------
await go('/dashboard/atividade');
await shot('atividade', 'Atividade: log imutável + filtros.');

// ---------- CONFIGURAÇÕES + MODO ESCURO ----------
await go('/dashboard/configuracoes');
await shot('config', 'Configurações: aparência, temas, conta, segurança, ajuda.');
if (await click(() => byBtn(/Editar e-mail e senha/i), 'Editar conta')) { await shot('config-conta', 'Modal "Minha conta" (senhas com olhinho).'); await esc(); }
if (await click(() => page.locator('[data-tip="Modo claro/escuro"]').first(), 'modo escuro')) { await shot('dark-mode', 'Config em MODO ESCURO.'); }

// ---------- NOTIFICAÇÕES (topbar) ----------
await go('/dashboard/visao-geral');
if (await click(() => page.locator('[data-tour="bell"] button').first(), 'sino')) { await shot('notificacoes', 'Painel de notificações.'); await esc(); }

await page.waitForTimeout(HEADED ? 1200 : 200);
clearTimeout(wd);
await browser.close();
finish(0);
