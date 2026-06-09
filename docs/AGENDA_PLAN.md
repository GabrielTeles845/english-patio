# Plano da Agenda — dashboard English Patio

Plano dedicado à tela **Agenda** (salas × turmas × níveis) do preview `public/dashboard.html`.
Decisões fechadas com o Gabriel em 05/Jun/2026, a partir da agenda real feita no Canva
(exemplo: "GREEN ROOM · Teacher Mariana Rios · Mon/Wed"). Segue as regras de design do
`CLAUDE.md` (nada de controles nativos, toasts amarelos, linguagem neutra, tours por tela).

## 1. Por que existe

Hoje a agenda da escola é desenhada **à mão no Canva** e refeita a cada mudança — e muda o
tempo todo (aluno troca de horário, aluno novo entra, turma lota). A tese da tela:

> **A agenda deixa de ser um documento que se edita e vira uma visão que se consulta.**
> Edita-se o dado (aluno ↔ turma) em 2 cliques; a agenda se redesenha sozinha em todas as
> visões, sempre correta — e exporta a "página do Canva" com 1 clique.

## 2. Decisões fechadas (Q&A com o Gabriel)

| Pergunta | Decisão |
|---|---|
| Unidade organizadora | **Sala** (13, nomes de cor). Professor é secundário/opcional. |
| Sala presa a uma família de nível? | **Não** — pode misturar (nível é da turma, não da sala). |
| Dias | **Sempre** pares Seg/Qua ou Ter/Qui. Sem sexta, sábado ou 1x/semana. |
| Horários (início) | `8:30 · 9:30 · 10:30` (manhã) `13:30 · 14:30 · 15:30 · 16:45 · 17:45` (tarde) |
| Duração | **1h** (15:30→16:45 é intervalo). |
| Capacidade | Por turma; **padrão 7** na criação. **"Vaga extra"** (oficializada 09/Jun, como o preview faz): turma existente pode abrir 7→8→9, **máx 2 extras**; a partir de 9 bloqueia. |
| Teacher | Campo **opcional** no CRUD; aparece na agenda/exportação só se preenchido. |
| Turma cheia | Mostrar **"NÃO TEM VAGA"** igual ao Canva (texto verde sob a lista). |
| Aluno sem turma | Existe — cadastra primeiro, atrela depois; também muda de turma. |
| "Saída" nos analytics | Desligamento da **escola** (troca interna de sala não conta). |
| Papéis (quem pode o quê) | **Definido 06/Jun** — Diretor, Supervisor e Secretaria têm CRUD completo na Agenda; Supervisor vê alunos só em leitura. Matriz completa no `DASHBOARD_PLAN.md` §4. |

## 3. Modelo de dados (mock do preview)

```js
SALAS  = [{ id, nome:'Green Room', cor:'#8BC34A', prof:'Mariana Rios'|null }, …]
  // 13 fixas (CRUD: renomear/cor/teacher). O PROFESSOR é da SALA: 1 por sala, vale para
  // todos os pares/horários dela (tela "Salas & teachers"). A turma NÃO tem professor.
// Green, Vanilla, Peach, Purple, Blue, Orange, Mint, Yellow, Guava, Beige, Rose,
// Turquoise, Lavender — cada uma com a cor do próprio nome (tons suaves, não saturados)

NIVEIS = 4 famílias, cada uma com cor de estágio:
  Fun Plus A, B                                  (fun      — ex. laranja)
  Conversation 1, 2, 3                           (conv     — ex. rosa)
  Power 1…6                                      (power    — ex. azul)
  Sprint 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B          (sprint   — ex. roxo)
// 19 níveis em ordem de evolução; NEM TODO semestre oferece todos (mock reflete isso)

TURMAS = [{ id, salaId, par:'seg-qua'|'ter-qui', hora:'14:30', nivel:'power-2',
            cap:7 /* padrão = máx */ }]   // sem teacher: o professor vem da SALA

// kid (dentro da matrícula) ganha turmaId | null  ← null = "sem turma" (chip âmbar)
// NOVO/NOVA do Canva = derivado do "na escola desde" (entrou neste semestre)
```

