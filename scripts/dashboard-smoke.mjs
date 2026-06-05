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
{ // "na escola desde": mistura de preenchidos e em branco, sempre em fevereiro ou agosto
  const wSince = STUDENTS.filter(s => s.since), blank = STUDENTS.length - wSince.length;
  wSince.length >= 40 && blank >= 20 ? ok(`"desde" misto: ${wSince.length} com data, ${blank} em branco`) : fail(`distribuição estranha do "desde": ${wSince.length} com data, ${blank} em branco`);
  const bad = wSince.find(s => !/^\d{2}\/(02|08)\/\d{4}$/.test(s.since));
  !bad ? ok('todo "desde" cai em fevereiro ou agosto') : fail(`"desde" fora de fev/ago: ${bad.since}`);
}

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
  // CRUD do "na escola desde"
  W.openEditEnrollment(s.id);
  $('edSince').value = '05/02/2024';
  W.saveEditEnrollment(s.id);
  s.since === '05/02/2024' ? ok('"na escola desde" salva') : fail(`"desde" não salvou: ${s.since}`);
  W.openEditEnrollment(s.id);
  $('edSince').value = '99/99'; // incompleta/inválida
  W.saveEditEnrollment(s.id);
  s.since === '05/02/2024' ? ok('"desde" inválido mantém o valor anterior') : fail(`"desde" corrompido: ${s.since}`);
  W.openEditEnrollment(s.id);
  $('edSince').value = '';
  W.saveEditEnrollment(s.id);
  !s.since ? ok('"desde" vazio limpa o registro') : fail('"desde" não limpou');
  // campos completos: CPF, endereço, financeiro, autorização de imagem e 2º responsável
  W.openEditEnrollment(s.id);
  $('edCpf').value = '123.456.789-09';
  $('edCep').value = '74000-123';
  $('edStreet').value = 'Rua de Teste';
  $('edNum').value = '42';
  $('edCity').value = 'Goiânia';
  $('edFin').value = 'Financeiro Teste';
  $('edMedia').classList.remove('on'); // desautoriza imagem
  $('edSecN').value = 'Segundo Resp Teste';
  $('edSecP').value = '(62) 90000-0000';
  $('edSecR').value = 'Tio';
  W.saveEditEnrollment(s.id);
  s.resp.cpf === '123.456.789-09' && s.addr.cep === '74000-123' && s.addr.street === 'Rua de Teste'
    && s.fin === 'Financeiro Teste' && s.media === false && s.second?.n === 'Segundo Resp Teste' && s.second?.rel === 'Tio'
    ? ok('edição completa salva (CPF, endereço, financeiro, imagem, 2º responsável)') : fail('edição completa não salvou tudo');
  W.openEditEnrollment(s.id);
  $('edSecN').value = ''; // nome vazio remove o 2º responsável
  W.saveEditEnrollment(s.id);
  s.second === null ? ok('2º responsável removido ao apagar o nome') : fail('2º responsável não removeu');
  W.openEditEnrollment(s.id);
  $('edCpf').value = '123'; // CPF incompleto não corrompe
  W.saveEditEnrollment(s.id);
  s.resp.cpf === '123.456.789-09' ? ok('CPF inválido mantém o anterior') : fail(`CPF corrompido: ${s.resp.cpf}`);
}

/* ---------- usuários: editar, papel, remover ---------- */
section('CRUD de usuários');
{
  const USERS = W.eval('USERS');
  const before = USERS.length;
  W.openEditUser(3); // Stefany (Secretaria)
  $('euName').value = 'Stefany Editada';
  W.saveUser(3);
  USERS.find(u => u.id === 3)?.n === 'Stefany Editada' ? ok('editar usuário salva') : fail('edição de usuário não salvou');
  // proteção: não deixar o painel sem administrador
  W.openRemoveUser(2); W.confirmRemoveUser(2); // remove Gabriel (admin, mas sobra Priscylla)
  USERS.length === before - 1 ? ok('remover acesso funciona') : fail('remoção não funcionou');
  W.openEditUser(1); W.csSet('euRole', 'secretaria'); W.saveUser(1);
  USERS.find(u => u.id === 1)?.r === 'Administrador' ? ok('última pessoa admin não vira Secretaria') : fail('PAINEL FICOU SEM ADMIN!');
  W.openRemoveUser(1);
  USERS.find(u => u.id === 1) ? ok('última pessoa admin não pode ser removida') : fail('REMOVEU O ÚLTIMO ADMIN!');
  W.closeModal();
}

