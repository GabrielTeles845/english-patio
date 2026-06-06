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

- **Front-end:** Tailwind + **shadcn/ui** + **Lucide** + **Recharts** + **Framer
  Motion**. Recriar em componentes React os padrões já calibrados no preview
  (cselect, checkbox, tooltip global, datepicker, toasts, modais, tabela→cards mobile).
- **ORM:** Drizzle (TS-first, leve no Vercel).
- **Storage dos contratos:** flexível — pode continuar no Google Drive por ora; o banco
  guarda só a URL do PDF, trocar storage depois é simples.
- **E-mail:** Resend (transacional + comunicados).
- **Assinatura digital:** **Autentique** (API GraphQL + webhooks). O preview já simula o
  fluxo completo — ver §7.
- **Exportação de imagens da Agenda:** mesma técnica validada no preview
  (nó DOM dedicado + `html-to-image`), empacotada como util.

## 3. Autenticação & Segurança (dados de MENORES → rigor extra, LGPD)

- **Login:** e-mail + senha. Hash **bcrypt** (cost ≥ 12). Senha forte (mín. 10, regras).
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

Derivado do mock do preview (nomes em inglês no banco; PT na UI).

### Acesso & auditoria
- **users** (id, name, email, password_hash, role[`director`|`supervisor`|`secretary`],
  is_active, invite_pending, last_login_at, created_at)
- **password_reset_tokens** (id, user_id, token_hash, expires_at, used_at)
- **activity_log** (id, actor_type[`user`|`system`|`autentique`], actor_id nullable,
  action, target_type, target_id, detail jsonb, ip, user_agent, created_at)

### Estrutura escolar (ver AGENDA_PLAN.md §3)
- **rooms** (id, name, color, teacher_name nullable, is_active) — 13 salas seed
- **levels** (id, key, name, family[`fun`|`conv`|`power`|`sprint`], sort_order) —
  19 níveis seed, ordem de evolução
- **classes** (id, room_id, day_pair[`seg-qua`|`ter-qui`], start_time, level_id,
  capacity default 7 check ≤7, teacher_name nullable) —
  `unique(room_id, day_pair, start_time)`; aula de 1h; horários válidos:
  8:30/9:30/10:30/13:30/14:30/15:30/16:45/17:45

### Matrículas & alunos
- **enrollments** (id, status, source[`form`|`import`|`manual`], submission_id `unique`
  (**idempotência** — mata as duplicatas, ver `docs/DEBITOS_TECNICOS.md`), class_format,
  payment_method fixo `boleto-6x`, authorization_media, authorization_contract,
  schedule_confirmed, submitted_at, period (ex. `2026.2`), notes)
- **students** (id, enrollment_id, name, birth_date, **class_id nullable** (turma é do
  ALUNO, não da matrícula — irmãos em turmas diferentes), **at_school_since** (deriva
  NOVO/NOVA na agenda), is_active, exit_reason, exit_note, exit_date)
- **responsibles** (id, enrollment_id, type[`legal`|`second`|`financial`], name, cpf,
  phone, email, relationship, birth_date)
- **addresses** (id, enrollment_id, cep, street, number, complement, neighborhood,
  city, state)

### Contratos & Autentique
- **contracts** (id, enrollment_id, pdf_url, status
  [`pending`|`sent`|`viewed`|`signed`], autentique_doc_id, sent_at, viewed_at,
  signed_at, sent_via[`email`|`whatsapp`]) — "parado" = `sent`/`viewed` há ≥7 dias
  (derivado, alimenta alertas)
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
5. **Contratos** — grid/lista, status Autentique de 4 etapas, timeline por contrato,
   badge "parado há N dias", cobrar por WhatsApp, baixar PDF
6. **Modelos** — versões do PDF de contrato, importação + mapeamento de campos
7. **Comunicados** — escrever 1x, entregar por e-mail e/ou WhatsApp (preparado por
   família), variáveis ({{nome_responsavel}}…), filtro de público, histórico,
   automáticos (confirmação de matrícula, eventos Autentique, contrato parado)
8. **Notificações** — central de eventos com não-lidos, filtros, atalho pro aluno
9. **Editor de site** — todos os textos de todas as páginas (inclui matrícula), hover
   pontilhado + painel lateral, preview desktop/mobile, publicação com pendências
10. **Usuários & permissões** — 3 papéis (§4), convite por e-mail, edição de papel
    (último Diretor não pode ser rebaixado), "Ver painel como…" vira recurso real de
    suporte (Diretor visualiza como outro papel)
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
   `document.finished` → `signed` · `signature.rejected` / `delivery_failed` → alerta.
   HMAC + dedup por event id + idempotência (§3).
3. Cada transição: atualiza timeline do contrato, loga em `activity_log`
   (ator `Autentique`), gera notificação e alimenta o funil da Visão geral.
4. Contrato `sent`/`viewed` há ≥7 dias → badge "parado", notificação `stale`,
   comunicado automático de lembrete.
5. **Sandbox** do Autentique para todos os testes (não consome créditos).

## 8. Testes

- **Unit (Vitest):** validators, regras de turma (cap ≤7, slot único, destinos
  válidos), derivações (NOVO, "parado", período), RBAC helpers.
- **API:** testes das rotas serverless com banco de teste (Neon branch) — auth, RBAC
  por papel, webhook Autentique (HMAC inválido, evento duplicado).
- **E2E (Playwright):** login, gating por papel (Diretor/Supervisor/Secretaria),
  fluxos completos (matrícula manual → alocar na agenda → enviar contrato → webhook
  simulado → assinado), exportação de imagem. Herda o espírito dos scripts do preview
  (`scripts/dashboard-smoke.mjs`, 191+ asserções; `dashboard-prints.mjs`, 47 prints).
- **Smoke do preview** continua rodando enquanto o preview for vitrine de decisões.

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
