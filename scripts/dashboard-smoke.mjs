/**
 * Teste de fumaça do preview da dashboard (public/dashboard.html).
 *
 * Carrega a página num DOM simulado (jsdom), stubba as libs de CDN (Tailwind,
 * Lucide, Chart.js), roda o init() e exercita TODOS os modais, inputs,
 * validações e fluxos de estado — sem navegador.
 *
 * Rodar:  npm i --no-save jsdom && node scripts/dashboard-smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../public/dashboard.html', import.meta.url), 'utf8');

// remove os <script src> de CDN — as globals são stubbadas no beforeParse
const htmlNoCdn = html.replace(/<script src="[^"]*"><\/script>/g, '');

let failures = 0, passed = 0;
const fail = msg => { failures++; console.error('  ✗ ' + msg); };
const ok = msg => { passed++; console.log('  ✓ ' + msg); };
const section = t => console.log('\n— ' + t);

const dom = new JSDOM(htmlNoCdn, {
  url: 'https://englishpatio.com.br/dashboard',
  runScripts: 'dangerously',          // executa os <script> inline como um navegador (escopo global compartilhado)
  pretendToBeVisual: true,
  beforeParse(window) {
    window.tailwind = { config: {} };
    window.lucide = { createIcons(){} };
    class ChartStub {
      constructor(_el, cfg){ this.data = cfg?.data ?? { datasets: [{}] }; this.options = cfg?.options ?? {}; }
      update(){} destroy(){}
    }
    ChartStub.defaults = { font:{}, color:'', plugins:{ tooltip:{} } };
    window.Chart = ChartStub;
    // jsdom não implementa canvas 2D nem scroll
    window.HTMLCanvasElement.prototype.getContext = () => ({
      createLinearGradient: () => ({ addColorStop(){} }),
      fillRect(){}, clearRect(){}, beginPath(){}, arc(){}, fill(){}, stroke(){}, save(){}, restore(){},
    });
    window.HTMLElement.prototype.scrollIntoView = function(){};
    window.matchMedia = q => ({ matches:false, media:q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
    window.scrollTo = () => {};
    window.localStorage.setItem('ep-tours-off', '1'); // sem tour automático atrapalhando o teste
  },
});
const { window } = dom;
const { document } = window;
const W = window;

/* ---------- boot ---------- */
section('Boot');
const bootErrors = [];
window.addEventListener('error', e => bootErrors.push(e.message));
try {
  if (W.eval('typeof STUDENTS') === 'undefined') throw new Error('scripts inline não rodaram');
  if (!W.eval('inited')) W.eval('init(); inited=true;');
  bootErrors.length === 0 ? ok('página + init() sem exceção') : fail('erros no boot: ' + bootErrors.join(' | '));
} catch (e) { fail('boot explodiu: ' + e.message); }

const $ = id => document.getElementById(id);
const STUDENTS = W.eval('STUDENTS');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const dvNum = W.eval('dvNum'), isFuture = W.eval('isFuture');

section('Base de dados gerada');
const act = STUDENTS.filter(s => s.active !== false);
const kids = STUDENTS.reduce((a, s) => a + s.kids.length, 0);
kids >= 140 && kids <= 165 ? ok(`${kids} alunos em ${STUDENTS.length} matrículas`) : fail(`base estranha: ${kids} alunos`);
STUDENTS.every(s => /^\d{2}\/\d{2}\/\d{4}$/.test(s.date)) ? ok('todas as datas válidas') : fail('data malformada na base');
new Set(STUDENTS.map(s => s.id)).size === STUDENTS.length ? ok('ids únicos') : fail('ids duplicados');

/* ---------- navegação por todas as views ---------- */
section('Navegação (go) em todas as views');
for (const view of Object.keys(W.eval('VIEW_LABEL'))) {
  try { W.go(view); ok(`go('${view}')`); } catch (e) { fail(`go('${view}'): ${e.message}`); }
}

