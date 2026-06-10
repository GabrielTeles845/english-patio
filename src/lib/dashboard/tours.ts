/* Tours guiados POR TELA — port 1:1 do mapa TOURS do preview (dashboard.html
   l.1751+). Cada tela mostra o seu tour uma vez (ep-tour-seen-<view>), com
   opt-out global em ep-tours-off. Desktop-only: no mobile o spotlight e o
   posicionamento não funcionam bem (decisão registrada no preview).
   Passos cujo alvo não existe no DOM são PULADOS em runtime (Tour.tsx) —
   alguns marcadores do preview ainda não existem nas telas portadas. */

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  /* seletor CSS do alvo; null = passo centralizado (boas-vindas) */
  target: string | null;
  title: string;
  body: string;
  placement: TourPlacement;
  /* mostra a logo da escola no card (passo de boas-vindas) */
  logo?: boolean;
  /* marcador do preview para o passo final (o motor calcula pelo índice
     filtrado, mas mantemos o dado fiel ao original) */
  last?: boolean;
}

export const TOURS: Record<string, TourStep[]> = {
  overview: [
    { target: null, title: 'Boas-vindas ao preview da dashboard!', body: 'Explore à vontade — os dados são fictícios e nada aqui quebra. Cada tela tem o seu próprio tour completo; se preferir, dá para fechar e nunca mais ver.', placement: 'center', logo: true },
    { target: '[data-tour="cohort"]', title: 'Estudando × próximo período', body: 'Este seletor separa tudo: "Estudando" mostra quem está em aula agora; "2026.2" mostra as matrículas novas de quem começa em julho — a visão que importa quando abrem as matrículas do período seguinte.', placement: 'bottom' },
    { target: '#periodSelWrap', title: 'Escolha o período', body: 'Os gráficos respondem a este filtro: últimos 6 meses, 12 meses ou só este mês.', placement: 'bottom' },
    { target: '[data-tour="kpis"]', title: 'Os números de hoje', body: 'Alunos ativos, novos da semana, contratos aguardando assinatura e matrículas do mês — sempre atualizados.', placement: 'bottom' },
    { target: '[data-tour="strip"]', title: 'Indicadores rápidos', body: 'Média de idade, famílias com irmãos, ocupação das turmas, assinaturas e rematrículas — a régua da escola numa linha.', placement: 'bottom' },
    { target: '[data-tour="enroll"]', title: 'Novas × rematrículas', body: 'A linha azul são as matrículas novas; a tracejada amarela, as rematrículas do semestre.', placement: 'right' },
    { target: '[data-tour="health"]', title: 'Cobrança sem dor de cabeça', body: 'O funil do Autentique em tempo real: assinados, visualizados, enviados e pendentes — com aviso de contrato parado há 7+ dias. O botão verde leva direto para a lista filtrada nos pendentes.', placement: 'left' },
    { target: '[data-tour="vagas"]', title: 'Onde ainda cabe aluno', body: 'Ocupação de cada sala, com a etiqueta CHEIA nas lotadas. Toque numa sala para abrir a página dela na Agenda — turmas, horários e alunos.', placement: 'right' },
    { target: '[data-tour="niveis"]', title: 'Quantos alunos por nível', body: 'Do Fun Plus ao Sprint, cada nível com a sua cor. Ao lado, as entradas e saídas por sala — de onde mais saiu gente e onde mais entrou.', placement: 'top' },
    { target: '[data-tour="ov-vagas-nivel"]', title: '"Onde tem vaga?"', body: 'A pergunta de todo dia, respondida sem abrir a Agenda: cada nível com a ocupação e as vagas restantes — os quase lotados aparecem primeiro. Ao lado, os alunos por teacher e o radar do que precisa de atenção.', placement: 'top' },
    { target: '[data-tour="ov-saidas"]', title: 'Por que as famílias saem', body: 'Os motivos dos desligamentos, o mês com mais saídas e a sala que mais perdeu alunos — com as entradas do período para comparar.', placement: 'top' },
    { target: '[data-tour="hours"]', title: 'A hora do clique', body: 'Mostra em que horário as famílias costumam matricular pelo site — útil para saber quando responder rápido e impulsionar posts.', placement: 'right' },
    { target: '[data-tour="bday"]', title: 'Mimos que fidelizam', body: 'Os próximos aniversariantes, com botão que prepara as mensagens de parabéns no WhatsApp.', placement: 'left' },
    { target: '[data-tour="export"]', title: 'Leve para o Excel', body: 'Exporta todos os alunos numa planilha que abre no Excel ou Google Planilhas.', placement: 'bottom', last: true },
    /* o passo "#cmFab — O botão mais importante" do preview ficou de fora:
       o botão de comentários é o canal de feedback DO PREVIEW, fora do produto */
  ],
  alunos: [
    { target: '[data-tour="row-menu"]', title: 'Tudo mora nos três pontinhos', body: 'Cada linha tem um menu completo: ficha do aluno, editar os dados, ver e baixar contrato, enviar no WhatsApp, copiar telefone, marcar como enviado/assinado, desligar o aluno (com registro do motivo) e excluir cadastros errados.', placement: 'left' },
    { target: '#tableHead', title: 'Ordene por qualquer coluna', body: 'Clique no título de uma coluna para ordenar (vem por nome). Clique de novo para inverter. Ordenando por Responsável, os irmãos de matrículas separadas ficam juntos.', placement: 'bottom' },
    { target: '[data-tour="col-since"]', title: 'Desde quando estuda aqui', body: 'A coluna "Na escola" mostra quando o aluno entrou de fato (sempre fevereiro ou agosto) — diferente da data de matrícula, que é só a última rematrícula. O traço (—) é quem ainda não tem o registro: preencha em ⋮ → Editar dados.', placement: 'bottom' },
    { target: '[data-tour="filtros"]', title: 'Busca e filtros', body: 'Por nível (o mais importante — dá para escolher a família inteira, ex.: "Todos os Power"), sala, teacher, horário, dias, período (manhã/tarde), contrato, situação, bairro, idade, imagem, irmãos e datas — o "Limpar" zera tudo de uma vez.', placement: 'bottom' },
    { target: '[data-tour="f-nivel"]', title: 'O filtro de nível', body: 'Quer ver só o Power 2? Ou todos os Sprint de uma vez? É aqui. O teacher tem até a opção "Sem teacher", e a sala tem "Sem turma" — os alunos que ainda esperam alocação.', placement: 'bottom' },
    { target: '[data-tip="Autorizou uso de imagem"]', title: 'Câmera verde, câmera vermelha', body: 'A camerazinha ao lado do nome mostra se a família autorizou fotos: verde = pode postar, vermelha = não pode.', placement: 'right' },
    { target: '[data-tour="nova"]', title: 'Matrícula manual', body: 'A secretaria pode adicionar uma matrícula direto por aqui, sem passar pelo site.', placement: 'bottom' },
    { target: '[data-tour="import-al"]', title: 'Traga a planilha de hoje', body: 'Importa o arquivo da planilha atual de matrículas. Linhas repetidas somem sozinhas, quem já está na dashboard não duplica, e nomes iguais ou dados estranhos entram numa lista para conferir antes de confirmar.', placement: 'bottom' },
    { target: '[data-tour="export-al"]', title: 'Planilha da lista filtrada', body: 'Exporta exatamente o que está na tela — com os filtros aplicados.', placement: 'bottom', last: true },
  ],
  editor: [
    { target: '#editorTabs', title: 'Todas as páginas do site', body: 'Escolha qual página editar — até as telas de matrícula entram aqui no produto final.', placement: 'bottom' },
    { target: '#editorPage .editable', title: 'Clique em qualquer texto', body: 'A borda pontilhada amarela mostra o que dá para editar. Clicou, escreveu, o texto muda ao vivo na pré-visualização.', placement: 'bottom' },
    { target: '#devMob', title: 'Veja como fica no celular', body: 'Este botão mostra a página dentro de um iPhone de verdade, do jeito que as famílias veem.', placement: 'bottom' },
    { target: '[data-tour="publish"]', title: 'Nada vai ao ar sem querer', body: 'As mudanças ficam só na pré-visualização até você clicar em Publicar — o contador mostra quantas alterações estão pendentes.', placement: 'bottom', last: true },
  ],
  contratos: [
    { target: '[data-tour="cauto"]', title: 'Ninguém mais sobe documento', body: 'Quando a matrícula chega pelo site, o contrato vai sozinho para o Autentique e a família recebe o link de assinatura no WhatsApp e no e-mail. Quando assina, o status muda aqui sozinho — sem conferência manual.', placement: 'bottom' },
    { target: '#cvList', title: 'Cartões ou lista', body: 'Alterne entre ver os contratos em cartões ou um por linha (a lista é a visão de trabalho).', placement: 'bottom' },
    { target: '[data-tour="cfiltros"]', title: 'Ache qualquer contrato', body: 'Busque por aluno ou responsável e filtre por status — pendente de envio, enviado, visualizado (a família abriu o link) e assinado — e por situação.', placement: 'bottom' },
    { target: '[data-tour="cmodelos"]', title: 'O PDF que as matrículas usam', body: 'Aqui ficam os modelos de contrato: importe um PDF novo (editado no Google Docs), veja onde cada campo é carimbado e escolha qual modelo vale para as próximas matrículas.', placement: 'bottom' },
    { target: '#contractGrid', title: 'Parado? Cobre em um clique', body: 'Contrato sem assinatura há 7+ dias ganha a etiqueta vermelha "parado". O botão verde prepara a cobrança no WhatsApp com o link de assinatura — e em "Abrir" dá para ver a linha do tempo completa: enviado, visualizado, assinado.', placement: 'top', last: true },
  ],
  agenda: [
    { target: null, title: 'A agenda que se atualiza sozinha', body: 'Chega de refazer o quadro no Canva: aqui a agenda é um reflexo vivo dos dados. Mudou um aluno de turma? Todas as visões — e as imagens exportadas — já mudaram juntas.', placement: 'center', logo: true },
    { target: '[data-tour="ag-views"]', title: 'Quatro jeitos de ver', body: 'Grade = o raio-X da escola (salas × horários). Salas = a página de cada sala, igual ao quadro do Canva. Níveis = responde "que dia tem Power 2 e onde tem vaga?". Mural = todas as páginas do par, lado a lado.', placement: 'bottom' },
    { target: '[data-tour="ag-export"]', title: 'As imagens do Canva, sem o Canva', body: 'Exporta a página de uma sala, o pacote de todas as salas ou um nível inteiro — no mesmo formato do quadro de hoje, mas sempre com os dados de agora.', placement: 'bottom' },
    { target: '[data-tour="ag-help"]', title: 'O resto, os "?" explicam', body: 'Esta tela tem muita coisa — em vez de um tour gigante, os pontinhos "?" espalhados explicam cada detalhe no hover: pares de dias, fila de alocação, modo "só com vagas" e o que mais aparecer.', placement: 'bottom', last: true },
  ],
  atividade: [
    { target: '[data-tour="act-list"]', title: 'A memória do painel', body: 'Toda ação fica registrada: o que cada pessoa fez, o que o sistema fez sozinho e o que o Autentique avisou (visualizações e assinaturas). Nada aqui pode ser editado ou apagado.', placement: 'top' },
    { target: '[data-tour="act-filtros"]', title: 'Encontre qualquer ação', body: 'Busque por aluno ou ação e filtre por pessoa — útil para responder "quem mexeu nisso?" em segundos.', placement: 'bottom', last: true },
  ],
  modelos: [
    { target: '[data-tour="tpl-import"]', title: 'Trocar o contrato é simples', body: 'Edite o contrato no Google Docs, baixe como PDF e importe aqui. Não precisa mexer em código.', placement: 'bottom' },
    { target: '[data-tour="tpl-atual"]', title: 'O modelo em uso', body: 'Só um modelo fica "Em uso" por vez — é ele que as próximas matrículas preenchem. Os outros ficam arquivados como histórico.', placement: 'bottom' },
    { target: '[data-tour="tpl-card"]', title: 'Mapeamento dos campos', body: '"Ver mapeamento" mostra onde cada dado da matrícula (nome, CPF, alunos, checkboxes) é carimbado no PDF — e dá para arrastar os marcadores. Um modelo com campos pendentes não pode ser usado.', placement: 'top', last: true },
  ],
  emails: [
    { target: '#chSeg', title: 'E-mail, WhatsApp ou os dois', body: 'Escreva o comunicado uma vez e escolha por onde cada família recebe.', placement: 'bottom' },
    { target: '#tplRow', title: 'Modelos prontos', body: 'Um clique e o texto já vem escrito, é só ajustar. Em "Gerenciar modelos" dá para criar os seus próprios, editar ou excluir os que existem.', placement: 'bottom' },
    { target: '#emailBody', title: 'Mensagens personalizadas', body: 'Use os botões de variável — cada família recebe a mensagem com o próprio nome.', placement: 'top' },
    { target: '[data-tour="prevbtn"]', title: 'Veja antes de enviar', body: 'Mostra exatamente como a família recebe: o e-mail montado e a bolha do WhatsApp.', placement: 'top', last: true },
  ],
  usuarios: [
    { target: '[data-tour="novo-usuario"]', title: 'Chame o time', body: 'Cadastre alguém definindo uma senha provisória — a pessoa é obrigada a trocá-la no primeiro acesso.', placement: 'bottom' },
    { target: '[data-tour="papeis"]', title: 'Três papéis, sem confusão', body: 'Diretor faz tudo; Supervisor cuida da agenda e consulta alunos; Secretaria cadastra alunos e turmas e envia contratos. Use "Ver o painel como…" para conferir o que cada papel enxerga.', placement: 'top', last: true },
  ],
  config: [
    { target: '#sbThemePicker', title: '6 combinações de visual', body: 'Três cores de sidebar (azul, branca, amarela) vezes claro/escuro — e as bolinhas no rodapé da sidebar trocam de qualquer tela.', placement: 'bottom' },
    { target: '[data-tour="conta"]', title: 'Sua conta', body: 'Troque e-mail e senha por aqui (ou clicando no seu nome na sidebar).', placement: 'left' },
    { target: '[data-tour="ajuda"]', title: 'Dicas sob seu controle', body: 'Reveja o tour de qualquer tela ou reative as dicas em todas — e o botão "?" no canto faz o tour da tela atual.', placement: 'left', last: true },
  ],
};

/* chaves de persistência — idênticas ao preview (Config.tsx já usa as mesmas) */
export const TOURS_OFF_KEY = 'ep-tours-off';
export const tourSeenKey = (view: string) => `ep-tour-seen-${view}`;

export const toursOff = () => !!localStorage.getItem(TOURS_OFF_KEY);

/* tours são desktop-only — no mobile o spotlight/posicionamento não funciona bem */
export const isTourMobile = () => window.matchMedia('(max-width:767px)').matches;
