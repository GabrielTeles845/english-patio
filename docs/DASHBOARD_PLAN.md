# Plano da Dashboard Administrativa — English Patio

Documento vivo, **reescrito em 06/Jun/2026** a partir do preview aprovado
(`public/dashboard.html`, servido em `/dashboard` via rewrite no `vercel.json`).
O preview é a fonte de verdade do produto: este plano descreve como transformá-lo
em sistema real. O módulo Agenda tem plano dedicado em `docs/AGENDA_PLAN.md`.

## 1. Princípios

1. **Não tirar o site do ar.** O fluxo de matrícula atual (form → PDF → Apps Script →
   planilha Google + Drive + e-mail) continua **intocado** durante toda a construção.
2. **Build paralelo + cutover planejado.** A dashboard e seu banco são construídos e
   testados de forma **isolada**. Quando tudo estiver validado, fazemos a **virada
   (cutover)**: o fluxo de matrícula passa a gravar no banco novo, e a
   planilha/Drive/`.gs` são aposentados. Nesse momento (e só nele) pode haver uma pausa
   curta e planejada. Importamos todo o histórico da planilha + os PDFs.
3. **Stack alinhada ao que já existe.** React 18 + TypeScript + Vite + Tailwind, deploy
   Vercel. Banco no **Neon (Postgres)**.
4. **O preview manda no design.** Tudo que o `dashboard.html` estabeleceu vale para a
   versão real: nada de controles HTML crus, toasts amarelos, linguagem neutra,
   boleto/carnê 6x como única forma de pagamento, 3 temas de sidebar × claro/escuro,
   tours por tela, ações por linha no menu ⋮.

## 2. Arquitetura

A app de hoje é uma **SPA Vite sem backend próprio**. A dashboard precisa de servidor
(login, banco, e-mail, webhooks). Tudo no mesmo projeto Vercel:

```
Navegador (React SPA)
  ├── Site público + Matrículas      → continua igual (até o cutover)
  └── /dashboard/* (rotas protegidas) → React, mesma base de componentes
        │
        ▼ fetch /api/*
  Vercel Serverless Functions (camada de backend)
        ├── Auth (JWT em cookie httpOnly), RBAC server-side
        ├── CRUD de alunos/matrículas/turmas/salas/contratos
        ├── Webhook Autentique (HMAC + dedup por event id)
        ├── Comunicados (Resend p/ e-mail; WhatsApp preparado por família)
        └── Conteúdo do site (editor de textos)
        │
        ▼
  Neon (Postgres)  +  Object Storage p/ PDFs (Vercel Blob ou R2/S3)
```