/* ---------- handlers inline apontam para funções existentes ---------- */
section('Todos os handlers inline existem');
{
  const handlerAttrs = ['onclick','oninput','onchange','onpointerdown','ondrop','ondragover','ondragleave','onmouseenter','onmouseleave','onsubmit','onkeydown'];
  const missing = new Set();
  // varre o DOM atual + os templates JS (strings com onclick=" dentro dos scripts)
  const names = new Set();
  // só chamadas "soltas" (sem ponto antes) e fora de strings — método/texto de toast não conta
  const extract = v => {
    const clean = v.replace(/'[^']*'/g, "''").replace(/`[^`]*`/g, '``');
    for (const m of clean.matchAll(/(?<![.\w$'"])([a-zA-Z_$][\w$]*)\s*\(/g)) names.add(m[1]);
  };
  document.querySelectorAll('*').forEach(el => {
    for (const a of handlerAttrs) { const v = el.getAttribute?.(a); if (v) extract(v); }
  });
  for (const src of scripts) {
    for (const m of src.matchAll(/on(?:click|input|change|pointerdown|drop|dragover|dragleave)="([^"]*)"/g)) extract(m[1]);
  }
  const builtins = new Set(['event','Event','String','Number','parseInt','Math','localStorage','document','window','alert','setTimeout','requestAnimationFrame','CustomEvent','if','for','return','var','let','const','this','new','typeof','function','true','false','null']);
  for (const n of names) {
    if (builtins.has(n)) continue;
    const t = W.eval(`typeof ${n}`);
    if (t !== 'function') missing.add(n);
  }
  missing.size === 0 ? ok(`${names.size} nomes de handler resolvidos`) : fail('handlers inexistentes: ' + [...missing].join(', '));
}

/* ---------- alvos dos tours existem em cada tela ---------- */
section('Alvos dos tours existem');
{
  const TOURS = W.eval('TOURS');
  for (const [view, steps] of Object.entries(TOURS)) {
    try { W.go(view === 'modelos' ? 'modelos' : view); } catch {}
    if (view === 'modelos') { try { W.openModelos(); } catch {} }
    for (const s of steps) {
      if (!s.target) continue;
      document.querySelector(s.target) ? ok(`${view} → ${s.target}`) : fail(`${view}: alvo do tour não existe: ${s.target}`);
    }
  }
}

/* ---------- nova matrícula: validação + criação ---------- */
section('Modal: nova matrícula');
{
  const before = STUDENTS.length;
  W.openNewEnrollment();
  W.submitNewEnrollment(); // vazio → não deve criar
  STUDENTS.length === before ? ok('vazio não cria matrícula') : fail('criou matrícula sem nome!');
  $('nmStudent').value = 'Teste da Silva Sauro';
  $('nmResp').value = 'Mãe do Teste Sauro';
  $('nmBirth').value = '10/10/2017';
  W.submitNewEnrollment();
  STUDENTS.length === before + 1 ? ok('preenchido cria matrícula') : fail('não criou matrícula válida');
  STUDENTS[0].kids[0].n === 'Teste da Silva Sauro' ? ok('entrou no topo da lista') : fail('não está no topo');
}

/* ---------- desligamento: validações do modal ---------- */
section('Modal: desligar aluno');
{
  const s = STUDENTS.find(x => x.active !== false);
  W.openExitModal(s.id);
  $('exitConfirm').disabled ? ok('confirmar começa desabilitado') : fail('confirmar habilitado sem motivo');
  W.pickExitReason('other');
  $('exitConfirm').disabled ? ok('"Outro" sem texto continua desabilitado') : fail('"Outro" sem texto habilitou');
  $('exitNote').value = 'Motivo de teste';
  W.exitValidate();
  !$('exitConfirm').disabled ? ok('"Outro" com texto habilita') : fail('não habilitou com texto');
  W.confirmExit(s.id);
  s.active === false && s.exit?.k === 'other' ? ok('desligou com motivo registrado') : fail('não desligou direito');
  W.reactivateStudent(s.id);
  s.active === true && !s.exit ? ok('reativar limpa o desligamento') : fail('reativação incompleta');
}

/* ---------- edição: salvar + data inválida não pode gerar idade absurda ---------- */
section('Modal: editar matrícula');
{
  const s = STUDENTS.find(x => x.active !== false);
  W.openEditEnrollment(s.id);
  $('edKid0').value = 'Nome Editado Teste';
  $('edPhone').value = '(62) 91234-5678';
  W.saveEditEnrollment(s.id);
  s.kids[0].n === 'Nome Editado Teste' && s.resp.phone === '(62) 91234-5678'
    ? ok('edição salva') : fail('edição não salvou');
  W.openEditEnrollment(s.id);
  $('edKidB0').value = '99/99/9999'; // data impossível
  W.saveEditEnrollment(s.id);
  s.kids[0].age >= 1 && s.kids[0].age <= 25 ? ok(`data inválida não corrompe a idade (ficou ${s.kids[0].age})`) : fail(`idade corrompida: ${s.kids[0].age}`);
}

/* ---------- exclusão ---------- */
section('Modal: excluir matrícula');
{
  const victim = STUDENTS[0];
  const before = STUDENTS.length;
  W.openDeleteModal(victim.id);
  W.confirmDelete(victim.id);
  STUDENTS.length === before - 1 && !STUDENTS.find(x => x.id === victim.id)
    ? ok('excluiu de vez') : fail('exclusão falhou');
}

/* ---------- importação: dedup + idempotência + validações ---------- */
section('Importação de planilha');
{
  W.openImportModal();
  W.runImport('', 'vazio.csv');
  $('importError').innerHTML.includes('vazia') ? ok('arquivo vazio é recusado') : fail('aceitou arquivo vazio');
  W.openImportModal();
  W.runImport('a,b,c\n1,2,3', 'errado.csv');
  $('importError').innerHTML.includes('não parece') ? ok('planilha sem as colunas certas é recusada') : fail('aceitou planilha errada');
  // a amostra embutida: 6 linhas → 1 dup, 1 já existe (Helena), 4 novas
  const before = STUDENTS.length;
  W.openImportModal();
  W.runImport(W.eval('IMPORT_SAMPLE'), 'exemplo.csv');
  const pend = W.eval('pendingImport');
  pend?.length === 4 ? ok('amostra: 4 novas (1 duplicada e 1 existente ignoradas)') : fail(`amostra gerou ${pend?.length} novas`);
  W.applyImport();
  STUDENTS.length === before + 4 ? ok('importação aplicada') : fail('não aplicou');
  // idempotência: importar de novo → 0 novas
  W.openImportModal();
  W.runImport(W.eval('IMPORT_SAMPLE'), 'exemplo.csv');
  W.eval('pendingImport')?.length === 0 ? ok('re-importar a mesma planilha não duplica nada') : fail('REIMPORTAÇÃO DUPLICOU!');
  // validação de tipo de arquivo
  W.openImportModal();
  W.importReadFile({ name: 'foto.png', size: 100 });
  $('importError').innerHTML.includes('não é um arquivo .csv') ? ok('.png recusado') : fail('aceitou .png');
  W.importReadFile({ name: 'grande.csv', size: 11 * 1024 * 1024 });
  $('importError').innerHTML.includes('grande') ? ok('>10MB recusado') : fail('aceitou arquivo gigante');
}

/* ---------- modelos de contrato ---------- */
section('Modelos de contrato');
{
  W.openModelos();
  const TEMPLATES = W.eval('TEMPLATES');
  // importar: validações
  W.openTplImport();
  $('tplImportGo').disabled ? ok('importar começa desabilitado') : fail('importar habilitado sem nada');
  W.tplTake({ name: 'contrato.docx', size: 1000 });
  $('tplImportError').innerHTML.includes('não é um PDF') ? ok('.docx recusado') : fail('aceitou .docx');
  W.tplTake({ name: 'contrato-novo.pdf', size: 200 * 1024 });
  $('tplName').value = TEMPLATES[0].name; // nome duplicado
  W.tplImportValidate();
  W.confirmTplImport();
  $('tplImportError').innerHTML.includes('Já existe') ? ok('nome duplicado recusado') : fail('aceitou nome duplicado');
  $('tplName').value = 'Contrato Teste 2099';
  W.confirmTplImport();
  const novo = TEMPLATES.find(t => t.name === 'Contrato Teste 2099');
  novo ? ok('PDF novo importado') : fail('não importou');
  // novo modelo tem campos pendentes → não pode ativar
  W.setActiveTpl(novo.id);
  !novo.active ? ok('modelo com campos pendentes não ativa') : fail('ATIVOU MODELO INCOMPLETO!');
  // posiciona os pendentes → aí pode
  novo.fields.filter(f => !f.mapped).forEach(f => W.tplPlaceField(f.k));
  W.setActiveTpl(novo.id); W.confirmActiveTpl(novo.id);
  novo.active ? ok('com tudo mapeado, ativa') : fail('não ativou depois de mapear');
  // ativo não pode ser excluído
  const before = TEMPLATES.length;
  W.deleteTpl(novo.id);
  TEMPLATES.length === before ? ok('modelo em uso não é excluído') : fail('EXCLUIU O MODELO EM USO!');
  // devolve o estado: reativa o original e exclui o de teste
  W.confirmActiveTpl(TEMPLATES.find(t => t.name.includes('2026.2')).id);
  W.deleteTpl(novo.id); W.confirmDeleteTpl(novo.id);
  !TEMPLATES.find(t => t.name === 'Contrato Teste 2099') ? ok('arquivado pode ser excluído') : fail('não excluiu arquivado');
}

/* ---------- filtros: data + situação + coorte ---------- */
section('Filtros de data, situação e coorte');
{
  W.go('alunos');
  $('alunoSearch').value = '';
  W.clearFilters();
  $('fFrom').value = '01/05/2026'; W.tableChanged();
  const shown = W.filteredStudents();
  shown.every(s => dvNum(s) >= 20260501) ? ok(`de 01/05 → só matrículas recentes (${shown.length})`) : fail('filtro "de" vazou');
  $('fTo').value = '31/05/2026'; W.tableChanged();
  W.filteredStudents().every(s => dvNum(s) <= 20260531) ? ok('até 31/05 funciona') : fail('filtro "até" vazou');
  W.clearFilters();
  $('fFrom').value === '' && $('fTo').value === '' ? ok('limpar zera as datas') : fail('limpar não zerou datas');
  W.csSet('fActive', 'next');
  W.filteredStudents().every(s => s.active !== false && isFuture(s)) ? ok('situação "Começam em 2026.2"') : fail('filtro next vazou');
  W.csSet('fActive', 'on');
  W.filteredStudents().every(s => s.active !== false && !isFuture(s)) ? ok('situação "Estudando agora"') : fail('filtro on vazou');
  W.clearFilters();
  // coorte da visão geral
  W.setOvCohort('next');
  const kpi = parseInt($('kpiActive').textContent, 10);
  const expected = STUDENTS.filter(s => s.active !== false && isFuture(s)).reduce((a, s) => a + s.kids.length, 0);
  kpi === expected ? ok(`coorte 2026.2 no KPI (${kpi})`) : fail(`KPI coorte errado: ${kpi} ≠ ${expected}`);
  W.setOvCohort('');
}

/* ---------- paginação ---------- */
section('Paginação');
{
  W.go('alunos');
  W.clearFilters();
  W.setTablePage(2);
  $('tableCount').textContent.startsWith('Mostrando 21–') ? ok('página 2 mostra 21–40') : fail('paginação errada: ' + $('tableCount').textContent);
  $('alunoSearch').value = 'zzz-nada'; W.tableChanged();
  $('tableBody').textContent.includes('Nenhum aluno') ? ok('busca sem resultado mostra vazio') : fail('vazio não renderiza');
  $('alunoSearch').value = ''; W.tableChanged();
}

/* ---------- datepicker dispara filtro ---------- */
section('Datepicker');
{
  W.go('alunos');
  const inp = $('fFrom');
  let fired = false;
  inp.addEventListener('input', () => fired = true, { once: true });
  W.openDatePicker({ stopPropagation(){}, currentTarget: inp.nextElementSibling, target: inp.nextElementSibling }, 'fFrom', 2026);
  W.eval('dpPick(15)');
  fired && /^\d{2}\/\d{2}\/\d{4}$/.test(inp.value) ? ok('escolher data dispara o filtro (' + inp.value + ')') : fail('datepicker não disparou input');
  W.clearFilters();
}

/* ---------- modais utilitários abrem sem explodir ---------- */
section('Modais restantes abrem sem erro');
for (const call of ['openContractModal(STUDENTS[3].id)','openDetail(STUDENTS[3].id)','openChangePass()','openAccountModal()','openInvite()','openRowMenu({stopPropagation(){},currentTarget:document.body},STUDENTS[3].id)']) {
  try { W.eval(call); ok(call); } catch (e) { fail(`${call}: ${e.message}`); }
}

/* ---------- contratos: render nas duas visões ---------- */
section('Contratos');
{
  W.go('contratos');
  W.setContractView('grid');
  $('contractGrid').children.length > 0 ? ok('grid renderiza') : fail('grid vazio');
  W.setContractView('list');
  $('contractGrid').textContent.includes('Contrato_') ? ok('lista renderiza') : fail('lista vazia');
  $('cFrom').value = '01/06/2026'; W.contractsChanged();
  W.filteredContracts().every(s => dvNum(s) >= 20260601) ? ok('filtro de data em contratos') : fail('filtro contratos vazou');
  W.clearContractFilters();
}

/* ---------- editor ---------- */
section('Editor do site');
for (const page of ['home','metodologia','vacation','matriculas']) {
  try { W.setEditorPage(page); $('editorPage').innerHTML.length > 200 ? ok(`página ${page}`) : fail(`página ${page} vazia`); }
  catch (e) { fail(`setEditorPage(${page}): ${e.message}`); }
}
try { W.setEditorDevice('mobile'); W.setEditorDevice('desktop'); ok('troca desktop/mobile'); } catch (e) { fail('device toggle: ' + e.message); }

/* ---------- resultado ---------- */
console.log(`\n${'='.repeat(50)}\n${passed} passaram · ${failures} falharam`);
process.exit(failures ? 1 : 0);