/* ---------- turmas: capacidade, criar e excluir ---------- */
section('CRUD de turmas');
{
  const CAP = W.eval('TURMA_CAP');
  W.openTurmas();
  const capAntes = CAP['seg-qua']['14h00–15h30'];
  W.tCapStep('seg-qua', '14h00–15h30', 1);
  CAP['seg-qua']['14h00–15h30'] === capAntes + 1 ? ok('aumentar capacidade') : fail('capacidade não subiu');
  W.tCapStep('seg-qua', '14h00–15h30', -1);
  CAP['seg-qua']['14h00–15h30'] === capAntes ? ok('diminuir capacidade') : fail('capacidade não desceu');
  // não desce abaixo da ocupação
  const occ = W.turmaOcc()['seg-qua|14h00–15h30'] || 0;
  CAP['seg-qua']['14h00–15h30'] = occ;
  W.tCapStep('seg-qua', '14h00–15h30', -1);
  CAP['seg-qua']['14h00–15h30'] === occ ? ok('capacidade não desce abaixo da ocupação') : fail('capacidade ficou menor que a turma!');
  CAP['seg-qua']['14h00–15h30'] = capAntes; // restaura
  // criar horário novo
  W.csSet('ntSch', 'ter-qui');
  $('ntIni').value = '19h00'; $('ntFim').value = '20h30'; $('ntCap').value = '12';
  W.addTurma();
  CAP['ter-qui']['19h00–20h30'] === 12 ? ok('horário novo criado') : fail('não criou horário');
  // duplicado é recusado
  $('ntIni').value = '19h00'; $('ntFim').value = '20h30'; $('ntCap').value = '10';
  W.addTurma();
  $('ntErr').innerHTML.includes('já existe') ? ok('horário duplicado recusado') : fail('aceitou duplicado');
  // turma vazia pode ser excluída; ocupada não
  W.deleteTurma('ter-qui', '19h00–20h30');
  W.confirmDeleteTurma('ter-qui', '19h00–20h30');
  !('19h00–20h30' in CAP['ter-qui']) ? ok('turma vazia excluída') : fail('não excluiu turma vazia');
  const cheia = Object.keys(CAP['seg-qua'])[0];
  W.openTurmas();
  W.deleteTurma('seg-qua', cheia); // tem alunos → não abre confirmação
  CAP['seg-qua'][cheia] != null ? ok('turma com alunos não é excluída') : fail('EXCLUIU TURMA OCUPADA!');
  W.closeModal();
}