Consequência estrutural: **a turma sai da matrícula e vai pro aluno (kid)** — hoje irmãos
compartilham `sch`/`t`, o que quebra com filtro por nível (irmão de 5 e de 12 anos não
ficam na mesma turma). `sch`/`t` somem; tudo deriva de `turmaId`.

## 4. A tela Agenda — 3 visões + 1 fila (mesmo dado)

Item novo na sidebar: **Agenda** — UMA tela (decisão: não fragmentar em telas separadas;
é o mesmo dado sob ângulos diferentes). Alternância de visão em pills no topo
(Grade · Salas · Níveis), e **filtros transversais que valem em todas as visões**:
- toggle `Seg/Qua ⇄ Ter/Qui`
- **"Só com vagas"** (esconde turmas cheias — o modo "onde cabe aluno?")
- período (manhã/tarde) e, se preenchido, teacher

### 4.1 Grade geral — "o raio-X da escola"
- Colunas = 13 salas (header com a cor da sala), linhas = 8 horários com divisor
  visual manhã/tarde e o intervalo 15:30→16:45 marcado.
- Célula = turma: badge do nível (cor da família) + ocupação `5/7` + **CHEIA** quando lota.
- Célula vazia = `+` (criar turma ali, com sala/par/horário já preenchidos).
- Primeira coluna fixa + scroll horizontal (13 salas é largo); no mobile vira lista por sala.

### 4.2 Visão da sala — a "página do Canva", gerada
- Clicou numa sala → réplica fiel do layout atual: header com a cor da sala + nome +
  Teacher (se houver) + par de dias; slots em 2 colunas; cada slot = horário + sigla do
  nível + lista numerada de alunos com `(idade)` e marcador **NOVO/NOVA**; turma cheia
  fecha com **"NÃO TEM VAGA"** em verde, igual ao Canva.
- Cada nome de aluno é clicável → detalhe / mover.
- Botão **Exportar imagem** (ver §6).

### 4.3 Visão por nível — "que dia tem Power 2 e onde tem vaga?"
O caso de uso nº 1 da dona. Seletor de nível (agrupado por família, com cores) →
cards de todas as turmas daquele nível: sala, par de dias, horário, ocupação, **vagas
restantes em destaque** ("2 vagas · Ter/Qui 14:30 · Blue Room"). Níveis sem oferta no
semestre aparecem esmaecidos ("sem turma neste semestre"). Atalho "matricular aqui"
em turma com vaga.

### 4.4 Fila "sem turma"
Faixa no topo da Agenda: "**N alunos aguardando turma**" → lista; clicar no aluno abre o
mesmo modal de alocação (§5.2). Transforma o "esqueci de atrelar" em fila visível.

## 5. O CRUD (o coração — tem que ser excelente)

### 5.1 Turmas
- **Criar**: clique no `+` do slot vazio (grade ou visão da sala) → modal com sala/par/hora
  pré-preenchidos; escolhe nível (select agrupado), cap (padrão 7; na criação máx 7 — a
  vaga extra 7→9 é fluxo de turma existente). **O professor NÃO é da turma** — define-se
  por sala na aba "Salas & teachers".
- **Editar**: nível, cap (nunca abaixo da ocupação atual), mover de horário/sala
  (só pra slot livre — uma sala não tem 2 turmas no mesmo slot do mesmo par).
- **Excluir**: só vazia; com alunos, oferece mover os alunos antes (em lote).

### 5.2 Mover/alocar aluno — a operação de todo dia
- De qualquer visão (nome do aluno, ⋮ da lista de Alunos, detalhe): **"Mover para…"** →
  modal mostra **só destinos válidos** (turmas com vaga), com o mesmo nível primeiro;
  destino de nível diferente exige confirmação explícita ("mudar de nível?").
