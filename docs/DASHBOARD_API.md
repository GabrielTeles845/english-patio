# Contrato de API — Dashboard English Patio

Documento vivo, criado em **09/Jun/2026**. É a **spec do backend** que o
`public/dashboard.html` (preview, "lei visual") e o front React real consomem. Cada
função hoje **mockada** no preview vira uma das rotas abaixo — o mapa função → rota está
na §16. Nada aqui está implementado; é o contrato que a implementação tem que cumprir.

Fontes de verdade que este doc costura:
- **Telas/fluxos:** `docs/DASHBOARD_PLAN.md` (§§5, 6, 7).
- **Validações por campo:** `docs/DASHBOARD_VALIDACOES.md` (toda rota revalida com Zod).
- **Agenda (turmas/salas/alocação):** `docs/AGENDA_PLAN.md`.
- **Idempotência da matrícula:** `docs/DEBITOS_TECNICOS.md` #1.

> **Não quebra o site atual.** Estas rotas são **novas** (`/api/*`) e convivem com o
> fluxo de matrícula de hoje (form → PDF → Apps Script → planilha/Drive/e-mail), que
> segue **intocado** até o cutover (DASHBOARD_PLAN §1, §9 Fase 7). A rota de ingestão de
> matrícula (§5.1) só passa a ser o destino do formulário **na virada**.

---

## 0. Convenções (valem para TODAS as rotas)

- **Base:** `/api/*` — Vercel Serverless Functions, mesmo projeto da SPA (gate `tsc`/lint
  protege o deploy de produção; DASHBOARD_PLAN §2).
- **Formato:** JSON. Envelope único de resposta:
  - sucesso: `{ "ok": true, "data": <payload> }`
  - erro: `{ "ok": false, "error": { "code": "STRING", "message": "PT-BR", "fields"?: { campo: "msg" } } }`
- **Status HTTP:** `200` ok · `201` criado · `400` validação (`error.fields` preenchido) ·
  `401` não autenticado · `403` sem permissão (RBAC) · `404` não achado · `409` conflito
  (slot duplicado, e-mail duplicado, edição concorrente) · `422` regra de negócio ·
  `429` rate-limit · `500` erro interno.
- **Auth:** JWT curto em **cookie httpOnly + secure + SameSite=Lax**, com refresh
  (DASHBOARD_PLAN §3). O front **nunca** lê o token.
- **CSRF:** toda mutação (`POST/PATCH/PUT/DELETE`) exige header `x-csrf-token` (double
  submit cookie). `GET` é livre de CSRF.
- **RBAC server-side:** toda rota revalida o papel da sessão (`director`|`supervisor`|
  `secretary`) — o front esconder a tela **não** é autoridade (DASHBOARD_PLAN §3, §4).
  Falha de papel → `403 { code: "FORBIDDEN" }`. A matriz por rota está em cada §.
- **Validação:** **Zod** em toda entrada, espelhando `DASHBOARD_VALIDACOES.md`
  (incl. tetos de tamanho da §99, anti-XSS `badChars`, normalização). Client melhora UX,
  servidor é autoridade.
- **Idempotência de escrita (UX transversal, DASHBOARD_PLAN §12):** o front trava
  duplo-clique; o servidor também precisa ser idempotente onde o plano pede
  (`submission_id` na matrícula §5.1; `event_id` no webhook §9).
- **Efeitos colaterais padronizados:** muitas mutações **(a)** gravam em `activity_log`
  (ator = usuário da sessão, ou `Sistema`/`Autentique`) e **(b)** podem gerar
  `notifications`. Onde acontece está anotado como **`→ log`** e **`→ notif`**.
- **Paginação:** listas grandes usam `?page=1&pageSize=20` (preview já usa `PAGE_SIZE=20`);
  resposta inclui `{ items, page, pageSize, total }`. Ordenação no servidor.
- **Datas:** API troca **ISO 8601** (`YYYY-MM-DD`, `…Z`); a UI faz a máscara `dd/mm/aaaa`.
- **LGPD:** CPF **mascarado** nas listas; revelado só no detalhe e **com `→ log` de
  acesso** (DASHBOARD_PLAN §3). Dados de menores ⇒ rigor extra; HTTPS sempre.

