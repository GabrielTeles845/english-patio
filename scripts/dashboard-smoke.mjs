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
  // o modal passou a exigir CPF/telefone/e-mail/bairro válidos (validação real do submit)
  $('nmCpf').value = '111.444.777-35';   // CPF com dígitos verificadores corretos, fora do mock
  $('nmPhone').value = '(62) 99999-0000';
  $('nmEmail').value = 'teste@exemplo.com';
  $('nmHood').value = 'Setor Bueno';
  W.submitNewEnrollment();
  STUDENTS.length === before + 1 ? ok('preenchido cria matrícula') : fail('não criou matrícula válida');
  STUDENTS[0].kids[0].n === 'Teste da Silva Sauro' ? ok('entrou no topo da lista') : fail('não está no topo');
  // remove a matrícula de teste: os testes seguintes (desligar/editar/importar) usam
  // STUDENTS.find(active) e a importação depende dos alunos originais (ex.: a Helena, que
  // o IMPORT_SAMPLE espera encontrar) — deixar o aluno de teste aqui poluiria tudo
  { const i = STUDENTS.findIndex(s => s.kids[0]?.n === 'Teste da Silva Sauro'); if (i >= 0) STUDENTS.splice(i, 1); }
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
  W.csSet('edCity', 'Goiânia'); // cidade agora é select, já marcado com o valor atual
  $('edFin').value = 'Financeiro Teste';
  $('edMedia').classList.remove('on'); // desautoriza imagem
  $('edSecN').value = 'Segundo Resp Teste';
  $('edSecP').value = '(62) 90000-0000';
  $('edSecR').value = 'Tio';
  $('edSecC').value = '987.654.321-00'; // CPF do 2º responsável (campo do site)
  W.saveEditEnrollment(s.id);
  s.resp.cpf === '123.456.789-09' && s.addr.cep === '74000-123' && s.addr.street === 'Rua de Teste'
    && s.fin === 'Financeiro Teste' && s.media === false && s.second?.n === 'Segundo Resp Teste' && s.second?.rel === 'Tio'
    ? ok('edição completa salva (CPF, endereço, financeiro, imagem, 2º responsável)') : fail('edição completa não salvou tudo');
  s.second?.cpf === '987.654.321-00' ? ok('CPF do 2º responsável salvo (paridade com o site)') : fail('CPF do 2º responsável não salvou');
  s.addr.city === 'Goiânia' ? ok('cidade vem marcada e salva pelo select') : fail('cidade não salvou');
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
  new Set(USERS.map(u => u.r)).size === 3 ? ok('3 papéis na base (Diretor, Supervisor, Secretaria)') : fail('papéis: ' + [...new Set(USERS.map(u => u.r))].join(','));
  W.openEditUser(4); // Stefany (Secretaria)
  $('euName').value = 'Stefany Editada';
  W.saveUser(4);
  USERS.find(u => u.id === 4)?.n === 'Stefany Editada' ? ok('editar usuário salva') : fail('edição de usuário não salvou');
  // proteção: não deixar o painel sem ninguém com papel Diretor
  W.openRemoveUser(2); W.confirmRemoveUser(2); // remove Gabriel (Diretor, mas sobra Priscylla)
  USERS.length === before - 1 ? ok('remover acesso funciona') : fail('remoção não funcionou');
  W.openEditUser(1); W.csSet('euRole', 'secretaria'); W.saveUser(1);
  USERS.find(u => u.id === 1)?.r === 'Diretor' ? ok('última pessoa Diretor não vira Secretaria') : fail('PAINEL FICOU SEM DIRETOR!');
  W.openRemoveUser(1);
  USERS.find(u => u.id === 1) ? ok('última pessoa Diretor não pode ser removida') : fail('REMOVEU O ÚLTIMO DIRETOR!');
  W.closeModal();
}

