-- =============================================================================
-- English Patio · Dashboard — Schema do banco (PostgreSQL / Neon)
-- =============================================================================
-- Materialização do modelo de dados de docs/DASHBOARD_PLAN.md §5 (já com a
-- auditoria de 09/Jun/2026: period em classes, must_change_password, status da
-- matrícula, financial_responsible_type, requested_*, template_id em contracts,
-- professor só na SALA). É a FONTE DE VERDADE do schema; o Drizzle (ORM escolhido)
-- espelha isto. Validações de aplicação ficam em docs/DASHBOARD_VALIDACOES.md;
-- regras de negócio que não dá pra expressar em CHECK ficam na camada /api/*
-- (docs/DASHBOARD_API.md).
--
-- ATENÇÃO: este arquivo é DOCUMENTAÇÃO/spec. Não roda em produção até a Fase 1.
-- O site de matrícula atual segue intocado até o cutover (DASHBOARD_PLAN §9 Fase 7).
--
-- Convenções:
--   - PKs bigint identity (ids humanos tipo "aluno #123", como o activity_log usa).
--   - timestamps em timestamptz (UTC); a UI formata dd/mm/aaaa.
--   - nomes em inglês no banco; PT na UI (DASHBOARD_PLAN §5).
--   - ON DELETE: dados de aluno NÃO se apagam por cascata sem intenção — o
--     desligamento é soft (is_active=false). Apagamento LGPD é operação explícita
--     que anonimiza o activity_log (DASHBOARD_PLAN §11), não um CASCADE.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role            AS ENUM ('director', 'supervisor', 'secretary');
CREATE TYPE actor_type           AS ENUM ('user', 'system', 'autentique');
CREATE TYPE level_family         AS ENUM ('fun', 'conv', 'power', 'sprint');
CREATE TYPE day_pair             AS ENUM ('seg-qua', 'ter-qui');
CREATE TYPE enrollment_status    AS ENUM ('active', 'cancelled');
CREATE TYPE enrollment_source    AS ENUM ('form', 'import', 'manual');
CREATE TYPE class_format         AS ENUM ('sede', 'domicilio');
CREATE TYPE financial_resp_type  AS ENUM ('legal', 'second', 'other');
CREATE TYPE responsible_type     AS ENUM ('legal', 'second', 'financial');
CREATE TYPE contract_status      AS ENUM ('pending', 'sent', 'viewed', 'signed', 'rejected', 'failed');
CREATE TYPE sent_via             AS ENUM ('email', 'whatsapp');
CREATE TYPE contract_event_type  AS ENUM ('signature.viewed', 'signature.accepted', 'signature.rejected', 'signature.delivery_failed', 'document.finished');
CREATE TYPE announcement_status  AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');
CREATE TYPE announcement_kind    AS ENUM ('manual', 'automatic');
CREATE TYPE channel              AS ENUM ('email', 'whatsapp');
CREATE TYPE recipient_status     AS ENUM ('queued', 'sent', 'failed', 'prepared');
CREATE TYPE notification_type    AS ENUM ('enroll', 'signed', 'viewed', 'stale', 'email');

-- ============================================================================
-- ACESSO & AUDITORIA
-- ============================================================================

CREATE TABLE users (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                 text        NOT NULL,
  email                citext      NOT NULL UNIQUE,         -- e-mail único (VALIDACOES §9)
  password_hash        text        NOT NULL,                -- bcrypt cost >= 12 (PLAN §3)
  role                 user_role   NOT NULL,
  is_active            boolean     NOT NULL DEFAULT true,
  must_change_password boolean     NOT NULL DEFAULT true,   -- 1ª senha temporária (PLAN §6.10)
  password_changed_at  timestamptz,
  last_login_at        timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);
-- Regra "sempre >=1 Diretor ativo" (PLAN §6.10) é validada na camada /api (não dá
-- CHECK confiável entre linhas); ver DASHBOARD_API §10 (422 LAST_DIRECTOR).

CREATE TABLE password_reset_tokens (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     bigint      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text        NOT NULL,                          -- hash do token, nunca o token
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);

CREATE TABLE activity_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_type   actor_type  NOT NULL,                          -- user | system | autentique
  actor_id     bigint      REFERENCES users(id) ON DELETE SET NULL,  -- null p/ system/autentique
  action       text        NOT NULL,
  target_type  text,
  target_id    bigint,
  detail       jsonb,                                          -- alvo anonimizável p/ LGPD (PLAN §11)
  ip           inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_actor   ON activity_log(actor_type, actor_id);

-- ============================================================================
-- ESTRUTURA ESCOLAR (ver AGENDA_PLAN.md)
-- ============================================================================

CREATE TABLE rooms (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          text    NOT NULL,
  color         text    NOT NULL,
  teacher_name  text,                                         -- PROFESSOR É DA SALA: 1 por sala
  is_active     boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX uq_rooms_name ON rooms(lower(name));      -- nome único case-insensitive (VALIDACOES §11)
-- Seed: 13 salas (Green, Vanilla, Peach, Purple, Blue, Orange, Mint, Yellow,
-- Guava, Beige, Rose, Turquoise, Lavender) com a cor do próprio nome.

CREATE TABLE levels (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key         text         NOT NULL UNIQUE,                   -- ex. 'power-2'
  name        text         NOT NULL,                          -- ex. 'Power 2'
  family      level_family NOT NULL,
  sort_order  int          NOT NULL                           -- ordem de evolução
);
-- Seed: 19 níveis (Fun Plus A/B · Conversation 1-3 · Power 1-6 · Sprint 1A..4B).

CREATE TABLE classes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id     bigint      NOT NULL REFERENCES rooms(id),
  day_pair    day_pair    NOT NULL,
  start_time  text        NOT NULL,                            -- 8 slots: 8:30/9:30/10:30/13:30/14:30/15:30/16:45/17:45
  level_id    bigint      NOT NULL REFERENCES levels(id),
  capacity    int         NOT NULL DEFAULT 7 CHECK (capacity BETWEEN 1 AND 9),  -- 7 padrão; vaga extra até 9 (VALIDACOES §13)
  period      text        NOT NULL,                            -- ex. '2026.2' — slot reusado a cada semestre (mesmo nome que enrollments.period)
  is_active   boolean     NOT NULL DEFAULT true,
  CHECK (start_time IN ('8:30','9:30','10:30','13:30','14:30','15:30','16:45','17:45'))
  -- SEM teacher: vem de rooms.teacher_name (1 professor por sala).
);
CREATE UNIQUE INDEX uq_class_slot ON classes(room_id, day_pair, start_time, period);  -- slot único por semestre
CREATE INDEX idx_classes_level  ON classes(level_id);
CREATE INDEX idx_classes_period ON classes(period);

-- ============================================================================
-- MATRÍCULAS, ALUNOS, RESPONSÁVEIS, ENDEREÇO
-- ============================================================================

CREATE TABLE enrollments (
  id                       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status                   enrollment_status NOT NULL DEFAULT 'active',  -- a matrícula em si (≠ contrato, ≠ aluno)
  source                   enrollment_source NOT NULL,
  submission_id            text        NOT NULL UNIQUE,        -- IDEMPOTÊNCIA — mata DEBITOS #1
  class_format             class_format NOT NULL,
  payment_method           text        NOT NULL DEFAULT 'boleto-6x' CHECK (payment_method = 'boleto-6x'),
  financial_responsible_type financial_resp_type NOT NULL,    -- legal|second => sem linha 'financial' duplicada
  requested_day_pair       day_pair,                           -- preferência de horário no form (antes de alocar)
  requested_times          jsonb,                              -- { day1:{start,end}, day2:{start,end} }
  authorization_media      boolean     NOT NULL DEFAULT false,
  authorization_contract   boolean     NOT NULL,               -- aceite obrigatório no envio
  schedule_confirmed       boolean     NOT NULL,
  period                   text        NOT NULL,               -- ex. '2026.2'
  notes                    text,
  submitted_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_enroll_period ON enrollments(period);
CREATE INDEX idx_enroll_status ON enrollments(status);

CREATE TABLE students (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id   bigint      NOT NULL REFERENCES enrollments(id),
  name            text        NOT NULL,
  birth_date      date        NOT NULL,                        -- idade derivada; <= 20 anos (VALIDACOES §1)
  class_id        bigint      REFERENCES classes(id) ON DELETE SET NULL,  -- null = aguardando turma; turma é DO ALUNO
  at_school_since date,                                         -- deriva NOVO/NOVA na agenda
  is_active       boolean     NOT NULL DEFAULT true,            -- desligamento = soft delete
  exit_reason     text,
  exit_note       text,
  exit_date       date
);
CREATE INDEX idx_students_enroll ON students(enrollment_id);
CREATE INDEX idx_students_class  ON students(class_id);
CREATE INDEX idx_students_active ON students(is_active);

CREATE TABLE responsibles (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id bigint           NOT NULL REFERENCES enrollments(id),
  type          responsible_type NOT NULL,                     -- 'financial' só existe quando financial_responsible_type='other'
  name          text             NOT NULL,
  cpf           text,                                          -- 11 dígitos, sem máscara (validado na app)
  phone         text,
  email         text,
  relationship  text,                                          -- Mãe/Pai/Avó/... (select)
  birth_date    date
);
CREATE INDEX idx_resp_enroll ON responsibles(enrollment_id);
CREATE INDEX idx_resp_cpf     ON responsibles(cpf);             -- CPF repetido = família (não é erro)

CREATE TABLE addresses (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id bigint NOT NULL REFERENCES enrollments(id),
  cep           text   NOT NULL,
  street        text   NOT NULL,
  number        text   NOT NULL,                               -- dígitos ou 'S/N'
  complement    text,
  neighborhood  text   NOT NULL,
  city          text   NOT NULL,
  state         text   NOT NULL CHECK (state = 'GO')           -- atende só Goiás (regra de negócio crítica)
);
CREATE INDEX idx_addr_enroll ON addresses(enrollment_id);

-- ============================================================================
-- CONTRATOS & AUTENTIQUE
-- ============================================================================

CREATE TABLE contract_templates (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         text        NOT NULL,
  pdf_url      text        NOT NULL,
  field_map    jsonb       NOT NULL,                           -- coordenadas dos campos (como o pdfService atual)
  version      int         NOT NULL DEFAULT 1,
  is_active    boolean     NOT NULL DEFAULT false,
  archived_at  timestamptz
);

CREATE TABLE contracts (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id   bigint          NOT NULL REFERENCES enrollments(id),
  template_id     bigint          REFERENCES contract_templates(id),  -- qual modelo gerou o PDF
  pdf_url         text,
  status          contract_status NOT NULL DEFAULT 'pending',
  autentique_doc_id text,
  sent_via        sent_via,
  sent_at         timestamptz,
  viewed_at       timestamptz,
  signed_at       timestamptz,
  rejected_at     timestamptz,
  failed_at       timestamptz
  -- "parado" = status sent/viewed há >= 7 dias (derivado em query; alimenta alertas)
);
CREATE INDEX idx_contracts_enroll ON contracts(enrollment_id);
CREATE INDEX idx_contracts_status ON contracts(status);

CREATE TABLE contract_events (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contract_id  bigint              NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_id     text                NOT NULL UNIQUE,            -- DEDUP do webhook (entrega sem ordem + duplicatas)
  type         contract_event_type NOT NULL,
  payload      jsonb,
  received_at  timestamptz         NOT NULL DEFAULT now()
);
CREATE INDEX idx_cevents_contract ON contract_events(contract_id);

-- ============================================================================
-- COMUNICAÇÃO & CONTEÚDO
-- ============================================================================

CREATE TABLE announcements (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject         text                NOT NULL,                -- <= 150 (VALIDACOES §15)
  body            text                NOT NULL,                -- <= 2000; variáveis {{nome_responsavel}}/{{nome_aluno}}
  channels        channel[]           NOT NULL,                -- >= 1
  audience_filter jsonb,
  status          announcement_status NOT NULL DEFAULT 'draft',
  kind            announcement_kind   NOT NULL DEFAULT 'manual',
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  created_by      bigint              REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE announcement_recipients (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  announcement_id bigint           NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  enrollment_id   bigint           REFERENCES enrollments(id) ON DELETE SET NULL,
  channel         channel          NOT NULL,
  status          recipient_status NOT NULL DEFAULT 'queued'   -- WhatsApp = 'prepared' (msg por família)
);
CREATE INDEX idx_recipients_ann ON announcement_recipients(announcement_id);

CREATE TABLE notifications (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     bigint            NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- fan-out por usuário; filtrada por papel
  type        notification_type NOT NULL,
  student_id  bigint            REFERENCES students(id) ON DELETE SET NULL,
  title       text              NOT NULL,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz       NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user_unread ON notifications(user_id) WHERE read_at IS NULL;

CREATE TABLE site_content (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page_key    text        NOT NULL,
  field_key   text        NOT NULL,
  value       text        NOT NULL,                             -- escapar ao renderizar (anti-XSS); tetos VALIDACOES §17
  updated_by  bigint      REFERENCES users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_key, field_key)
);

-- =============================================================================
-- Notas de implementação:
--   - citext exige `CREATE EXTENSION IF NOT EXISTS citext;` (rodar antes do schema).
--   - Drizzle: este SQL é o espelho; gerar migrations a partir dele.
--   - Banco de TESTE = branch separado do Neon; o harness (PLAN §8.1) recusa rodar
--     fora do branch de teste (guarda anti-banco-produção — dados de menores/LGPD).
-- =============================================================================