---

## 1. Auth & conta — `replaces`: `doLogin`, `logout`, `sendForgot`, `savePass`, `saveAccount`

| Rota | RBAC | Descrição |
|---|---|---|
| `POST /api/auth/login` | público | login |
| `POST /api/auth/logout` | sessão | encerra sessão |
| `GET  /api/auth/me` | sessão | usuário + papel + flag `mustChangePassword` |
| `POST /api/auth/forgot` | público | dispara e-mail de reset (Resend) |
| `POST /api/auth/reset` | público (token) | troca senha via token de uso único |
| `POST /api/account/password` | sessão | troca a própria senha (confere a atual) |
| `PATCH /api/account` | sessão | edita nome/e-mail próprios |

**`POST /api/auth/login`**
- Body: `{ email, password }`.
- Validação: e-mail formato; senha não-vazia. **Rate-limit por IP e por e-mail**
  (DASHBOARD_PLAN §3); log de tentativas falhas. Hash **bcrypt cost ≥ 12**.
- Resposta `200`: set-cookie (JWT) + `{ user:{id,name,email,role}, mustChangePassword }`.
  Se `mustChangePassword` (1ª senha temporária, DASHBOARD_PLAN §6.10), o front força a
  troca antes de liberar a dashboard. **→ log** (`login`).
- Erros: `401 { code:"BAD_CREDENTIALS" }` (mensagem genérica — não revelar se o e-mail
  existe) · `429 { code:"RATE_LIMITED" }`.

**`POST /api/auth/forgot`** — Body `{ email }`. **Sempre responde `200`** (não revela
existência do e-mail). Se existe: gera token de uso único, **hash do token no banco**,
expiração curta, envia link por Resend. **→ log** (`password_reset_requested`).

**`POST /api/auth/reset`** — Body `{ token, password }`. Valida token (não usado, não
expirado) + **política de senha** (VALIDACOES §8: ≥10 + maiúscula + minúscula + número +
especial). Marca `used_at`. **→ log**.

**`POST /api/account/password`** — Body `{ currentPassword, newPassword }`. Confere a
atual; aplica política de senha; em 1º login (`mustChangePassword`) dispensa a atual.
Limpa `mustChangePassword`. **→ log**.

**`PATCH /api/account`** — Body `{ name?, email? }`. E-mail **único** entre usuários
(`409 EMAIL_TAKEN`). **→ log**.

---

## 2. Visão geral / KPIs — `replaces`: `refreshOverviewData`, `renderHealth`, `renderVagas`, `renderNiveis`, `renderMovimento`, `renderBirthdays`, `renderHoods`

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/overview?period=&cohort=` | **director** | tudo da Visão geral num payload |

- Query: `period` (`6m`|`12m`|`month`), `cohort` (`all`|`studying`|`2026.2`).
- Resposta agrega (deriva no servidor, nunca confia no client):
  `{ kpis:{active,newWeek,contractsPending,enrolledMonth,withoutClass},
     funnel:{pending,sent,viewed,signed,rejected,failed},
     occupancyByRoom:[{roomId,name,color,occupied,capacity}],
     studentsByLevel:[{levelKey,name,family,count}],
     movement:[{period,entries,exits,byRoom,byReason}],
     birthdays:[{studentId,name,date}], neighborhoods:[{name,count}],
     recent:[{enrollmentId,studentName,neighborhood,submittedAt}] }`.
- **Estado-zero** (DASHBOARD_PLAN §11): base vazia ⇒ KPIs zerados + flags pra UI mostrar
  "Sem dados ainda". Supervisor/Secretaria ⇒ `403` (Visão geral é só do Diretor, §4).

---

## 3. Alunos & matrículas (leitura/lista) — `replaces`: `renderTable`, `filteredStudents`, `openDetail`

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/students?…filtros…&page=&pageSize=&sort=` | director, secretary (CRUD); **supervisor (somente leitura)** | lista paginada |
| `GET /api/students/:id` | idem | **detalhe** completo |