/* ---------- papéis: "ver painel como…" (gating simulado) ---------- */
section('Papéis e "ver painel como…"');
{
  W.eval('go("usuarios")');
  W.setViewAs('Supervisor');
  W.eval('VIEW_AS') === 'Supervisor' ? ok('setViewAs muda o papel simulado') : fail('VIEW_AS não mudou');
  !W.roleAllows('contratos') && !W.roleAllows('emails') && !W.roleAllows('usuarios')
    ? ok('Supervisor não acessa contratos/comunicados/usuários') : fail('gating do Supervisor furou');
  W.roleAllows('agenda') && W.roleAllows('alunos') ? ok('Supervisor acessa agenda e alunos') : fail('Supervisor sem agenda/alunos');
  W.eval('go("contratos")');
  W.eval('currentView()') !== 'contratos' ? ok('go() bloqueia tela fora do papel') : fail('go() deixou Supervisor entrar em contratos');
  !$('viewAsBar').classList.contains('hidden') ? ok('faixa "vendo como" aparece') : fail('faixa de simulação não apareceu');
  document.querySelector('[data-nav="emails"]').classList.contains('hidden') ? ok('sidebar esconde itens fora do papel') : fail('sidebar não escondeu Comunicados');
  document.querySelector('[data-perm="alunos-write"]').classList.contains('hidden') ? ok('Supervisor não vê "Nova matrícula"/importar') : fail('botões de escrita visíveis p/ Supervisor');
  W.setViewAs('Secretaria');
  W.roleAllows('contratos') && !W.roleAllows('editor') ? ok('Secretaria acessa contratos, não o editor') : fail('gating da Secretaria furou');
  W.setViewAs('Diretor');
  W.roleAllows('editor') && $('viewAsBar').classList.contains('hidden') ? ok('voltar a Diretor restaura tudo') : fail('volta a Diretor não restaurou');
}

/* ---------- visão geral: estatísticas operacionais ---------- */
section('Visão geral: teachers, vagas, radar, períodos e saídas');
{
  W.eval('renderOpsStats()');
  $('teacherList').children.length >= 3 ? ok('alunos por teacher renderiza') : fail('teacherList vazio');
  $('teacherList').textContent.includes('Mariana') ? ok('teacher com sala aparece na lista') : fail('teachers sem nomes');
  $('vagasNivelList').children.length >= 5 ? ok('vagas por nível renderiza') : fail('vagasNivelList vazio');
  $('vagasNivelList').textContent.includes('lotado') ? ok('nível lotado destacado ("lotado")') : fail('nenhum nível lotado na lista');
  $('vagasNivelList').textContent.includes('vaga') ? ok('níveis com vaga mostram a contagem') : fail('vagas não aparecem');
  $('opsAlerts').children.length === 4 ? ok('radar com 4 alertas operacionais') : fail(`radar com ${$('opsAlerts').children.length} alertas`);
  $('opsAlerts').textContent.includes('aguardando turma') && $('opsAlerts').textContent.includes('lotadas') ? ok('radar cobre fila + turmas lotadas') : fail('alertas do radar incompletos');
  $('periodSplit').textContent.includes('Manhã') && $('periodSplit').textContent.includes('Tarde') ? ok('manhã × tarde renderiza') : fail('periodSplit incompleto');
  $('exitReasons').children.length >= 1 ? ok('saídas por motivo renderiza') : fail('exitReasons vazio');
  $('exitFacts').textContent.includes('Mês com mais saídas') && $('exitFacts').textContent.includes('Sala que mais perdeu') ? ok('fatos das saídas (mês pico, sala que mais perdeu)') : fail('exitFacts incompleto');
}

