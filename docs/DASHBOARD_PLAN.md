# Plano da Dashboard Administrativa — English Patio

Documento vivo. Decisões tomadas na 1ª conversa de planejamento (Jun/2026). Os requisitos
estão em evolução — este plano será refinado.

## 1. Princípios

1. **Não tirar o site do ar.** O fluxo de matrícula atual (form → PDF → Apps Script → planilha
   Google + Drive + e-mail) continua **intocado** durante toda a construção.
2. **Build paralelo + cutover planejado.** A dashboard e seu banco são construídos e testados
   de forma **isolada**. Quando tudo estiver validado, fazemos a **virada (cutover)**: o fluxo
   de matrícula passa a gravar no banco novo, e a planilha/Drive/`.gs` são aposentados. Nesse
   momento (e só nele) pode haver uma pausa curta e planejada. Importamos todo o histórico da
   planilha + os PDFs.
3. **Stack alinhada ao que já existe.** React 18 + TypeScript + Vite + Tailwind, deploy Vercel.
   Banco no **Neon (Postgres)**.

## 2. Arquitetura proposta

A app de hoje é uma **SPA Vite sem backend próprio**. A dashboard precisa de servidor (login,
banco, e-mail). Proposta — tudo no mesmo projeto Vercel:

```
Navegador (React SPA)
  ├── Site público + Matrículas      → continua igual (até o cutover)
  └── /dashboard/* (rotas protegidas) → React, mesma base de componentes
        │
        ▼ fetch /api/*
  Vercel Serverless Functions (camada de backend)
        ├── Auth (JWT em cookie httpOnly), RBAC server-side
        ├── CRUD de matrículas/alunos/contratos
        ├── E-mails (Resend)
        └── Conteúdo do site (editor de textos)
        │
        ▼
  Neon (Postgres)  +  Object Storage p/ PDFs (Vercel Blob ou R2/S3)
```

- **Design / front-end da dashboard:** Tailwind (já no projeto) + **shadcn/ui** (componentes
  Radix, look próprio, não "template de IA") + **Lucide** (ícones) + **Recharts** (gráficos
  personalizados) + **Framer Motion** (animações). Mesmo espírito do projeto casamento.
- **ORM:** Drizzle (TS-first, leve) ou Prisma. Sugestão: Drizzle pela simplicidade no Vercel.
- **Storage dos contratos:** **decisão flexível** — pode continuar no **Google Drive** por ora
  (já funciona) e reavaliar depois (Vercel Blob / R2 / S3). Não é bloqueador; o banco guarda só
  a URL do PDF, então trocar o storage no futuro é simples.
- **E-mail:** Resend (mesmo provider do projeto casamento) — transacional + campanhas.
- **Localização:** a dashboard vive em **`/dashboard/*` no mesmo domínio** (decidido), na mesma
  app React/Vite, reaproveitando componentes. Rotas protegidas por auth + RBAC.

## 3. Autenticação & Segurança (dados de MENORES → rigor extra, LGPD)

- **Login:** e-mail + senha. Hash **bcrypt** (cost ≥ 12). Senha forte (mín. 10, regras).
- **Sessão:** JWT curto em cookie **httpOnly + secure + SameSite**, com refresh. CSRF token
  nas mutações.
- **Esqueci a senha:** token de uso único com expiração curta, enviado por e-mail (Resend),
  hash do token no banco.
- **Rate limiting** no login (por IP e por e-mail) + log de tentativas falhas.
- **RBAC sempre no servidor** — o front nunca é fonte de verdade de permissão.
- **Auditoria:** registrar acessos e ações sensíveis (quem visualizou/exportou dados de aluno).
- **LGPD:**
  - Base legal: consentimento do responsável (já coletado nas autorizações da matrícula).
  - Minimização: cada papel vê só o necessário.
  - **CPF mascarado** na listagem; revelado no detalhe **com log de acesso**.
  - Direitos do titular: exportar e excluir dados; política de retenção/expurgo.
  - Tudo sob HTTPS (Vercel), segredos em env vars.
- **Fase futura:** 2FA para admin.

## 4. Papéis de acesso

| Papel | Pode | Não pode |
|---|---|---|
| **Administrador** | Tudo: alunos, matrículas, contratos, e-mails, usuários, editor de site, config | — |
| **Secretaria** | Ver alunos/matrículas e **enviar contratos** (WhatsApp/download) | E-mails, editor do site, usuários, configurações |

(Professores com acesso de leitura ficam como possibilidade futura — hoje fora de escopo.)