/* ---------- modelos de e-mail: criar, editar, excluir ---------- */
section('CRUD de modelos de e-mail');
{
  const TPLS = W.eval('EMAIL_TPLS');
  const before = TPLS.length;
  W.go('emails');
  W.openTplEdit(null);
  W.eval("saveTplEdit(null)"); // vazio → erro, não cria
  TPLS.length === before ? ok('modelo vazio não é criado') : fail('criou modelo vazio');
  $('tplEL').value = 'Reunião de pais';
  $('tplES').value = 'Reunião de pais — English Patio';
  $('tplEB').value = 'Olá, {{nome_responsavel}}! Teremos reunião.';
  W.eval("saveTplEdit(null)");
  TPLS.length === before + 1 ? ok('modelo novo criado') : fail('não criou modelo');
  const novo = TPLS.find(t => t.l === 'Reunião de pais');
  // nome duplicado recusado
  W.openTplEdit(null);
  $('tplEL').value = 'reunião de pais'; $('tplES').value = 'x'; $('tplEB').value = 'y';
  W.eval("saveTplEdit(null)");
  TPLS.length === before + 1 ? ok('nome duplicado recusado') : fail('aceitou nome duplicado');
  // editar
  W.openTplEdit(novo.k);
  $('tplES').value = 'Assunto Editado';
  W.eval(`saveTplEdit('${novo.k}')`);
  novo.s === 'Assunto Editado' ? ok('modelo editado') : fail('edição de modelo não salvou');
  // aplicar preenche o comunicado
  W.go('emails'); W.closeModal();
  W.applyEmailTpl(novo.k);
  $('emailSubject').value === 'Assunto Editado' ? ok('aplicar modelo preenche o comunicado') : fail('aplicar não preencheu');
  // excluir
  W.deleteEmailTpl(novo.k);
  W.confirmDeleteEmailTpl(novo.k);
  !TPLS.find(t => t.k === novo.k) ? ok('modelo excluído') : fail('não excluiu modelo');
  W.closeModal();
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
  // a amostra embutida: 9 linhas → 1 repetida exata, 1 já existe (Helena), 2 versões do Otto
  // (vale a mais recente), Alice homônima e Vicente com dados estranhos → 6 novas, 3 para conferir
  const before = STUDENTS.length;
  W.openImportModal();
  W.runImport(W.eval('IMPORT_SAMPLE'), 'exemplo.csv');
  const pend = W.eval('pendingImport');
  pend?.length === 6 ? ok('amostra: 6 novas (1 repetida e 1 existente ignoradas)') : fail(`amostra gerou ${pend?.length} novas`);
  const flagged = (pend || []).filter(p => p._warn?.length);
  flagged.length === 3 ? ok('3 marcadas para conferir (conflito, homônima, dados estranhos)') : fail(`${flagged.length} marcadas para conferir`);
  pend?.find(p => p.kids[0].n === 'Otto Faria Neves')?.resp.phone === '(62) 99662-8801'
    ? ok('duas versões do mesmo aluno → vale a linha mais recente') : fail('conflito não ficou com a linha mais recente');
  // desmarcar a homônima na lista de conferência → não entra
  const ai = pend.findIndex(p => p.kids[0].n === 'Alice Barbosa Nunes');
  W.impToggle(ai);
  W.applyImport();
  STUDENTS.length === before + 5 ? ok('importou 5 (a desmarcada ficou de fora)') : fail(`importou ${STUDENTS.length - before}, esperava 5`);
  STUDENTS.every(s => !('_warn' in s) && !('_skip' in s)) ? ok('marcas internas não vazam para a base') : fail('_warn/_skip vazou para a base');
  const otto = STUDENTS.find(s => s.kids[0].n === 'Otto Faria Neves');
  otto && !otto.since ? ok('importada chega com "na escola desde" em branco') : fail('importada veio com "desde" preenchido');
  // re-importar: só a Alice (deixada de fora) volta a ser oferecida
  W.openImportModal();
  W.runImport(W.eval('IMPORT_SAMPLE'), 'exemplo.csv');
  W.eval('pendingImport')?.length === 1 ? ok('re-importar só oferece quem ficou de fora') : fail('REIMPORTAÇÃO DUPLICOU!');
  W.applyImport();
  // terceira vez: nada novo
  W.openImportModal();
  W.runImport(W.eval('IMPORT_SAMPLE'), 'exemplo.csv');
  W.eval('pendingImport')?.length === 0 ? ok('com tudo dentro, nada novo aparece') : fail('terceira importação ainda achou novidade');
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
  // renomear
  const alvo = TEMPLATES.find(t => t.name === 'Contrato 2026.1');
  W.openTplRename(alvo.id);
  $('tplRN').value = 'Contrato 2026.1 (revisado)';
  W.saveTplRename(alvo.id);
  alvo.name === 'Contrato 2026.1 (revisado)' ? ok('renomear modelo de contrato') : fail('não renomeou');
  W.openTplRename(alvo.id);
  $('tplRN').value = TEMPLATES.find(t => t.name.includes('2026.2')).name; // nome já usado
  W.saveTplRename(alvo.id);
  alvo.name === 'Contrato 2026.1 (revisado)' ? ok('nome de modelo duplicado recusado') : fail('aceitou nome duplicado');
  W.closeModal();
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

/* ---------- Autentique: 4 status, contratos parados e linha do tempo ---------- */
section('Autentique (assinatura digital)');
{
  const STATUS = W.eval('STATUS');
  ['pending','sent','viewed','signed'].every(k => STATUS[k]) ? ok('4 status do funil (inclui Visualizado)') : fail('status do Autentique faltando');
  STUDENTS.some(s => s.status === 'viewed') ? ok('base tem contratos visualizados') : fail('nenhum contrato "viewed" na base');
  const isStale = W.eval('isStale');
  const stale = STUDENTS.filter(s => isStale(s));
  stale.length > 0 ? ok(`${stale.length} contratos parados há 7+ dias (badge tem o que mostrar)`) : fail('nenhum contrato parado na base');
  stale.every(s => s.status === 'sent' || s.status === 'viewed') ? ok('"parado" só vale para enviado/visualizado') : fail('isStale pegou status errado');
  W.go('contratos');
  W.csSet('cStatus', 'viewed');
  const vis = W.filteredContracts();
  vis.length > 0 && vis.every(s => s.status === 'viewed') ? ok(`filtro "Visualizados" funciona (${vis.length})`) : fail('filtro viewed vazou');
  W.clearContractFilters();
  $('contractGrid').textContent.includes('parado há') ? ok('badge "parado há N dias" aparece na lista') : fail('badge de parado não renderizou');
  // linha do tempo no modal do contrato
  const sv = STUDENTS.find(s => s.status === 'viewed');
  W.openContractModal(sv.id);
  const box = $('modalBox').textContent;
  box.includes('Autentique') && box.includes('Visualizado pela família') ? ok('modal mostra a linha do tempo do Autentique') : fail('modal sem timeline');
  W.closeModal();
  const sp = STUDENTS.find(s => s.status === 'pending' && s.active !== false);
  W.openContractModal(sp.id);
  $('modalBox').textContent.includes('na fila de envio') ? ok('pendente mostra "na fila de envio"') : fail('timeline de pendente errada');
  W.closeModal();
  // visão geral: funil com 4 barras + alerta de parados
  W.go('overview');
  const health = $('contractHealth').textContent;
  health.includes('Visualizados') && health.includes('parado') ? ok('funil da visão geral tem Visualizados + alerta de parados') : fail('andamento dos contratos incompleto');
}

/* ---------- registro de atividades ---------- */
section('Registro de atividades');
{
  const ACT = W.eval('ACTIVITY');
  W.go('atividade');
  $('actList').children.length > 0 ? ok('lista de atividades renderiza') : fail('atividade vazia');
  $('actList').textContent.includes('Autentique') ? ok('eventos do Autentique aparecem no registro') : fail('sem eventos do Autentique');
  // ações no painel entram no registro
  const before = ACT.length;
  const s = STUDENTS.find(x => x.active !== false && x.status !== 'signed');
  W.markSigned(s.id);
  ACT.length === before + 1 && ACT[0].t === 'agora' ? ok('marcar assinado entra no registro ("agora")') : fail('ação não registrou');
  // busca + filtro por pessoa
  W.go('atividade');
  $('actSearch').value = 'zzz-nada'; W.renderActivity();
  $('actList').textContent.includes('Nenhuma atividade') ? ok('busca sem resultado mostra vazio') : fail('vazio não renderiza');
  $('actSearch').value = ''; W.csSet('actWho', 'Autentique'); W.renderActivity();
  $('actList').textContent.includes('Autentique') && !$('actList').textContent.includes('Exportou') ? ok('filtro por pessoa funciona') : fail('filtro por pessoa vazou');
  W.csSet('actWho', ''); W.renderActivity();
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