- Filtros (query, todos derivados de `class_id`; ver AGENDA_PLAN §7): `level`, `room`,
  `teacher` (inclui `none`), `time`, `dayPair`, `period`, `contractStatus`, `status`
  (`active`|`inactive`), `neighborhood`, `hasSiblings`, `media`, `dateFrom`, `dateTo`,
  `q` (busca por nome/responsável). **CPF mascarado** na lista.
- `GET /api/students/:id`: payload completo (alunos/kids, responsáveis, endereço, turma,
  contrato, histórico). **Revela CPF ⇒ `→ log`** (`view_student_pii`, LGPD §3).
- **Empty state** distinto: "nenhum dado ainda" × "filtro não achou" (DASHBOARD_PLAN §11).

---

## 4. Matrícula — criar/editar/desligar/realocar

### 4.1 Ingestão do formulário público (a rota do CUTOVER) — `replaces`: payload do `enrollmentService.ts`
**`POST /api/enrollments`** · RBAC: **público** (origem = site) **ou** sessão (manual).
- **Hoje** o `submitEnrollment` faz POST `no-cors` pro Apps Script com
  `{ formData, pdfBase64, timestamp }`. Na **Fase 7 (cutover)** esta rota vira o destino:
  mesmo payload **+ `submissionId`**.
- Body: `{ source:"form"|"manual", submissionId, formData:<FormData>, pdfBase64?, timestamp }`.
  `FormData` = a interface de `src/types/enrollment.ts` (student1/2, responsável legal/
  segundo/financeiro, endereço, schedule, autorizações).
- **Idempotência (crítico):** `submission_id` é `unique`; reenvio com o mesmo id **não
  duplica** — retorna a matrícula já criada (`200`), em vez de criar outra. Mata o bug
  DEBITOS #1 (re-clicar em "gerar contrato"). VALIDACOES §99.9.
- Mapeia 1 payload → `enrollments` (com `financial_responsible_type` e a preferência de
  horário `requested_day_pair`/`requested_times`) + `students` (kids) + `responsibles`
  (legal/second; **`financial` só quando `type='other'`** — senão aponta pro legal/second) +
  `addresses` + `contracts` (status inicial `pending`, com `template_id`).
  `payment_method` fixo `boleto-6x`. `state` **deve ser `GO`** (`422 OUTSIDE_GO`).
- Validação: bateria inteira das VALIDACOES §§1–6 (CPF dígito, telefone 3º=9, datas
  ≤20/≥18, autorizações obrigatórias, slots de horário reais).
- Resposta `201`: `{ enrollmentId, students:[...], contractId }`. **→ log**
  (`enrollment_created`, ator `Sistema` se `source=form`) · **→ notif** (`enroll`).
- **Backup/cutover:** durante a Fase 7 a planilha **não** é apagada; reimportação é segura
  pela idempotência (ver DASHBOARD_PLAN §13 Backup).

### 4.2 Matrícula manual — `replaces`: `submitNewEnrollment`
**`POST /api/enrollments`** com `source:"manual"` (mesma rota). RBAC: **director, secretary**.
Sem `pdfBase64` (PDF é gerado depois, na tela Contratos). Mesmas validações.
**→ log** (`enrollment_created`, ator = usuário) · **→ notif**.

### 4.3 Editar matrícula — `replaces`: `saveEditEnrollment`
**`PATCH /api/enrollments/:id`** · RBAC: **director, secretary**.
- Body: campos editáveis de kids/responsáveis/endereço/"na escola desde". Validação por
  campo (VALIDACOES). **Conflito de edição concorrente** (DASHBOARD_PLAN §11): usar
  `If-Match`/`version`; divergência ⇒ `409 STALE_WRITE` (a UI reabre o form preservando o
  que foi digitado — DASHBOARD_PLAN §11 "Salvar"). **→ log** (diff dos campos).