## 5. Modelo de dados (Neon / Postgres) — rascunho

- **users** (id, name, email, password_hash, role[`admin`|`content_manager`], is_active,
  last_login_at, created_at)
- **password_reset_tokens** (id, user_id, token_hash, expires_at, used_at)
- **audit_log** (id, user_id, action, target_type, target_id, ip, user_agent, created_at)
- **enrollments** (id, status, source[`form`|`import`], submission_id `unique` (idempotência),
  class_format, schedule, schedule_times, payment_method, authorization_media,
  authorization_contract, schedule_confirmed, contract_pdf_url, contract_status
  [`pending`|`sent`|`signed`], submitted_at, notes)
- **students** (id, enrollment_id, name, birth_date, age, position[1|2])
- **responsibles** (id, enrollment_id, type[`legal`|`second`|`financial`], name, cpf, phone,
  email, relationship, birth_date)
- **addresses** (id, enrollment_id, cep, street, number, complement, neighborhood, city, state)
- **site_content** (id, page_key, field_key, value, updated_by, updated_at) — para o editor
- **email_campaigns** (id, subject, body_html, audience_filter, status, scheduled_at, sent_at,
  created_by)
- **email_recipients** (id, campaign_id, email, status[`queued`|`sent`|`failed`])

A **idempotência** (`submission_id`) já resolve o débito técnico de matrículas duplicadas
(ver `docs/DEBITOS_TECNICOS.md`) no momento do cutover.

## 6. Módulos / Telas

1. **Login** + Esqueci a senha
2. **Onboarding** (primeiro acesso: tour rápido)
3. **Visão geral** — KPIs (matrículas totais, novos da semana, alunos ativos, contratos
   pendentes), gráficos personalizados (matrículas/mês, distribuição por horário, faixa
   etária), filtros de período, últimas matrículas
4. **Alunos** — lista (tabela com design próprio, busca + filtros) e **detalhe** completo
5. **Contratos** — listar/visualizar/baixar (assinatura digital = fase futura)
6. **Comunicados** — aviso escrito 1x e entregue por **e-mail e/ou WhatsApp** (mensagens
   preparadas por família; API oficial do WhatsApp em fase futura) + transacionais (reset senha)
7. **Editor de site** — edição de **todos os textos** de todas as páginas (inclui telas de
   matrícula), com **hover de borda pontilhada** + painel lateral, como no projeto casamento
8. **Usuários & permissões** — gerenciar admins/gestores
9. **Configurações** — tema (claro/escuro, claro por padrão), conta, segurança

Tema claro **por padrão**, com modo escuro. Cores da marca (azul + amarelo). Responsivo.

## 7. Fases de implementação

- **Fase 0 — Preview (FEITO):** mockup HTML para aprovação da dona da escola.
- **Fase 1 — Fundação:** Neon + schema + auth (login, esqueci senha, RBAC) + shell da dashboard
  (sidebar, tema claro/escuro) + deploy protegido. Sem dados reais.
- **Fase 2 — Alunos/Matrículas no banco (paralelo):** rota nova de gravação no Neon + storage
  de PDF, testada **isolada**; lista + detalhe lendo do Neon (dados de teste).
- **Fase 3 — Visão geral:** KPIs + gráficos + filtros.
- **Fase 4 — E-mails (Resend):** transacional (reset) + campanhas com filtro de público.
- **Fase 5 — Editor de site:** `site_content` + wrapper editável (hover pontilhado + painel);
  migrar textos das páginas para chaves editáveis.
- **Fase 6 — Cutover & importação:** script de import da planilha (CSV) + PDFs do Drive;
  matrícula passa a gravar no Neon (com `submission_id` idempotente → mata as duplicatas);
  aposentar Apps Script/planilha. **Janela de manutenção curta e planejada.**
- **Fase 7 — Futuro:** assinatura digital integrada; upload de contratos/templates novos (PDF);
  2FA; professores (leitura); edição de imagens/elementos no editor.

## 8. Sugestões de qualidade de vida (a discutir)

- Status de matrícula com **kanban/fluxo** (nova → contrato enviado → assinado → ativa).
- **Exportar** lista filtrada para CSV/PDF.
- Busca global (atalho de teclado).
- Aniversariantes do mês (alunos) — gancho de relacionamento.
- Alertas: contratos pendentes há X dias; matrículas sem horário confirmado.
- Detecção de **irmãos/duplicados** por CPF do responsável.
- Histórico/timeline por aluno (quando matriculou, mudanças, contratos).