- **Front-end (estratégia de fidelidade decidida 08/Jun/2026 — "o preview é a lei
  visual"):** Tailwind + **Lucide**. **Gráficos = Chart.js** (`react-chartjs-2`) — o
  preview já usa Chart.js 4.4.3; **não** trocar por Recharts (canvas vs SVG não
  renderizam igual). **Dark mode circular = View Transitions API** (nativo, como no
  preview), **não** Framer; Framer só pra animação incidental, se necessário.
  **shadcn/ui = andaime secundário**, nunca a fonte visual: os controles que o preview
  já calibrou (cselect, checkbox, tooltip global, datepicker, toasts, modais,
  tabela→cards mobile) são **portados 1:1 do CSS do preview**, não substituídos pelos
  defaults do shadcn.
- **ORM:** Drizzle (TS-first, leve no Vercel).
- **Storage dos contratos:** flexível — pode continuar no Google Drive por ora; o banco
  guarda só a URL do PDF, trocar storage depois é simples.
- **E-mail:** Resend (transacional + comunicados).
- **Assinatura digital:** **Autentique** (API GraphQL + webhooks). O preview já simula o
  fluxo completo — ver §7.
- **Exportação de imagens da Agenda:** mesma técnica validada no preview
  (nó DOM dedicado + `html-to-image`), empacotada como util.
- **Contrato de API:** todas as rotas `/api/*` (método, payload, RBAC por papel,
  validações, efeitos colaterais em `activity_log`/`notifications`, webhook Autentique)
  estão especificadas em **`docs/DASHBOARD_API.md`** — incluindo o mapa "função mockada do
  preview → rota real". É a fonte de verdade do backend; o `dashboard.html` aponta pra ela
  em cada ponto de integração.

## 3. Autenticação & Segurança (dados de MENORES → rigor extra, LGPD)

- **Login:** e-mail + senha. Hash **bcrypt** (cost ≥ 12). **Política de senha
  (decidida 08/Jun/2026):** mín. **10 caracteres** com ≥1 maiúscula, ≥1 minúscula,
  ≥1 número e ≥1 caractere especial — composição clássica. Vale onde a senha é
  definida: aceite de convite, reset e "trocar senha" (não há cadastro aberto; contas
  nascem por convite — §4). O preview hoje usa regra mais fraca (≥10 + letras +
  números) — **substituir pela política acima**. _Evolução possível (não bloqueia o
  MVP): checar contra base de senhas vazadas (HIBP k-anonymity)._
- **Sessão:** JWT curto em cookie **httpOnly + secure + SameSite**, com refresh. CSRF
  token nas mutações.
- **Esqueci a senha:** token de uso único com expiração curta, enviado por e-mail
  (Resend), hash do token no banco.
- **Rate limiting** no login (por IP e por e-mail) + log de tentativas falhas.
- **RBAC sempre no servidor** — o front esconde telas por papel (como o preview já
  demonstra), mas **nunca** é fonte de verdade de permissão; toda rota `/api/*` valida
  o papel de novo.
- **Validação de entrada:** schema (Zod) em todas as rotas; nada de confiar no client.
- **Webhook Autentique:** verificar HMAC (`x-autentique-signature`), **dedup por event
  id** (entrega sem ordem garantida + duplicatas possíveis), responder rápido e
  processar idempotente.
- **Auditoria:** tela Atividade do preview = tabela `activity_log` real. Registrar
  acessos e ações sensíveis (quem visualizou/exportou dados de aluno, quem moveu aluno
  de turma, transições de contrato). Atores humanos + `Sistema` + `Autentique`.
- **LGPD:**
  - Base legal: consentimento do responsável (autorizações da matrícula).
  - Minimização: cada papel vê só o necessário (ver §4).
  - **CPF mascarado** na listagem; revelado no detalhe **com log de acesso**.
  - Direitos do titular: exportar e excluir dados; política de retenção/expurgo.
  - Tudo sob HTTPS (Vercel), segredos em env vars.
- **Headers:** CSP, X-Frame-Options, Referrer-Policy nas respostas da dashboard.
- **Fase futura:** 2FA para Diretor (o preview já mostra "Em breve" em Segurança).

## 4. Papéis de acesso (matriz definida em 06/Jun/2026)

Três papéis, sem flexão de gênero. **"Administrador" foi renomeado para "Diretor".**

| Recurso | **Diretor** | **Supervisor** | **Secretaria** |
|---|---|---|---|
| Visão geral (KPIs/gráficos) | ✓ | — | — |
| Alunos | CRUD completo | **somente leitura** | CRUD completo |
| Agenda (turmas/salas/alocação) | CRUD completo | **CRUD completo** | CRUD completo |
| Exportar imagens da Agenda | ✓ | ✓ | ✓ |
| Contratos (acompanhar/enviar/baixar) | ✓ | — | ✓ |
| Modelos de contrato | ✓ | — | — |
| Comunicados | ✓ | — | — |
| Editor do site | ✓ | — | — |
| Usuários & permissões | ✓ | — | — |
| Registro de atividades | ✓ | — | — |
| Configurações | tudo | conta própria + tema | conta própria + tema |

- **Tela inicial por papel:** Diretor → Visão geral · Supervisor → Agenda ·
  Secretaria → Alunos.
- **Notificações:** filtradas pelo que o papel enxerga (ex.: Supervisor não recebe
  eventos de contrato).
- Racional: a **Stefany (Secretaria) cadastra tudo** — alunos, turmas, salas — e envia
  contratos; o Supervisor cuida da operação pedagógica (agenda) e consulta alunos;
  comunicação em massa, modelos, editor do site e gestão de acesso são do Diretor.
- O preview demonstra a matriz com **"Ver painel como…"** (troca simulada de papel);
  na versão real o papel vem da sessão.

## 5. Modelo de dados (Neon / Postgres)

Derivado do mock do preview (nomes em inglês no banco; PT na UI). **O DDL Postgres
completo e pronto pra rodar no Neon está em `docs/DASHBOARD_SCHEMA.sql`** (espelha esta
seção já com a auditoria de 09/Jun); o Drizzle gera as migrations a partir dele.

### Acesso & auditoria
- **users** (id, name, email, password_hash, role[`director`|`supervisor`|`secretary`],
  is_active, **must_change_password** (1ª senha temporária → troca obrigatória no 1º login,
  §6.10), **password_changed_at**, last_login_at, created_at) — **sem `invite_pending`**: o
  fluxo decidido é senha temporária, não convite-link.
- **password_reset_tokens** (id, user_id, token_hash, expires_at, used_at)
- **activity_log** (id, actor_type[`user`|`system`|`autentique`], actor_id nullable,
  action, target_type, target_id, detail jsonb, ip, user_agent, created_at)

### Estrutura escolar (ver AGENDA_PLAN.md §3)
- **rooms** (id, name, color, **teacher_name nullable**, is_active) — 13 salas seed.
  **O professor é atributo da SALA** (1 por sala, vale pra todos os pares/horários dela —
  é como o preview faz: tela "Salas & teachers", `sala.prof`). A turma **não** tem professor.
- **levels** (id, key, name, family[`fun`|`conv`|`power`|`sprint`], sort_order) —
  19 níveis seed, ordem de evolução
- **classes** (id, room_id, day_pair[`seg-qua`|`ter-qui`], start_time, level_id,
  capacity default 7 check ≤7, **period** (ex. `2026.2` — mesmo nome que
  `enrollments.period`), is_active) — **sem `teacher_name`**: o professor vem da sala
  (`rooms.teacher_name`) — `unique(room_id, day_pair, start_time, period)` (o mesmo slot é
  reusado a cada semestre); aula de 1h; horários válidos:
  8:30/9:30/10:30/13:30/14:30/15:30/16:45/17:45. `period` habilita "nem todo semestre
  oferece todos os níveis" e a virada de semestre (Fase 8).

### Matrículas & alunos
- **enrollments** (id, **status** [`active`|`cancelled`] (a matrícula em si — **não**
  confundir com `contracts.status` nem `students.is_active`), source[`form`|`import`|`manual`],
  submission_id `unique` (**idempotência** — mata as duplicatas, ver
  `docs/DEBITOS_TECNICOS.md`), class_format, payment_method fixo `boleto-6x`,
  **financial_responsible_type** [`legal`|`second`|`other`] (se `legal`/`second`, o
  financeiro é o próprio responsável — **não** duplica linha em `responsibles`),
  **requested_day_pair** + **requested_times** (jsonb — a preferência de horário da família
  no formulário, antes de alocar numa turma), authorization_media, authorization_contract,
  schedule_confirmed, submitted_at, period (ex. `2026.2`), notes)
- **students** (id, enrollment_id, name, birth_date, **class_id nullable** (turma é do
  ALUNO, não da matrícula — irmãos em turmas diferentes), **at_school_since** (deriva
  NOVO/NOVA na agenda), is_active, exit_reason, exit_note, exit_date)
- **responsibles** (id, enrollment_id, type[`legal`|`second`|`financial`], name, cpf,
  phone, email, relationship, birth_date) — a linha `financial` **só** existe quando
  `enrollments.financial_responsible_type='other'`; senão o financeiro aponta pro
  `legal`/`second`, sem duplicar dados.
- **addresses** (id, enrollment_id, cep, street, number, complement, neighborhood,
  city, state)

### Contratos & Autentique
- **contracts** (id, enrollment_id, **template_id** (qual modelo gerou o PDF →
  `contract_templates`), pdf_url, status
  [`pending`|`sent`|`viewed`|`signed`|`rejected`|`failed`], autentique_doc_id, sent_at, viewed_at,
  signed_at, **rejected_at**, **failed_at**, sent_via[`email`|`whatsapp`]) — "parado" =
  `sent`/`viewed` há ≥7 dias (derivado, alimenta alertas)
- **contract_events** (id, contract_id, event_id `unique` (dedup), type
  [`signature.viewed`|`signature.accepted`|`signature.rejected`|
  `signature.delivery_failed`|`document.finished`], payload jsonb, received_at)
- **contract_templates** (id, name, pdf_url, field_map jsonb, version, is_active,
  archived_at) — tela Modelos: importar PDF novo + mapear campos sem redeploy

### Comunicação & conteúdo
- **announcements** (id, subject, body, channels[`email`,`whatsapp`], audience_filter
  jsonb, status, kind[`manual`|`automatic`], scheduled_at, sent_at, created_by)
- **announcement_recipients** (id, announcement_id, enrollment_id, channel, status
  [`queued`|`sent`|`failed`|`prepared`]) — WhatsApp = mensagem preparada por família
  (API oficial é fase futura)
- **notifications** (id, user_id, type[`enroll`|`signed`|`viewed`|`stale`|`email`],
  student_id nullable, title, body, read_at, created_at)
- **site_content** (id, page_key, field_key, value, updated_by, updated_at)

## 6. Módulos / Telas (espelho do preview)

1. **Login** + Esqueci a senha
2. **Visão geral** — KPIs (ativos, novos, contratos pendentes, aguardando turma),
   funil Autentique de 4 barras, ocupação por sala, alunos por nível, entradas × saídas,
   seletor de período (Todos · Estudando · próximo período), aniversariantes, últimas
   matrículas
3. **Alunos** — tabela ordenável (cards no mobile), busca, filtros (nível com famílias,
   sala, teacher c/ "Sem teacher", horário, dia, período, situação, data com datepicker,
   bairro, irmãos…), coluna Turma, importação de planilha com validação/duplicados,
   exportação, nova matrícula manual, **detalhe** completo, desligamento com motivo +
   reativação
4. **Agenda** — 3 visões (Grade 13 colunas · Salas estilo Canva c/ NOVO/NOVA e
   "NÃO TEM VAGA" · Níveis com vagas), fila "aguardando turma", filtros transversais,
   mover/alocar com destinos válidos + confirmação de mudança de nível, CRUD de
   turma/sala, exportação PNG (sala, pacote do par, nível) — detalhes em
   `AGENDA_PLAN.md`
5. **Contratos** — grid/lista, status Autentique (4 etapas do caminho feliz +
   **Recusado/Falhou** num balde "precisa de ação", cor própria), timeline por contrato,
   badge "parado há N dias", cobrar por WhatsApp, baixar PDF
6. **Modelos** — versões do PDF de contrato, importação + mapeamento de campos
   (no preview é **sub-tela**, não item de menu top-level — não criar rota de nav própria)
7. **Comunicados** — escrever 1x, entregar por e-mail e/ou WhatsApp (preparado por
   família), variáveis ({{nome_responsavel}}…), filtro de público, histórico,
   automáticos (confirmação de matrícula, eventos Autentique, contrato parado)
8. **Notificações** — central de eventos com não-lidos, filtros, atalho pro aluno
   (no preview é o **painel do sininho** (`notifPanel`), não uma tela com rota própria)
9. **Editor de site** — todos os textos de todas as páginas (inclui matrícula), hover
   pontilhado + painel lateral, preview desktop/mobile, publicação com pendências
10. **Usuários & permissões** — 3 papéis (§4). O **Diretor cadastra as pessoas** (nome,
    e-mail, papel); cada uma faz login e **troca a própria senha** (modal da conta +
    "Esqueci a senha", §3). **Sempre ≥1 Diretor ativo (decidido 08/Jun/2026):** o último
    Diretor não pode ser **rebaixado, excluído nem desativado** — a UI bloqueia e mostra o
    motivo. "Ver painel como…" vira recurso real de suporte (Diretor visualiza como outro
    papel). **1ª senha (decidido 08/Jun/2026): senha temporária** — o Diretor define uma
    senha provisória ao cadastrar; a pessoa é **obrigada a trocá-la no 1º login** (a senha
    provisória não vale como definitiva). Sem fluxo de convite-link por e-mail.
11. **Registro de atividades** — auditoria somente leitura, busca + filtro por ator
12. **Configurações** — tema (3 sidebars × claro/escuro, transição circular), conta,
    segurança (2FA futuro), sessões ativas, reativar tours

## 7. Fluxo Autentique (assinatura digital)

Validado contra a doc oficial (docs.autentique.com.br). Já simulado por completo no
preview — implementar igual:

1. Secretaria/Diretor envia o contrato → API GraphQL cria o documento; o **próprio
   Autentique** entrega o link por e-mail e/ou **WhatsApp**
   (`delivery_method: DELIVERY_METHOD_WHATSAPP` — custo extra a confirmar; a dona já
   aprovou pagar). Status → `sent`.
2. Webhooks por evento: `signature.viewed` → `viewed` (roxo) · `signature.accepted` +
   `document.finished` → `signed` · `signature.rejected` → status `rejected` · `delivery_failed` → status `failed`
   (ambos saem do caminho feliz, viram alerta + notificação e badge vermelho).
   HMAC + dedup por event id + idempotência (§3).
3. Cada transição: atualiza timeline do contrato, loga em `activity_log`
   (ator `Autentique`), gera notificação e alimenta o funil da Visão geral.
4. Contrato `sent`/`viewed` há ≥7 dias → badge "parado", notificação `stale`,
   comunicado automático de lembrete.
5. **Sandbox** do Autentique para todos os testes (não consome créditos).

## 8. Testes

- **Matriz de validações:** `docs/DASHBOARD_VALIDACOES.md` — todo campo × a bateria de
  checagens (a fonte dos testes negativos do `reg-05` e das lacunas a definir).
- **Unit (Vitest):** validators, regras de turma (cap ≤7, slot único, destinos
  válidos), derivações (NOVO, "parado", período), RBAC helpers.
- **API:** testes das rotas serverless com banco de teste (Neon branch) — auth, RBAC
  por papel, webhook Autentique (HMAC inválido, evento duplicado).
- **E2E (Playwright):** login, gating por papel (Diretor/Supervisor/Secretaria),
  fluxos completos (matrícula manual → alocar na agenda → enviar contrato → webhook
  simulado → assinado), exportação de imagem. Herda o espírito dos scripts do preview
  (`scripts/dashboard-smoke.mjs`, 191+ asserções; `dashboard-prints.mjs`, 47 prints).
- **Smoke do preview** continua rodando enquanto o preview for vitrine de decisões.

### 8.1 Harness de regressão (adotar o padrão do evollutezap)

Decisão (08/Jun/2026): adotar o **harness de teste do evollutezap**
(`evollute projects/evollute-checkout/evollutezap/extension/test-harness/`) como
modelo da suíte E2E/visual desta dashboard. É a evolução madura do que
`dashboard-smoke.mjs`/`dashboard-prints.mjs` já fazem aqui — não um import estranho.

O que **transfere direto** (o valor está aqui):
- **`reg-NN` por módulo** — um script por tela (login, alunos, agenda, contratos,
  comunicados…), cada um testando o caminho feliz **e os negativos que bloqueiam
  salvar** ("regressão testa TUDO, inclusive os erros"): cap >7, slot duplicado,
  CPF inválido, mover pra turma sem vaga, RBAC negando rota por papel.
- **`reg-lib` compartilhada** — `launch()` (browser + sessão autenticada),
  `makeReporter()` (`step/shot/dump`, ✅/❌, print automático no erro),
  `startWatchdog()` (anti-trava: mata o processo após X ms) e `compareScreenshot()`
  (**regressão visual com pixelmatch vs baseline commitado** — só acusa quando muda;
  cria baseline na 1ª vez; `UPDATE_SNAPSHOTS=1` regrava). Diffs/prints caem em
  `_review/` (gitignored), no espírito dos comentários estilo Figma da dona.
- **Setup/teardown de 1 passo** + **fallback stub** (backend falso em memória) pros
  fluxos de UI que não precisam de banco.

O que **muda** (mais simples aqui — a dashboard é SPA, não extensão MV3):
- Cai toda a parte de extensão (service worker, `chrome.storage`, `--load-extension`,
  EXT_ID). Sobra Playwright dirigindo a SPA normalmente.
- **Backend isolado → Neon branch de teste** (já previsto no §8). Portar a **guarda
  anti-banco-dev** do evollutezap (`make-token.mjs` recusa rodar fora do banco de
  teste): o setup só roda se a connection string for a do branch de teste, nunca a de
  produção. **Crítico aqui por causa de dados de menores / LGPD (§3).**
- Auth do harness usa o login real (cookie httpOnly + token de teste) em vez de
  injeção em `chrome.storage`.

Deps mínimas: `playwright`, `pixelmatch`, `pngjs`. Construir junto com cada fase
(cada módulo entrega seu `reg-NN`), não no fim.

### 8.2 Paridade visual preview × React + testes "que dá pra ver"

Pedido do Gabriel (09/Jun): a suíte tem que **cobrir todos os casos** e ser **vista
rodando** — não basta passar no CI silenciosamente. Dois acréscimos ao §8.1:

- **Paridade `dashboard.html` × front React (a checagem "o preview é a lei visual").**
  Além do baseline pixelmatch contra snapshot commitado, rodar um teste que abre **a mesma
  tela** no preview (`/dashboard`) e no React novo, tira print dos dois no mesmo viewport e
  faz o diff. Acima de um limiar de diferença, falha com o diff anexado em `_review/`. É a
  prova objetiva, tela a tela, de que a implementação ficou **idêntica** ao preview (§10).
  Vale pros 12 módulos × claro/escuro × 3 sidebars × desktop/mobile (amostrar as combinações
  relevantes pra não explodir o tempo).
- **Modo visível (`--headed` + `slowMo`) pra revisão humana.** Um alvo de npm (ex.
  `test:e2e:watch`) roda o Playwright com janela aberta e passos desacelerados, pra
  acompanhar os cliques na tela; o CI roda headless. Os fluxos completos do §8 (login →
  matrícula manual → alocar na agenda → enviar contrato → webhook simulado → assinado)
  servem de "demo automatizada" além de teste.
- **Cobertura = a matriz inteira.** Cada linha de `DASHBOARD_VALIDACOES.md` (incl. as ⚠
  quando resolvidas) é um teste negativo no `reg-NN`; cada rota de `DASHBOARD_API.md` tem
  teste de RBAC por papel (200 pro papel certo, 403 pros outros) e de caminho de erro
  (`409`/`422` das regras de negócio). Sem buraco: validação, RBAC e webhook (HMAC inválido,
  evento duplicado) são exercidos.

## 9. Fases de implementação

- **Fase 0 — Preview (FEITO):** mockup navegável aprovado; Agenda implementada;
  fluxo Autentique simulado; tours; comentários estilo Figma.
- **Fase 1 — Fundação:** Neon + schema (§5) + auth completa (login, esqueci senha,
  RBAC 3 papéis) + shell da dashboard (sidebar, temas, tela inicial por papel) +
  deploy protegido. Sem dados reais.
- **Fase 2 — Alunos & Agenda no banco (paralelo):** CRUD de alunos/turmas/salas +
  alocação + filtros + importação de planilha (dados de teste); gravação nova de
  matrícula no Neon com `submission_id` idempotente, testada **isolada**.
- **Fase 3 — Contratos & Autentique:** modelos de contrato, geração do PDF, envio via
  Autentique (sandbox), webhooks, timeline, alertas de parado.
- **Fase 4 — Visão geral & notificações:** KPIs, gráficos, funil, central de eventos.
- **Fase 5 — Comunicados (Resend + WhatsApp preparado):** transacional + manuais +
  automáticos.
- **Fase 6 — Editor de site:** `site_content` + wrapper editável; migrar textos das
  páginas para chaves editáveis.
- **Fase 7 — Cutover & importação:** import da planilha (CSV) + PDFs do Drive;
  matrícula passa a gravar no Neon; aposentar Apps Script/planilha; remover
  `dashboard.html` + rewrite do `vercel.json`. **Janela de manutenção curta e
  planejada.**
- **Fase 8 — Futuro:** 2FA; API oficial do WhatsApp; arrastar-e-soltar na grade;
  assistente de virada de semestre; histórico Aluno × Matrícula (match por nome +
  nascimento do aluno, fila de revisão) junto com boletins — decisão registrada,
  fora do MVP.

## 10. Decisões registradas (não repropor)

- **Rematrícula = matrícula nova** pelo formulário normal (responsável financeiro muda
  muito). Sem tela de campanha.
- **Pagamento é sempre boleto/carnê em 6 parcelas** — não inventar PIX/cartão.
- **Histórico Aluno × Matrícula adiado** para a fase de boletins (Fase 8).
- **Turma pertence ao aluno** (`students.class_id`), não à matrícula.
- **Sala não é presa a família de nível** — nível é atributo da turma.
- **Custos recorrentes** (Neon/Vercel/Autentique) são da escola; escopo novo =
  negociação nova.
- **O preview é a lei visual** (decidido 08/Jun/2026): implementação tem que ficar
  **idêntica**. Consequências: Chart.js (não Recharts), View Transitions (não Framer),
  controles do preview portados 1:1 (shadcn é secundário). Detalhe no §2.

## 11. Lacunas conhecidas & decisões pendentes (levantadas 08/Jun/2026)

O preview validou o **caminho feliz síncrono**. Como ele é mock em memória que assume
sucesso, há estados que **ele nunca mostrou** — e que, pela regra "o preview é a lei",
precisam ser **adicionados ao próprio `dashboard.html` primeiro** (onde a dona valida),
**não** improvisados direto no React. Completar o preview faz parte do escopo, antes/no
início da implementação:

- **Shimmers / skeletons de carregamento** — ✅ FEITO no preview (08/Jun): overlay de
  skeleton por formato de tela (cards/tabela/grade/painel/editor), disparado a cada
  navegação e no login. Helpers `skelFor`/`flashSkel` no `dashboard.html`.
- **Telas sem dados (empty states)** — ✅ FEITO nas telas de lista (Alunos, Contratos,
  Atividade, Usuários, Comunicados, Modelos), na **Agenda** (estado "agenda vazia" com
  CTA "Criar primeira turma" — o 1º semestre nasce assim) e nas listas da Visão geral.
  Componente `emptyState` distingue "nenhum dado ainda" de "filtro não achou". A
  **Visão geral** também tem o estado-zero completo: KPIs/strip zerados, widgets com
  placeholder e overlay "Sem dados ainda" sobre os 5 gráficos Chart.js. O badge
  "Preview · dados fictícios" cicla os estados (normal → sem dados → erro) pra aprovação.
- **Estados de erro** — ✅ FEITO. (1) **Carregar**: overlay "Não foi possível carregar
  esta tela" com **Tentar de novo**, em qualquer tela (cobre falha ao carregar / offline /
  timeout). (2) **Salvar**: nos 11 modais de salvar (turma nova/editar, sala, matrícula
  nova/editar, convite, usuário, modelo editar/renomear, senha, conta), a gravação falha
  com toast amarelo (ícone de alerta) e o **formulário fica aberto** preservando o que foi
  digitado. Helpers `errorState`/`applyErrorOverlay`/`qaRetry`/`saveFails`/`toastErr`.
  Tudo só aparece sob a condição real (carregando / 0 resultados / request falhou) — o
  ciclo do badge é só o simulador do preview, **não** vai pro produto.