- Aluno sem turma usa o mesmo modal ("Alocar em…").
- **Toda operação loga no Registro de atividades** ("Stefany moveu Davi Bessa: Green Room
  9:30 → Peach Room 14:30") — responde "quem mudou esse menino de horário?".

### 5.3 Salas
- CRUD leve: renomear, trocar cor (paleta), desativar (só sem turmas). As 13 vêm prontas.

### 5.4 Bloqueios que o Canva não dá
- Capacidade nunca estoura o teto (criação ≤7; com vaga extra, ≤9); slot nunca duplica;
  excluir nunca órfã aluno.
- Sem `confirm()` nativo — modais próprios, toasts amarelos.

## 6. Exportação de imagens (substitui o produto final do Canva)

- **Por sala**: a página da visão 4.2 vira PNG (estilo Canva, com a identidade deles).
- **Todas as salas**: gera o "pacote do semestre" (uma imagem por sala, do par escolhido).
- **Por nível**: imagem com as turmas + alunos daquele nível.
- Técnica **decidida** (validada no preview — `DASHBOARD_PLAN.md §2`): nó DOM dedicado de
  exportação + **`html-to-image`** com download direto, empacotada como util. Fallback de
  emergência: folha de estilo de impressão (`window.print()` → PDF).

## 7. Filtros novos na tela Alunos (o pedido original)

Todos derivados de `kid.turmaId` (+ a opção "Sem turma"):
`Nível` (agrupado por família, vem primeiro — o mais importante) · `Sala` · `Professor`
(com "🟡 Sem professor") · `Horário` (8 reais) · `Dia` (Seg/Qua ⇄ Ter/Qui) ·
`Período` (matutino/vespertino). O filtro atual `fSchedule` (par de dias) é absorvido.
Coluna "Horário" da tabela vira "Turma" (sala + horário + badge de nível).

## 8. Analytics novos na Visão geral

- **Alunos por nível** (barras, cores das famílias) — "quais níveis têm mais alunos".
- **Entradas × saídas por sala** no período (saída = desligamento da escola; entradas =
  matrículas novas) — "de qual sala mais saiu gente". Com teacher preenchido, o mesmo
  corte por professor.
- **Ocupação por sala** (substitui o atual "vagas por horário", que usa TURMA_CAP fake).
- KPI/alerta: "N alunos sem turma".
- Recalibrar a história dos dados fictícios: capacidade total passa a ser
  `nº de turmas × 7` (não mais os 150 fixos); manter ~128 ativos, 3 turmas CHEIAS,
  manhã com poucas turmas (matutino existe mas é menor), alguns níveis sem oferta.

## 9. Ordem de construção no `dashboard.html`

1. **Fundação**: SALAS/NIVEIS/TURMAS + migrar gerador fictício (kid.turmaId, horários
   reais, ~6 sem turma) + recalibrar Visão geral. *Nada visual novo ainda.*
2. **Tela Agenda**: grade geral + visão da sala (com NÃO TEM VAGA) + toggle de par.
3. **Visão por nível** + fila sem-turma + mover/alocar aluno (com log de atividade).
4. **Filtros de Alunos** (§7) + coluna Turma.
5. **Exportação de imagens** (§6).
6. **Analytics** (§8).
7. **Acabamento**: tour da tela Agenda, passos novos nos tours de Alunos/Visão geral,
   atualizar `scripts/dashboard-smoke.mjs` e os prints (`dashboard-prints.mjs`).

Cada etapa deixa o preview funcional — dá pra mostrar pra dona no meio do caminho.

## 10. Fora deste plano (futuro)

- Arrastar-e-soltar aluno entre células da grade (fase 2 da Agenda).
- Assistente de **virada de semestre** (redefinir teacher/níveis das salas em lote).
- Professor substituto (falta pontual) — hoje resolvem informalmente.
- ~~Papéis Secretaria/Supervisor/Diretor + "ver painel como…"~~ — definidos em 06/Jun
  (matriz no `DASHBOARD_PLAN.md` §4; "ver painel como…" entrou no preview).