/* ---------- agenda: salas, turmas, visões, mover aluno e fila ---------- */
section('Agenda: salas, turmas, mover aluno e fila');
{
  const TURMAS = W.eval('TURMAS'), SALAS = W.eval('SALAS');
  const kidTurma = W.eval('kidTurma'), turmaById = W.eval('turmaById'), salaById = W.eval('salaById'), nivelByK = W.eval('nivelByK');
  SALAS.length === 13 ? ok('13 salas com nome de cor') : fail(`${SALAS.length} salas`);
  TURMAS.every(t => t.cap >= 1 && t.cap <= 7) ? ok('toda turma tem capacidade ≤ 7 (padrão da escola)') : fail('turma com cap > 7');
  const tids = new Set(TURMAS.map(t => t.id));
  STUDENTS.every(s => s.kids.every(k => !k.tid || tids.has(k.tid))) ? ok('todo aluno aponta para turma existente') : fail('tid órfão na base');
  TURMAS.every(t => W.activeKidsIn(t.id) <= t.cap) ? ok('nenhuma turma acima da capacidade') : fail('turma estourada!');
  TURMAS.some(t => W.activeKidsIn(t.id) >= t.cap) ? ok('existem turmas CHEIAS na história') : fail('nenhuma turma cheia');
  // níveis coerentes com a idade (tolerância de ±1 ano usada na alocação)
  const incoerente = [];
  STUDENTS.forEach(s => s.kids.forEach(k => { const t = kidTurma(k); if (!t) return;
    const nv = nivelByK(t.nivel); if (k.age < nv.ages[0] - 1 || k.age > nv.ages[1] + 1) incoerente.push(k.n); }));
  incoerente.length === 0 ? ok('idades coerentes com o nível da turma') : fail('idade × nível incoerente: ' + incoerente.slice(0, 3).join(', '));
  // fila de sem turma
  const fila = W.semTurmaKids();
  fila.length >= 3 ? ok(`${fila.length} alunos aguardando turma (fila tem o que mostrar)`) : fail('fila de sem turma vazia');
  // as 3 visões renderizam
  W.go('agenda');
  W.setAgView('grade');
  $('agBody').innerHTML.includes('Horário') && $('agBody').textContent.includes('CHEIA') ? ok('grade geral renderiza (com CHEIA)') : fail('grade vazia');
  W.setAgView('salas');
  $('agBody').textContent.includes('Green') ? ok('cards de salas renderizam') : fail('cards de salas vazios');
  W.openSalaView('green');
  $('salaPage') && $('agBody').textContent.includes('GREEN ROOM') ? ok('página da sala no formato do Canva') : fail('página da sala não renderizou');
  $('agBody').textContent.includes('NÃO TEM VAGA') ? ok('turma cheia mostra "NÃO TEM VAGA" como no Canva') : fail('sem "NÃO TEM VAGA" na página da sala');
  $('agBody').textContent.includes('Teacher Mariana Rios') ? ok('teacher aparece quando preenchido') : fail('teacher sumiu da página da sala');
  W.setAgView('mural');
  const cards = $('agBody').querySelectorAll('.mural-card').length;
  cards >= 5 ? ok(`mural mostra os cards das salas (${cards})`) : fail(`mural com só ${cards} cards`);
  $('agBody').textContent.includes('NÃO TEM VAGA') ? ok('mural mantém o vocabulário do Canva (NÃO TEM VAGA)') : fail('mural sem NÃO TEM VAGA');
  $('agBody').textContent.includes('NOVO') || $('agBody').textContent.includes('NOVA') ? ok('mural marca alunos novos') : fail('mural sem NOVO/NOVA');
  $('agBody').querySelectorAll('[draggable="true"]').length > 20 ? ok('chips de aluno do mural são arrastáveis') : fail('mural sem chips arrastáveis');
  document.querySelectorAll('[data-view="agenda"] .qm').length >= 3 ? ok('pontinhos "?" de ajuda espalhados na Agenda') : fail('faltam os "?" de ajuda');
  W.eval('TOURS.agenda.length') === 4 ? ok('tour da Agenda enxuto (4 passos, o resto é "?")') : fail(`tour da agenda com ${W.eval('TOURS.agenda.length')} passos`);
  W.setAgView('niveis');
  $('agBody').textContent.includes('Power 2') && $('agBody').textContent.includes('sem turma neste semestre') ? ok('visão por nível + níveis sem oferta esmaecidos') : fail('visão por nível incompleta');
  $('agBody').textContent.includes('vaga') ? ok('visão por nível mostra vagas ("que dia tem Power 2?")') : fail('visão por nível sem vagas');
  // "só com vagas" esmaece as cheias na grade
  W.setAgView('grade'); W.toggleAgVagas();
  $('agBody').innerHTML.includes('opacity-25') ? ok('"só com vagas" esmaece as turmas cheias') : fail('toggle de vagas sem efeito');
  W.toggleAgVagas();
  // criar turma + slot ocupado recusado
  const before = TURMAS.length;
  W.openNewTurma('lavender', 'seg-qua', '08:30', 'power-2');
  W.agSaveTurma();
  TURMAS.length === before + 1 ? ok('turma nova criada') : fail('não criou turma');
  const nova = TURMAS[TURMAS.length - 1];
  W.openNewTurma('lavender', 'seg-qua', '08:30', 'power-3');
  W.agSaveTurma();
  TURMAS.length === before + 1 && $('ntErr').innerHTML.includes('já tem turma') ? ok('slot ocupado recusado (sala não duplica horário)') : fail('aceitou duas turmas no mesmo slot');
  W.closeModal();
  // mover/alocar aluno da fila — habilita ao escolher, aplica, loga e tira da fila
  const ACT = W.eval('ACTIVITY'); const actBefore = ACT.length;
  const alvo = fila[0];
  W.openMoverKid(alvo.s.id, alvo.ki);
  $('mvGo').disabled ? ok('mover começa desabilitado') : fail('mover habilitado sem destino');
  W.mvPick(nova.id);
  !$('mvGo').disabled ? ok('escolher destino habilita') : fail('não habilitou ao escolher');
  W.confirmMoverKid(alvo.s.id, alvo.ki);
  alvo.k.tid === nova.id ? ok('aluno da fila alocado na turma') : fail('alocação não aplicou');
  ACT.length === actBefore + 1 ? ok('movimentação entra no registro de atividades') : fail('mover não logou');
  W.semTurmaKids().length === fila.length - 1 ? ok('fila diminui após alocar') : fail('fila não diminuiu');
  // capacidade: 0 é recusada; menor que a ocupação também
  W.openTurmaModal(nova.id);
  $('etCap').value = '0';
  W.agUpdateTurma(nova.id);
  turmaById(nova.id).cap === 7 ? ok('capacidade 0 recusada') : fail('aceitou capacidade 0');
  W.closeModal();
  const cheia = TURMAS.find(t => W.activeKidsIn(t.id) >= 2);
  W.openTurmaModal(cheia.id);
  $('etCap').value = '1';
  W.agUpdateTurma(cheia.id);
  turmaById(cheia.id).cap >= W.activeKidsIn(cheia.id) ? ok('capacidade não desce abaixo da ocupação') : fail('capacidade ficou menor que a turma!');
  W.closeModal();
  // excluir: com aluno não; vazia sim
  W.agDeleteTurma(nova.id);
  turmaById(nova.id) ? ok('turma com aluno não é excluída') : fail('EXCLUIU TURMA OCUPADA!');
  W.openMoverKid(alvo.s.id, alvo.ki); W.mvPick(0); W.confirmMoverKid(alvo.s.id, alvo.ki); // devolve pra fila
  alvo.k.tid === null ? ok('"deixar sem turma" devolve para a fila') : fail('não voltou para a fila');
  W.agDeleteTurma(nova.id); W.confirmAgDeleteTurma(nova.id);
  !turmaById(nova.id) ? ok('turma vazia excluída') : fail('não excluiu turma vazia');
  // CRUD de sala (nome/cor) — teacher agora vive na aba Teachers
  W.openSalaEdit('rose');
  $('seNome').value = 'Rose Room';
  W.saveSala('rose');
  salaById('rose').n === 'Rose Room' ? ok('editar sala salva (nome/cor)') : fail('edição de sala não salvou');
  // CRUD de teachers: cadastrar sem sala, atribuir, tirar e remover
  W.openSalasManage('profs');
  $('smNewProf').value = 'Fernanda Brito';
  W.smAddTeacher();
  const TEACHERS = W.eval('TEACHERS');
  TEACHERS.includes('Fernanda Brito') ? ok('teacher novo cadastrado sem sala') : fail('teacher não cadastrou');
  const fiIdx = TEACHERS.indexOf('Fernanda Brito');
  W.smAssignTeacher(fiIdx, 'rose');
  salaById('rose').prof === 'Fernanda Brito' ? ok('teacher atribuído à sala') : fail('atribuição de teacher falhou');
  W.smAssignTeacher(TEACHERS.indexOf('Fernanda Brito'), '');
  salaById('rose').prof === null ? ok('"sem sala por enquanto" tira o teacher da sala') : fail('teacher não saiu da sala');
  // excluir teacher: pede confirmação antes
  W.smRemoveTeacher(W.eval('TEACHERS').indexOf('Fernanda Brito'));
  W.eval('TEACHERS').includes('Fernanda Brito') ? ok('remover teacher abre confirmação (não exclui direto)') : fail('TEACHER EXCLUÍDO SEM CONFIRMAÇÃO!');
  W.confirmSmRemoveTeacher(W.eval('TEACHERS').indexOf('Fernanda Brito'));
  !W.eval('TEACHERS').includes('Fernanda Brito') ? ok('confirmar remove o teacher') : fail('teacher não removeu');
  // criar sala nova + excluir (vazia, com confirmação)
  W.openSalasManage('salas');
  $('smNewSala').value = 'Coral Room';
  W.smAddSala();
  W.eval('salaById')('coral-room') ? ok('sala nova criada com cor livre') : fail('sala nova não criou');
  W.smRemoveSala('coral-room');
  W.eval('salaById')('coral-room') ? ok('excluir sala abre confirmação (não exclui direto)') : fail('SALA EXCLUÍDA SEM CONFIRMAÇÃO!');
  W.confirmSmRemoveSala('coral-room');
  !W.eval('salaById')('coral-room') ? ok('confirmar exclui a sala vazia') : fail('sala não excluiu');
  W.smRemoveSala('green');
  W.eval('salaById')('green') ? ok('sala com turmas não pode ser excluída') : fail('EXCLUIU SALA COM TURMAS!');
  W.closeModal();
  // drag-and-drop: turma → slot vazio · aluno → turma com vaga
  const evStub = { preventDefault(){}, dataTransfer:{} };
  const HORAS = W.eval('HORAS');
  const tMove = TURMAS.find(t => W.activeKidsIn(t.id) > 0);
  let freeSlot = null;
  for (const s of SALAS) { for (const h of HORAS) if (!W.turmaAt(s.id, 'ter-qui', h)) { freeSlot = { sala: s.id, hora: h }; break; } if (freeSlot) break; }
  W.eval(`agDrag={type:'turma',tid:${tMove.id}}`);
  W.agDropEmpty(evStub, freeSlot.sala, 'ter-qui', freeSlot.hora);
  tMove.sala === freeSlot.sala && tMove.par === 'ter-qui' && tMove.hora === freeSlot.hora ? ok('arrastar turma para slot vazio move') : fail('drop de turma não moveu');
  const ocupado = TURMAS.find(t => t.id !== tMove.id);
  const tSnap = { sala: tMove.sala, par: tMove.par, hora: tMove.hora };
  W.eval(`agDrag={type:'turma',tid:${tMove.id}}`);
  W.agDropEmpty(evStub, ocupado.sala, ocupado.par, ocupado.hora);
  tMove.sala === tSnap.sala && tMove.hora === tSnap.hora ? ok('soltar em slot ocupado é recusado') : fail('drop sobrescreveu slot ocupado!');
  const fila2 = W.semTurmaKids();
  const aluno = fila2[0];
  // pan da grade: segurar e arrastar rola lateralmente (sem matar o clique simples)
  W.setAgView('grade');
  {
    const sc = $('agGridScroll');
    const fire = (type, x, y) => document.dispatchEvent(new W.MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
    const down = new W.MouseEvent('mousedown', { bubbles: true, clientX: 200, clientY: 200, button: 0 });
    Object.defineProperty(down, 'target', { value: sc });
    document.dispatchEvent(down);
    fire('mousemove', 120, 200); // arrasta 80px pra esquerda
    sc.classList.contains('panning') && sc.scrollLeft === 80 ? ok('segurar e arrastar rola a grade para o lado') : fail(`pan não rolou (scrollLeft=${sc.scrollLeft})`);
    fire('mouseup', 120, 200);
    !sc.classList.contains('panning') ? ok('soltar encerra o pan') : fail('pan não encerrou');
  }
  const tFull = id => W.eval(`turmaFull(turmaById(${id}))`);
  const destDrop = TURMAS.find(t => !tFull(t.id) && (() => { const nv = nivelByK(t.nivel); return aluno.k.age >= nv.ages[0] - 1 && aluno.k.age <= nv.ages[1] + 1; })());
  W.dropMoveKid(aluno.s.id, aluno.ki, destDrop.id);
  aluno.k.tid === destDrop.id ? ok('arrastar aluno da fila para turma com vaga aloca') : fail('drop de aluno não alocou');
  W.openMoverKid(aluno.s.id, aluno.ki); W.mvPick(0); W.confirmMoverKid(aluno.s.id, aluno.ki); // devolve pra fila
}

/* ---------- famílias juntas, irmãos e navegação contextual ---------- */
section('Famílias, irmãos e navegação');
{
  // célula Turma de irmãos: uma linha por aluno, com nome — sem "+1" escondido
  const sib = STUDENTS.find(s => s.kids.length > 1 && s.active !== false);
  const cell = W.turmaCellHTML(sib);
  sib.kids.every(k => cell.includes(k.n.split(' ')[0])) ? ok('célula Turma mostra cada irmão pelo nome') : fail('célula de irmãos sem os nomes');
  !cell.includes('+1') ? ok('o "+1" escondido em tooltip morreu') : fail('ainda tem +1 na célula');
  // famílias juntas: matrículas do mesmo responsável ficam adjacentes
  const rows = STUDENTS.filter(s => s.active !== false).slice().sort((a, b) => a.kids[0].n < b.kids[0].n ? -1 : 1);
  const grouped = W.famGroupRows(rows);
  const idx = {};
  grouped.forEach((r, i) => { (idx[r.resp.cpf] ||= []).push(i); });
  const adj = Object.values(idx).every(list => list.every((v, i) => i === 0 || v === list[i - 1] + 1));
  adj && grouped.length === rows.length ? ok('famGroupRows deixa matrículas da mesma família adjacentes') : fail('agrupamento por família quebrou');
  W.toggleFamGroup(); W.toggleFamGroup();
  ok('toggle "Famílias juntas" liga/desliga sem erro');
  // ficha do aluno lembra de onde a pessoa veio
  W.go('agenda'); W.openDetail(1);
  W.eval('detailBack') === 'agenda' && $('detailBackLabel').textContent.toLowerCase().includes('agenda')
    ? ok('ficha lembra de onde veio (voltar para agenda)') : fail('voltar contextual falhou');
  // soltar aluno num card de sala abre a alocação filtrada
  W.go('agenda'); W.setAgView('salas');
  const fila3 = W.semTurmaKids();
  W.eval(`agDrag={type:'kid',sid:${fila3[0].s.id},ki:${fila3[0].ki}}`);
  W.agDropSala({ preventDefault(){} }, 'green');
  $('modalBox').textContent.includes('aluno') ? ok('soltar aluno num card de sala abre a alocação') : fail('drop na sala não abriu modal');
  W.closeModal();
  // visão por nível: drop nas turmas + criar turma em qualquer nível
  W.setAgView('niveis');
  $('agBody').innerHTML.includes("agDropTurma") ? ok('turmas da visão por nível aceitam aluno arrastado') : fail('visão por nível sem drop');
  ($('agBody').innerHTML.match(/nova turma deste nível/g) || []).length >= 10 ? ok('criar turma disponível em todos os níveis') : fail('+ nova turma só nos níveis vazios');
}

/* ---------- modais: rodapé sempre visível + select escapa do modal ---------- */
section('Modais: rodapé fixo e cselect');
{
  W.openInvite();
  const box = $('modalBox');
  box.lastElementChild.style.position === 'sticky' ? ok('rodapé do modal é sticky (botões sempre visíveis)') : fail('rodapé do modal não é sticky');
  W.csToggle('invRole');
  $('csm-invRole').style.position === 'fixed' ? ok('cselect dentro de modal abre em "fixed" (escapa do overflow)') : fail('cselect preso dentro do modal');
  W.csCloseAll(); W.closeModal();
  // modal com botões no corpo (mover aluno) ganha rodapé destacado
  const alvo2 = W.semTurmaKids()[0];
  W.openMoverKid(alvo2.s.id, alvo2.ki);
  box.lastElementChild.style.position === 'sticky' && box.lastElementChild.querySelector('#mvGo') ? ok('fileira de botões do corpo vira rodapé sticky') : fail('botões do mover não viraram rodapé');
  W.closeModal();
}

/* ---------- filtros de alunos por turma (nível, sala, teacher, período) ---------- */
section('Filtros de alunos por turma');
{
  const kidTurma = W.eval('kidTurma'), nivelByK = W.eval('nivelByK'), salaById = W.eval('salaById');
  W.go('alunos'); W.clearFilters();
  W.csSet('fNivel', 'fam:power');
  const fam = W.filteredStudents();
  fam.length > 0 && fam.every(s => s.kids.some(k => { const t = kidTurma(k); return t && nivelByK(t.nivel).fam === 'power'; }))
    ? ok(`família inteira filtra — Todos os Power (${fam.length})`) : fail('filtro de família vazou');
  W.csSet('fNivel', 'power-2');
  const p2 = W.filteredStudents();
  p2.length > 0 && p2.every(s => s.kids.some(k => kidTurma(k)?.nivel === 'power-2'))
    ? ok(`nível específico filtra — Power 2 (${p2.length})`) : fail('filtro de nível vazou');
  W.clearFilters();
  W.csSet('fSala', 'green');
  const gr = W.filteredStudents();
  gr.length > 0 && gr.every(s => s.kids.some(k => kidTurma(k)?.sala === 'green'))
    ? ok(`sala filtra — Green Room (${gr.length})`) : fail('filtro de sala vazou');
  W.csSet('fSala', 'none');
  const semT = W.filteredStudents();
  semT.every(s => s.kids.some(k => !k.tid)) ? ok(`"Sem turma" filtra (${semT.length})`) : fail('filtro sem turma vazou');
  W.clearFilters();
  W.csSet('fProf', 'Mariana Rios');
  const pr = W.filteredStudents();
  pr.length > 0 && pr.every(s => s.kids.some(k => { const t = kidTurma(k); return t && salaById(t.sala).prof === 'Mariana Rios'; }))
    ? ok(`teacher filtra (${pr.length})`) : fail('filtro de teacher vazou');
  W.clearFilters();
  W.csSet('fPeriodo', 'm');
  const man = W.filteredStudents();
  man.length > 0 && man.every(s => s.kids.some(k => { const t = kidTurma(k); return t && +t.hora.slice(0, 2) < 12; }))
    ? ok(`período matutino filtra (${man.length})`) : fail('filtro matutino vazou');
  W.csSet('fPeriodo', 't'); W.csSet('fDia', 'ter-qui'); W.csSet('fHora', '15:30');
  const combo = W.filteredStudents();
  combo.every(s => s.kids.some(k => { const t = kidTurma(k); return t && t.par === 'ter-qui' && t.hora === '15:30'; }))
    ? ok(`dia + horário combinados (${combo.length})`) : fail('combinação de filtros vazou');
  W.clearFilters();
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
  $('importError').innerHTML.includes('não é .csv nem .xlsx') ? ok('.png recusado') : fail('aceitou .png');
  // limite real é 16MB; 17MB é recusado pela checagem de tamanho ANTES de ler (não chega no FileReader)
  W.importReadFile({ name: 'grande.csv', size: 17 * 1024 * 1024 });
  $('importError').innerHTML.includes('grande') ? ok('>16MB recusado') : fail('aceitou arquivo gigante');
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