### 4.4 Desligar aluno — `replaces`: `confirmExit`
**`POST /api/students/:id/deactivate`** · RBAC: **director, secretary**.
- Body: `{ reason, note? }`. `reason` ∈ `EXIT_REASONS`; **`note` obrigatória se
  `reason="other"`** (VALIDACOES §14), máx 500. Marca `is_active=false`, grava
  `exit_reason`/`exit_note`/`exit_date`. **Não apaga** (reativável). **→ log**.
- Confirmação destrutiva é no front (modal próprio, DASHBOARD_PLAN §12).

### 4.5 Reativar aluno — `replaces`: `reactivateStudent`
**`POST /api/students/:id/reactivate`** · RBAC: **director, secretary**.
- Limpa `exit_*`. **Vaga não fica reservada:** se a turma do kid lotou no meantime, o kid
  volta com `class_id=null` (fila "aguardando turma") em vez de estourar `capacity`.
  Resposta lista os kids que caíram na fila. **→ log**.

### 4.6 Mover / alocar kid em turma — `replaces`: `dropMoveKid`, `openMoverKid`, `agDropEmpty`
**`PATCH /api/students/:studentId/kids/:kidId/class`** · RBAC: **director, supervisor,
secretary** (Agenda é CRUD pros 3 — §4).
- Body: `{ classId | null, allowLevelChange?:bool, extraSeat?:bool }`.
- Regras (VALIDACOES §13, AGENDA_PLAN §5.2): destino tem que ter vaga, **salvo
  `extraSeat`** (cap 7→8→9, **máx 2 extras**; ≥9 ⇒ `422 ROOM_OVERFLOW`); mudança de nível
  exige `allowLevelChange=true` senão `422 LEVEL_CHANGE_REQUIRES_CONFIRM`. `null` =
  remover da turma (volta pra fila). **→ log** (origem → destino, ex. "moveu Davi: Green
  9:30 → Peach 14:30").

### 4.7 Importação de planilha — `replaces`: `importPicked`, `importDropped`
| Rota | RBAC | Descrição |
|---|---|---|
| `POST /api/enrollments/import` | director, secretary | **dry-run**: valida + dedup, devolve relatório |
| `POST /api/enrollments/import/commit` | director, secretary | grava as linhas aprovadas |

- Upload **CSV ou XLSX** (VALIDACOES §16; XLSX convertido p/ CSV no mesmo pipeline).
- **Dry-run** devolve `{ toImport:[...], duplicatesRemoved:N, needsReview:[{row,reasons}] }`:
  - **Dedup idempotente**: linhas iguais exceto Data/Hora e Link PDF = mesma matrícula
    (fica a 1ª) — mata DEBITOS #1. Quem já está no banco (`submission_id`) **não** reentra.
  - **Fila de revisão**: CPF/telefone/data/e-mail inválidos ou **endereço fora de GO**.
  - Campos ausentes (sem "na escola desde"/sem horário) ⇒ entra **sem turma**.
- **Commit** persiste só o aprovado, idempotente. **→ log** (`import`, contagem).
- **Reset p/ teste** (preview tem botão "excluir todas as matrículas"): no real é
  **`POST /api/enrollments/purge`**, **director-only**, **só no banco de teste** (a guarda
  anti-banco-produção do §8.1; **nunca** existe rota destas apontando pra produção).

### 4.8 Exportar — `replaces`: `exportCSV`
**`GET /api/enrollments/export?…filtros…`** · RBAC: **director, secretary**.
Devolve CSV (mesmos filtros da lista). **→ log** (`export_students` — LGPD, quem exportou).

---

## 5. Agenda — turmas & salas — `replaces`: `agSaveTurma`, `agUpdateTurma`, `agDelTurma`, CRUD de salas

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/classes` / `GET /api/rooms` / `GET /api/levels` | os 3 papéis | dados da Agenda |
| `POST /api/classes` | os 3 | criar turma |
| `PATCH /api/classes/:id` | os 3 | editar turma |
| `DELETE /api/classes/:id` | os 3 | excluir turma (só vazia) |
| `POST /api/rooms` | os 3 | criar sala |
| `PATCH /api/rooms/:id` | os 3 | renomear/cor/teacher |
| `POST /api/rooms/:id/deactivate` | os 3 | desativar (só sem turmas) |

- **Turma** (VALIDACOES §10, AGENDA_PLAN): `{ roomId, dayPair, startTime, levelId,
  capacity≤7, period }` — **sem professor** (é atributo da sala; define-se via
  `PATCH /api/rooms/:id`). `(roomId, dayPair, startTime, period)` **único** ⇒
  `409 SLOT_TAKEN` (o slot é reusado a cada semestre).
  `startTime` ∈ 8 slots reais. Editar `capacity` **nunca < ocupação atual** ⇒ `422`.
  `DELETE` só se vazia (`422 CLASS_NOT_EMPTY` — oferecer mover alunos antes).
- **Sala** (VALIDACOES §11): nome **único** case-insensitive (`409 ROOM_NAME_TAKEN`),
  máx 40; desativar só **sem turmas** (`422 ROOM_HAS_CLASSES`).
- Toda mutação **→ log**.

---

## 6. Contratos & Autentique — `replaces`: `openContractModal` (enviar), `autentiqueTimeline`, `markSigned`/`markSent` (no real = webhook), download

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/contracts?…filtros…` | director, secretary | lista/grid (status) |
| `GET /api/contracts/:id` | director, secretary | detalhe + **timeline** |
| `POST /api/contracts/:id/send` | director, secretary | envia via Autentique (sandbox em teste) |
| `GET /api/contracts/:id/pdf` | director, secretary | baixar PDF (`→ log`) |
| `POST /api/contracts/:id/remind` | director, secretary | preparar cobrança WhatsApp |

- **Enviar** (`/send`): chama a **API GraphQL do Autentique**, que entrega o link por
  e-mail e/ou **WhatsApp** (`DELIVERY_METHOD_WHATSAPP`). Guarda `autentique_doc_id`,
  status → `sent`. **→ log** (ator usuário) · **→ notif**. (DASHBOARD_PLAN §7.)
- **markSigned/markSent do preview são simulação.** No real os status vêm do **webhook**
  (§9) — fonte de verdade. Override manual, se existir, é **director-only** e auditado.
- **Status** (DASHBOARD_PLAN §5): `pending`→`sent`→`viewed`→`signed` (caminho feliz) +
  `rejected`/`failed` (balde "precisa de ação", cor própria). "Parado" = `sent`/`viewed`
  há ≥7 dias (derivado).

---

## 7. Modelos de contrato — `replaces`: `tplImportValidate`, `setActiveTpl`, `saveTplRename`, `deleteTpl`

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/templates` | **director** | lista de modelos |
| `POST /api/templates` | director | importar PDF + mapear campos |
| `PATCH /api/templates/:id` | director | renomear / remapear |
| `POST /api/templates/:id/activate` | director | definir o ativo |
| `DELETE /api/templates/:id` | director | arquivar |

- Upload **PDF ≤ 16 MB** (VALIDACOES §12); ativar exige **todos os campos mapeados**
  (`422 UNMAPPED_FIELDS`). `field_map` em jsonb (coordenadas, como o `pdfService` atual).
  Toda mutação **→ log**.

---

## 8. Comunicados — `replaces`: `sendComm`, `commTexts`, preview

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/announcements` | **director** | histórico |
| `POST /api/announcements/preview` | director | render com variáveis (sem enviar) |
| `POST /api/announcements` | director | enviar (e-mail Resend e/ou WhatsApp preparado) |

- Body: `{ subject(≤150), body(≤2000), channels:["email"|"whatsapp"], audienceFilter }`
  (VALIDACOES §15). **Assunto+corpo obrigatórios**; `channels` ≥1; **variável aberta `{{`
  sem `}}` bloqueia** (`400`). Variáveis: `{{nome_responsavel}}`, `{{nome_aluno}}`.
- Cria `announcements` + `announcement_recipients` (WhatsApp = "preparado por família",
  API oficial é fase futura). **Automáticos** (confirmação de matrícula, eventos
  Autentique, contrato parado) nascem do servidor/cron, não desta rota. **→ log**.

---

## 9. Webhook Autentique (entrada de eventos) — `replaces`: a simulação de status do preview

**`POST /api/webhooks/autentique`** · RBAC: **nenhum** (verificação por assinatura).
> Guia completo e código (HMAC, raw body no Vercel, payload, dedup, eventos) em
> **`docs/AUTENTIQUE_INTEGRACAO.md §3`**.
- **HMAC** obrigatório (`x-autentique-signature`) — assinatura inválida ⇒ `401`, sem
  processar (DASHBOARD_PLAN §3, §7).
- **Dedup por `event_id`** (`unique` em `contract_events`) — entrega sem ordem e com
  duplicatas; processar **idempotente**; responder rápido (`200`) e processar.
- Eventos → transição de `contracts.status`:
  `signature.viewed`→`viewed` · `signature.accepted`+`document.finished`→`signed` ·
  `signature.rejected`→`rejected` · `delivery_failed`→`failed`.
- Cada transição: atualiza timeline, **→ log** (ator **`Autentique`**, não editável),
  **→ notif** (`viewed`/`signed`/`stale`), alimenta o funil da Visão geral.

---

## 10. Usuários & permissões — `replaces`: `submitInvite`, `saveUser`, (desativar)

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/users` | **director** | lista |
| `POST /api/users` | director | cadastrar pessoa + **senha temporária** |
| `PATCH /api/users/:id` | director | editar nome/e-mail/papel |
| `POST /api/users/:id/deactivate` | director | desativar |

- **Criar** (VALIDACOES §9): `{ name, email(único), role, tempPassword }`. E-mail duplicado
  ⇒ `409 EMAIL_TAKEN`. A pessoa é **forçada a trocar a senha no 1º login** (§1, sem
  convite-link). **→ log** · e-mail de boas-vindas (Resend).
- **Guarda do último Diretor (DASHBOARD_PLAN §6.10):** não dá pra **rebaixar, excluir nem
  desativar** o **último Diretor ativo** ⇒ `422 LAST_DIRECTOR`. Vale em `PATCH` (mudança de
  papel) e em `/deactivate`.
- "Ver painel como…" no real = recurso de suporte do Diretor (visualizar como outro papel),
  derivado da sessão; não muda dados.

---

## 11. Registro de atividades — `replaces`: `renderActivity`, `logAct`

**`GET /api/activity?actor=&q=&page=`** · RBAC: **director**. Somente leitura. Itens:
`{ id, actorType, actorName, action, targetType, targetId, detail, createdAt }`.
- **LGPD (DASHBOARD_PLAN §11):** ao apagar dados de um aluno, as entradas **permanecem com o
  alvo anonimizado** ("aluno #123 [removido]") — cumpre apagamento e preserva a trilha.

---

## 12. Notificações — `replaces`: `renderNotifs`, `notifClick`, `markAllRead`

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/notifications` | sessão | lista do usuário (filtrada pelo papel) |
| `POST /api/notifications/:id/read` | sessão | marcar 1 como lida |
| `POST /api/notifications/read-all` | sessão | marcar todas |

- **Filtradas pelo papel** (DASHBOARD_PLAN §4): Supervisor **não** recebe eventos de
  contrato. Tipos: `enroll`|`signed`|`viewed`|`stale`|`email`.

---

## 13. Editor de site — `replaces`: tela `editor`

| Rota | RBAC | Descrição |
|---|---|---|
| `GET /api/site-content` | **director** | todos os textos por página/campo |
| `PATCH /api/site-content` | director | salvar textos (com pendências) |

- `site_content` (page_key, field_key, value). Tetos por campo (VALIDACOES §17: título 120,
  subtítulo 200, parágrafo 600); **escape ao renderizar** no site (anti-XSS). **→ log**.
- Publicação bloqueia/avisa quando há pendências.

---

## 14. Cron / jobs internos (sem rota pública)

- **Contrato parado:** diariamente marca `sent`/`viewed` há ≥7 dias → **→ notif** `stale`
  + comunicado automático de lembrete (DASHBOARD_PLAN §7.4).
- **Backup lógico:** `pg_dump` agendado p/ object storage (DASHBOARD_PLAN §13).

---

## 15. Erros — catálogo de `error.code`

`BAD_CREDENTIALS` · `RATE_LIMITED` · `FORBIDDEN` · `NOT_FOUND` · `VALIDATION` (com
`fields`) · `EMAIL_TAKEN` · `SLOT_TAKEN` · `ROOM_NAME_TAKEN` · `ROOM_HAS_CLASSES` ·
`CLASS_NOT_EMPTY` · `ROOM_OVERFLOW` · `LEVEL_CHANGE_REQUIRES_CONFIRM` · `OUTSIDE_GO` ·
`LAST_DIRECTOR` · `STALE_WRITE` (edição concorrente) · `UNMAPPED_FIELDS` · `INTERNAL`.

---

## 16. Mapa função do preview → rota (o que cada mock vira)

| `dashboard.html` (linha aprox.) | Vira | § |
|---|---|---|
| `doLogin` (1640) | `POST /api/auth/login` | 1 |
| `logout` (1648) | `POST /api/auth/logout` | 1 |
| `sendForgot` (1651) | `POST /api/auth/forgot` | 1 |
| `savePass` (4659) | `POST /api/account/password` | 1 |
| `saveAccount` (5287) | `PATCH /api/account` | 1 |
| `refreshOverviewData`/`renderHealth`/`renderVagas`/`renderNiveis`/`renderMovimento` | `GET /api/overview` | 2 |
| `renderTable`/`filteredStudents` | `GET /api/students` | 3 |
| `openDetail` | `GET /api/students/:id` | 3 |
| `submitNewEnrollment` (3988) | `POST /api/enrollments` (manual) | 4.2 |
| `saveEditEnrollment` (4144) | `PATCH /api/enrollments/:id` | 4.3 |
| `confirmExit` (5506) | `POST /api/students/:id/deactivate` | 4.4 |
| `reactivateStudent` (5516) | `POST /api/students/:id/reactivate` | 4.5 |
| `dropMoveKid` (2591)/`openMoverKid`/`agDropEmpty` (2569) | `PATCH /api/students/:sid/kids/:ki/class` | 4.6 |
| `importPicked` (4779)/`importDropped` (4783) | `POST /api/enrollments/import[/commit]` | 4.7 |
| `exportCSV` (4668) | `GET /api/enrollments/export` | 4.8 |
| `agSaveTurma` (3008) | `POST /api/classes` | 5 |
| `agUpdateTurma` (3062) | `PATCH /api/classes/:id` | 5 |
| `agDelTurma` | `DELETE /api/classes/:id` | 5 |
| CRUD de salas | `POST/PATCH /api/rooms`, `/deactivate` | 5 |
| `openContractModal` (4613) (enviar) | `POST /api/contracts/:id/send` | 6 |
| `autentiqueTimeline` (4583) | `GET /api/contracts/:id` | 6 |
| `markSigned` (5442)/`markSent` (5449) | **webhook** `POST /api/webhooks/autentique` | 9 |
| download contrato | `GET /api/contracts/:id/pdf` | 6 |
| `tplImportValidate` (5050)/`setActiveTpl` (5068)/`saveTplRename` (5108)/`deleteTpl` (5118) | `/api/templates*` | 7 |
| `sendComm` (4511) | `POST /api/announcements` | 8 |
| `submitInvite` (4289) | `POST /api/users` | 10 |
| `saveUser` (4343) | `PATCH /api/users/:id` | 10 |
| `renderActivity` (2394)/`logAct` | `GET /api/activity` (+ escrita interna) | 11 |
| `renderNotifs`/`notifClick`/`markAllRead` | `/api/notifications*` | 12 |
| tela `editor` | `/api/site-content` | 13 |
| `submitEnrollment` (site atual, `enrollmentService.ts`) | `POST /api/enrollments` (form, **cutover**) | 4.1 |