- **Estados que só existem com backend** — update otimista + rollback, e **conflito de
  edição concorrente** (dois usuários na mesma turma/aluno). Inexistentes no preview.

Decisões que estavam em aberto — **todas fechadas em 08/Jun/2026** (riscadas abaixo):

- ~~Paginação da tabela de Alunos~~ — **já existe no preview** (`PAGE_SIZE=20`, pager +
  "Mostrando X–Y de Z"), em Alunos e Contratos. Não é decisão em aberto; só portar pro
  React com paginação no servidor.
- ~~Acessibilidade dos controles customizados~~ — **DECIDIDO 08/Jun: básico pragmático** —
  teclado (Tab/Enter/Esc/setas), foco visível e label/ARIA nos controles custom (cselect,
  datepicker, checkbox); **sem** perseguir WCAG AA formal. Reimplementar onde a regra "sem
  nativo" tirou de graça.
- ~~Status de contrato recusado/falho~~ — **DECIDIDO 08/Jun**: status próprio
  `rejected`/`failed` (5º/6º estado), fora do caminho feliz, com alerta + notificação.
  Ver §5, §6.5 e §7.
- ~~LGPD: apagamento do titular × `activity_log`~~ — **DECIDIDO 08/Jun: anonimizar no log**
  — apaga os dados pessoais do aluno e mantém as entradas de auditoria com o alvo
  anonimizado (ex. "aluno #123 [removido]"): cumpre o direito de apagamento **e** preserva
  a trilha de quem agiu.

## 12. Requisitos transversais de UX (confirmados 08/Jun/2026)

Valem em todas as telas/formulários, não só numa:

- **Botão de salvar com estado "enviando" + trava de duplo-clique** — ao submeter, o
  botão vira "Salvando…"/spinner e fica desabilitado até a resposta. Evita gravação
  duplicada (liga direto no `submission_id` idempotente do §5 e no
  `DEBITOS_TECNICOS.md` #1 — matrículas duplicadas ao re-clicar).
- **Confirmação real em ações destrutivas** — excluir aluno/turma/usuário/modelo (e
  desligar aluno) pede confirmação em modal próprio dizendo a consequência; nunca
  `confirm()` nativo.
- **Cópia (textos) dos e-mails transacionais** — convite de usuário, reset de senha,
  confirmação de matrícula e contrato (Autentique). Alguém precisa escrever esses textos;
  ficam versionados junto aos templates (auth na Fase 1, Resend na Fase 5, Autentique §7).

## 13. Backup & recuperação (medo nº 1: perder dados de aluno)

Dados de menores não podem se perder. Camadas redundantes e independentes entre si:

1. **PITR do Neon (point-in-time recovery)** — nativo do Postgres gerenciado: dá pra
   restaurar o banco a qualquer minuto recente, e **branches** permitem clonar o estado pra
   investigar sem mexer em produção. É a primeira linha contra "apaguei sem querer".
2. **Dump lógico agendado** — `pg_dump` diário (cron, §14) pra object storage (Vercel
   Blob/R2), com retenção (ex. 30 diários + 12 mensais). Backup que **não depende** do
   provedor estar de pé; restaurável em qualquer Postgres.
3. **A planilha do Google continua viva** durante e após o cutover — **não se apaga no dia
   da virada** (Fase 7). Como a importação é **idempotente** (`submission_id`), reimportar a
   planilha quantas vezes for preciso é seguro e não duplica. Ela é um backup redundante e
   independente do banco novo por todo o período de confiança.
4. **PDFs dos contratos** permanecem no Drive (o banco guarda só a URL) — perder/trocar o
   storage de banco não perde o documento assinado.
5. **Trilha de auditoria preservada** — `activity_log` registra quem fez o quê; o
   apagamento LGPD **anonimiza o alvo** mas mantém a entrada (§11), então nunca se perde o
   "quem mexeu".

> Resultado: pra perder dado de aluno teria que falhar **tudo ao mesmo tempo** — banco +
> PITR + dump + planilha. Antes do cutover, **testar uma restauração de verdade** (restore
> do dump num branch de teste) pra provar que o backup presta — backup não testado não é
> backup.

## 14. Apêndice — o que configurar (contas, serviços, env vars)

Checklist operacional pra tirar a dashboard do papel (nada disso é necessário pro site
atual; só pra o backend novo). Cada item vira passo-a-passo no estilo do
`docs/INSTRUCOES-CONFIGURACAO.md` na hora da implementação.

| Serviço | Pra quê | Conta | Custo inicial |
|---|---|---|---|
| **Neon (Postgres)** | banco principal + **branch de teste** | nova | free tier; paga ao crescer |
| **Vercel** | já existe — ligar Serverless Functions + env vars + cron | atual | incluso |
| **Resend** | e-mail transacional + comunicados; **verificar domínio** (SPF/DKIM) | nova | free tier generoso |
| **Autentique** | assinatura digital (API GraphQL + webhook); usar **sandbox** nos testes | nova | por documento; WhatsApp extra (a dona aprovou) |
| **Object storage** | dumps de backup e (opcional) PDFs — Vercel Blob ou Cloudflare R2 | nova/atual | baixo (pode adiar: PDF segue no Drive) |

**Variáveis de ambiente (Vercel, prefixo conforme o uso):**

```
DATABASE_URL                 # Neon (produção)  — NUNCA usada pelo harness de teste (§8.1)
DATABASE_URL_TEST            # Neon (branch de teste) — só o harness usa
JWT_SECRET                   # assinatura do JWT da sessão
CSRF_SECRET                  # token CSRF das mutações
RESEND_API_KEY               # envio de e-mail
AUTENTIQUE_TOKEN             # API GraphQL
AUTENTIQUE_WEBHOOK_SECRET    # validar HMAC do webhook (§3, §7)
BLOB_READ_WRITE_TOKEN        # object storage (backup/PDF), se Vercel Blob
# as VITE_GOOGLE_APPS_SCRIPT_URL / VITE_EMAILJS_* atuais seguem como estão até o cutover
```

**Ordem sugerida de setup:** Neon (banco + branch teste) → env vars no Vercel → Resend
(domínio verificado) → Autentique (sandbox) → cron de backup/`stale`. Custos recorrentes
são da escola (decisão §10).
