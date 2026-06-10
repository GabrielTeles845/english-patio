# Catálogo de Testes — Dashboard English Patio

Documento vivo, criado em **10/Jun/2026**. É a **enumeração exaustiva** dos casos de teste
da dashboard — a materialização do princípio do `DASHBOARD_PLAN.md §8.2` ("cobertura = a
matriz inteira"). Enquanto o §8.1/§8.2 descrevem **como** testar (harness `reg-NN`,
`reg-lib`, paridade visual, banco de teste), **este doc lista o quê**: cada caso, com id,
tipo e resultado esperado.

**Fontes que este catálogo cruza:**
- Rotas, RBAC e códigos de erro: `docs/DASHBOARD_API.md`.
- Validações por campo (positivos e negativos): `docs/DASHBOARD_VALIDACOES.md`.
- Segurança de sessão, LGPD, papéis: `docs/DASHBOARD_PLAN.md §§3, 4`.
- Webhook Autentique: `docs/AUTENTIQUE_INTEGRACAO.md §3`, `DASHBOARD_API.md §9`.

**Regra de ouro (PLAN §8.2):** nenhum buraco. Toda linha de VALIDACOES vira ≥1 teste
negativo; toda rota da API vira teste de RBAC (200 pro papel certo, 403 pros outros) +
caminho de erro; webhook e concorrência são exercidos. Um caso **só conta como coberto
quando roda e é visto** (modo `--headed`, §8.2) — não basta passar no CI.

**Tipos de caso:** `happy` (caminho feliz) · `neg` (negativo, deve bloquear) ·
`rbac` (permissão por papel) · `sec` (segurança/sessão) · `idem` (idempotência) ·
`conc` (concorrência) · `lgpd` (privacidade) · `vis` (paridade visual) · `zero` (estado-zero).

**Convenção de id:** `reg-NN.tNN`. Cada `reg-NN` é um script por módulo (§8.1).

---

## reg-00 · Transversais (valem para TODA rota `/api/*`)

Estes rodam uma vez contra um conjunto representativo de rotas (1 GET, 1 mutação por papel),
não repetir em cada módulo.

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-00.t01 | mutação sem header `x-csrf-token` | sec | `403 CSRF_INVALID` |
| reg-00.t02 | mutação com `x-csrf-token` inválido | sec | `403 CSRF_INVALID` |
| reg-00.t03 | `GET` sem CSRF | sec | `200` (GET é livre de CSRF) |
| reg-00.t04 | request sem cookie de sessão em rota autenticada | sec | `401` |
| reg-00.t05 | renovação deslizante: cada request autenticado re-emite o cookie | sec | novo `set-cookie` a cada chamada |
| reg-00.t06 | vida máxima absoluta (~12h) estourada, mesmo com renovação | sec | `401` (re-login exigido) |
| reg-00.t07 | usuário desativado (`is_active=false`) → 1ª request seguinte | sec | `401` (revogação na prática) |
| reg-00.t08 | JWT emitido **antes** de `password_changed_at` | sec | `401` (trocar senha derruba dispositivos) |
| reg-00.t09 | corpo malformado / Zod falha | neg | `400 VALIDATION` com `error.fields` preenchido |
| reg-00.t10 | erro interno não tratado | neg | `500 INTERNAL`, sem vazar stack pro cliente |
| reg-00.t11 | envelope de sucesso | happy | `{ ok:true, data }` |
| reg-00.t12 | envelope de erro | neg | `{ ok:false, error:{ code, message, fields? } }` |
| reg-00.t13 | datas trafegam ISO 8601 (não `dd/mm/aaaa`) | happy | API devolve `YYYY-MM-DD`/`…Z` |
| reg-00.t14 | paginação: shape de lista | happy | `{ items, page, pageSize, total }` |

---

## reg-01 · Login & conta (API §1 · VALIDACOES §7, §8)

### Login
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-01.t01 | login válido | happy | `200`, set-cookie JWT, `{ user, mustChangePassword }` |
| reg-01.t02 | e-mail formato inválido | neg | `400` (campo email) |
| reg-01.t03 | senha vazia | neg | `400` (campo senha) |
| reg-01.t04 | credenciais erradas | neg | `401 BAD_CREDENTIALS`, mensagem genérica (não revela se e-mail existe) |
| reg-01.t05 | e-mail inexistente | neg | `401 BAD_CREDENTIALS` (mesma msg do t04 — sem vazamento) |
| reg-01.t06 | rate-limit por IP (N tentativas em janela curta) | sec | `429 RATE_LIMITED` |
| reg-01.t07 | rate-limit por e-mail | sec | `429 RATE_LIMITED` |
| reg-01.t08 | tentativa falha é registrada | sec | linha em `login_attempts(success=false)` |
| reg-01.t09 | login com `must_change_password=true` | sec | front força troca antes de liberar a dashboard |
| reg-01.t10 | hash bcrypt cost ≥ 12 | sec | senha nunca comparada em texto plano |
| reg-01.t11 | `→ log` do login | happy | `activity_log(action=login)` |

### Esqueci a senha / reset
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-01.t12 | forgot com e-mail existente | happy | `200`, token hash gravado, Resend disparado, `→ log` |
| reg-01.t13 | forgot com e-mail inexistente | sec | `200` idêntico (não revela existência) |
| reg-01.t14 | token nunca é gravado em claro | sec | só `token_hash` no banco |
| reg-01.t15 | reset com token válido | happy | senha trocada, `used_at` setado |
| reg-01.t16 | reset com token já usado | neg | rejeitado |
| reg-01.t17 | reset com token expirado | neg | rejeitado |
| reg-01.t18 | reset com senha < 10 chars | neg | rejeitado (política §8) |
| reg-01.t19 | reset sem maiúscula | neg | rejeitado |
| reg-01.t20 | reset sem minúscula | neg | rejeitado |
| reg-01.t21 | reset sem número | neg | rejeitado |
| reg-01.t22 | reset sem caractere especial | neg | rejeitado |

### Trocar senha / editar conta
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-01.t23 | troca com senha atual correta | happy | trocada, `password_changed_at` atualizado, JWTs antigos caem |
| reg-01.t24 | troca com senha atual errada | neg | "Senha atual incorreta" |
| reg-01.t25 | troca no 1º login (mustChange) dispensa a atual | happy | trocada, `must_change_password` limpo |
| reg-01.t26 | confirmar senha ≠ nova | neg | "As senhas não conferem" |
| reg-01.t27 | nova senha viola política (5 facetas do t18–t22) | neg | rejeitado por faceta |
| reg-01.t28 | `PATCH /account` e-mail já usado por outro | neg | `409 EMAIL_TAKEN` |
| reg-01.t29 | `PATCH /account` e-mail válido | happy | atualizado, `→ log` |
| reg-01.t30 | logout limpa o cookie | happy | request seguinte `401` |

---

## reg-02 · Visão geral (API §2)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-02.t01 | Diretor abre Visão geral | happy/rbac | `200`, payload completo (kpis, funnel, occupancy, levels, movement, birthdays, neighborhoods, recent) |
| reg-02.t02 | Supervisor | rbac | `403 FORBIDDEN` |
| reg-02.t03 | Secretaria | rbac | `403 FORBIDDEN` |
| reg-02.t04 | base vazia | zero | KPIs zerados + flag "Sem dados ainda" |
| reg-02.t05 | `period=6m\|12m\|month` | happy | série respeita a janela |
| reg-02.t06 | `cohort=all\|studying\|2026.2` | happy | filtro aplicado no servidor |
| reg-02.t07 | agregação deriva no servidor | sec | client nunca envia totais (não confiar no front) |

---

## reg-03 · Alunos — lista & detalhe (API §3 · VALIDACOES §1–6)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-03.t01 | Diretor lista | happy/rbac | `200` paginado |
| reg-03.t02 | Secretaria lista | rbac | `200` (CRUD) |
| reg-03.t03 | Supervisor lista | rbac | `200` (**somente leitura**) |
| reg-03.t04 | CPF mascarado na lista | lgpd | CPF aparece mascarado |
| reg-03.t05 | detalhe revela CPF | lgpd | `→ log view_student_pii` |
| reg-03.t06–t18 | cada filtro: `level`, `room`, `teacher`(+`none`), `time`, `dayPair`, `period`, `contractStatus`, `status`(active/inactive), `neighborhood`, `hasSiblings`, `media`, `dateFrom/dateTo`, `q` | happy | resultado coerente por filtro |
| reg-03.t19 | empty: base vazia | zero | "nenhum dado ainda" |
| reg-03.t20 | empty: filtro sem match | zero | "filtro não achou" (distinto do t19) |
| reg-03.t21 | família com 2 kids em turmas diferentes | happy | 1 linha, ambos os kids visíveis |

---

## reg-04 · Matrícula — criar/editar/desligar/realocar (API §4 · VALIDACOES §1–6, §13, §14)

### 4.1 Ingestão do formulário (cutover) + 4.2 manual
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-04.t01 | form válido | happy | `201 { enrollmentId, students, contractId }`, contrato `pending`, `→ log`(ator Sistema), `→ notif enroll` |
| reg-04.t02 | **reenvio com mesmo `submission_id`** | idem | `200` devolve a matrícula já criada, **não duplica** (DEBITOS #1) |
| reg-04.t03 | `source=form` sem `submissionId` | neg | rejeitado |
| reg-04.t04 | manual: servidor gera `manual-<uuid>` | happy | front não envia o campo |
| reg-04.t05 | rate-limit por IP na rota pública | sec | `429 RATE_LIMITED` |
| reg-04.t06 | `pdfBase64` acima de ~16 MB | neg | `413 PAYLOAD_TOO_LARGE` |
| reg-04.t07 | `state ≠ GO` | neg | `422 OUTSIDE_GO` |
| reg-04.t08 | `financialResponsibleType=other` | happy | cria responsável `financial` |
| reg-04.t09 | `financialResponsibleType=legal\|second` | happy | **não** cria linha `financial` duplicada |
| reg-04.t10 | `payment_method` | happy | fixo `boleto-6x` (CHECK no banco) |
| reg-04.t11 | manual: RBAC Diretor/Secretaria | rbac | `201` |
| reg-04.t12 | manual: Supervisor | rbac | `403` |

### Validações de campo (VALIDACOES §1–6) — todas negativas
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-04.t13 | `student1Name` com 1 parte só | neg | "Digite o nome completo" |
| reg-04.t14 | nome só com conectores (`de/da/do`) | neg | bloqueia (partes significativas) |
| reg-04.t15 | `student1BirthDate` futura | neg | "Data não pode ser no futuro" |
| reg-04.t16 | aluno > 20 anos | neg | "Aluno não pode ter mais de 20 anos" |
| reg-04.t17 | data inexistente (31/02) | neg | "Data inválida" |
| reg-04.t18 | `hasStudent2=true` e aluno 2 em branco | neg | aluno 2 vira obrigatório |
| reg-04.t19 | `responsibleBirthDate` < 18 anos | neg | "Responsável deve ter no mínimo 18 anos" |
| reg-04.t20 | CPF com dígito verificador errado | neg | "CPF inválido" |
| reg-04.t21 | CPF repetido, **mesmo** nome | happy | aceita (= família, não é erro) |
| reg-04.t22 | CPF repetido, **outro** nome | neg(aviso) | aviso `cpfOwner` (não bloqueia) |
| reg-04.t23 | telefone com 3º dígito ≠ 9 | neg | "Telefone deve começar com 9" |
| reg-04.t24 | telefone com ≠ 11 dígitos | neg | inválido |
| reg-04.t25 | e-mail sem `@`/domínio | neg | "E-mail inválido" |
| reg-04.t26 | `relationship` vazio | neg | "Campo obrigatório" (select) |
| reg-04.t27 | CEP ≠ 8 dígitos | neg | "CEP inválido" |
| reg-04.t28 | `number` vazio | neg | "Campo obrigatório" |
| reg-04.t29 | `number` = "S/N" | happy | aceita |
| reg-04.t30 | `number` com texto livre (ex. "casa") | neg | bloqueia (só dígitos ou S/N) |
| reg-04.t31 | `classFormat` ausente | neg | obrigatório (NOT NULL) |
| reg-04.t32 | `schedule` fora de `seg-qua\|ter-qui` | neg | inválido |
| reg-04.t33 | horário fora dos 8 slots reais | neg | inválido |
| reg-04.t34 | `authorizationContract=false` | neg | "É preciso aceitar o contrato" |
| reg-04.t35 | `scheduleConfirmed=false` | neg | "Confirme o horário" |
| reg-04.t36 | `authorizationMedia=false` | happy | aceita (autorização opcional) |
| reg-04.t37 | campo de texto livre com `< > " ' &` | neg | `badChars` bloqueia (XSS) |
| reg-04.t38 | nome acima do teto (80) / bairro (60) / complemento (60) | neg | bloqueia por tamanho |

### 4.3 Editar
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-04.t39 | edição válida | happy | salva, `→ log`(diff) |
| reg-04.t40 | `updatedAt` divergente (edição concorrente) | conc | `409 STALE_WRITE`, UI reabre preservando o digitado |
| reg-04.t41 | RBAC Diretor/Secretaria | rbac | ok |
| reg-04.t42 | RBAC Supervisor | rbac | `403` |

### 4.4 Desligar · 4.5 Reativar
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-04.t43 | desligar com motivo válido | happy | `is_active=false`, grava `exit_*`, **não apaga**, `→ log` |
| reg-04.t44 | desligar sem motivo | neg | botão desabilitado / bloqueia |
| reg-04.t45 | motivo="Outro" sem observação | neg | observação obrigatória |
| reg-04.t46 | observação > 500 chars | neg | bloqueia |
| reg-04.t47 | reativar | happy | limpa `exit_*` |
| reg-04.t48 | reativar com turma lotada no meantime | happy | volta com `class_id=null` (fila), **não estoura** capacity |
| reg-04.t49 | RBAC desligar/reativar (Supervisor) | rbac | `403` |

### 4.6 Mover / alocar kid
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-04.t50 | mover pra turma com vaga | happy | `class_id` muda, `→ log`("origem → destino") |
| reg-04.t51 | mover pra turma cheia sem `extraSeat` | neg | bloqueia (precisa vaga) |
| reg-04.t52 | `extraSeat`: 7→8 | happy | aceita (1ª extra) |
| reg-04.t53 | `extraSeat`: 8→9 | happy | aceita (2ª extra) |
| reg-04.t54 | `extraSeat`: ≥9 | neg | `422 ROOM_OVERFLOW` (máx 2 extras) |
| reg-04.t55 | destino de outro nível sem `allowLevelChange` | neg | `422 LEVEL_CHANGE_REQUIRES_CONFIRM` |
| reg-04.t56 | destino de outro nível com `allowLevelChange=true` | happy | aceita |
| reg-04.t57 | `classId=null` | happy | remove da turma (volta pra fila) |
| reg-04.t58 | RBAC: os 3 papéis (Agenda é CRUD pros 3) | rbac | `200` pros 3 |

### 4.7 Importação · 4.8 Exportar
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-04.t59 | dry-run de CSV válido | happy | `{ toImport, duplicatesRemoved, needsReview }` |
| reg-04.t60 | dry-run de XLSX | happy | convertido p/ CSV no mesmo pipeline |
| reg-04.t61 | arquivo que não é CSV/XLSX | neg | "Somente .csv ou .xlsx" |
| reg-04.t62 | **dedup**: linhas iguais exceto Data/Hora e Link PDF | idem | fica a 1ª (mata DEBITOS #1) |
| reg-04.t63 | linha cujo `submission_id` já está no banco | idem | não reentra |
| reg-04.t64 | linha com CPF/telefone/data/e-mail inválido | neg | vai pra fila de revisão |
| reg-04.t65 | linha com endereço fora de GO | neg | fila de revisão |
| reg-04.t66 | linha sem "na escola desde"/sem horário | happy | entra **sem turma** |
| reg-04.t67 | commit persiste só o aprovado | happy/idem | idempotente, `→ log`(contagem) |
| reg-04.t68 | dataset real (694 → ~565 novas + ~2 revisão) | idem | bate com o conferido (VALIDACOES §16) |
| reg-04.t69 | `purge` apontando p/ banco de produção | sec | **recusa** (guarda anti-banco-produção §8.1) |
| reg-04.t70 | `purge` no banco de teste, Diretor | happy | limpa |
| reg-04.t71 | `purge` por não-Diretor | rbac | `403` |
| reg-04.t72 | export CSV | happy | `→ log export_students` (LGPD: quem exportou) |
| reg-04.t73 | export por Supervisor | rbac | `403` |

---

## reg-05 · Agenda — turmas & salas (API §5 · VALIDACOES §10, §11)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-05.t01 | GET classes/rooms/levels | rbac | `200` pros 3 papéis |
| reg-05.t02 | criar turma válida (cap ≤7) | happy | `201` |
| reg-05.t03 | criar turma cap > 7 | neg | bloqueia (criação ≤7) |
| reg-05.t04 | slot `(sala,par,horário,período)` duplicado | neg | `409 SLOT_TAKEN` |
| reg-05.t05 | mesmo slot em **outro** período | happy | aceita (slot reusado por semestre) |
| reg-05.t06 | `startTime` fora dos 8 slots | neg | inválido |
| reg-05.t07 | tentar setar professor na turma | neg | campo não existe (professor é da sala) |
| reg-05.t08 | editar `capacity` abaixo da ocupação atual | neg | `422 CAPACITY_BELOW_OCCUPANCY` |
| reg-05.t09 | deletar turma com alunos | neg | `422 CLASS_NOT_EMPTY` |
| reg-05.t10 | deletar turma vazia | happy | ok |
| reg-05.t11 | criar sala nome único | happy | `201` |
| reg-05.t12 | criar sala nome duplicado (case-insensitive) | neg | `409 ROOM_NAME_TAKEN` |
| reg-05.t13 | nome de sala > 40 chars | neg | bloqueia |
| reg-05.t14 | `PATCH` sala: trocar professor/cor/nome | happy | ok |
| reg-05.t15 | desativar sala com turmas | neg | `422 ROOM_HAS_CLASSES` |
| reg-05.t16 | desativar sala sem turmas | happy | ok |
| reg-05.t17 | toda mutação | happy | `→ log` |

---

## reg-06 · Contratos & Autentique (API §6, §9 · webhook)

### Rotas
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-06.t01 | lista/detalhe Diretor/Secretaria | rbac | `200` |
| reg-06.t02 | lista/detalhe Supervisor | rbac | `403` |
| reg-06.t03 | enviar contrato | happy | chama Autentique, status→`sent`, guarda `autentique_doc_id`, `→ log`, `→ notif` |
| reg-06.t04 | baixar PDF | lgpd | `→ log` |
| reg-06.t05 | remind (cobrança WhatsApp) | happy | `→ log` |
| reg-06.t06 | "parado" = `sent`/`viewed` há ≥7 dias | happy | aparece no balde de alerta (derivado) |

### Webhook (`POST /api/webhooks/autentique`)
| id | caso | tipo | esperado |
|---|---|---|---|
| reg-06.t07 | HMAC `x-autentique-signature` inválido | sec | `401 INVALID_SIGNATURE`, **não processa** |
| reg-06.t08 | HMAC válido | happy | processa, `200` rápido |
| reg-06.t09 | **`event_id` duplicado** | idem | dedup, processado **uma vez** só |
| reg-06.t10 | entrega fora de ordem | idem | estado final correto (idempotente) |
| reg-06.t11 | `signature.viewed` → `viewed` | happy | transição + `→ log`(Autentique) + `→ notif viewed` |
| reg-06.t12 | `signature.accepted` + `document.finished` → `signed` | happy | transição + `→ notif signed` |
| reg-06.t13 | `signature.rejected` → `rejected` | happy | balde "precisa de ação" + `→ notif rejected` |
| reg-06.t14 | `signature.delivery_failed` → `failed` | happy | balde "precisa de ação" + `→ notif failed` |
| reg-06.t15 | ator do log do webhook | lgpd | `Autentique` (não editável) |
| reg-06.t16 | override manual de status | rbac | só Diretor, auditado |

---

## reg-07 · Modelos de contrato (API §7 · VALIDACOES §12)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-07.t01 | qualquer rota por não-Diretor | rbac | `403` |
| reg-07.t02 | importar PDF ≤ 16 MB | happy | `201` |
| reg-07.t03 | importar arquivo não-PDF | neg | "Envie um PDF" |
| reg-07.t04 | PDF > 16 MB | neg | `413 PAYLOAD_TOO_LARGE` |
| reg-07.t05 | ativar com campos não mapeados | neg | `422 UNMAPPED_FIELDS` |
| reg-07.t06 | ativar com todos os campos mapeados | happy | vira o ativo |
| reg-07.t07 | toda mutação | happy | `→ log` |

---

## reg-08 · Comunicados (API §8 · VALIDACOES §15)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-08.t01 | qualquer rota por não-Diretor | rbac | `403` |
| reg-08.t02 | assunto vazio | neg | obrigatório (spec exige, mesmo o preview sendo leniente) |
| reg-08.t03 | corpo vazio | neg | obrigatório |
| reg-08.t04 | assunto > 150 | neg | bloqueia |
| reg-08.t05 | corpo > 2000 | neg | bloqueia |
| reg-08.t06 | `channels` vazio | neg | ≥1 obrigatório |
| reg-08.t07 | variável `{{` sem `}}` | neg | `400` (variável aberta bloqueia) |
| reg-08.t08 | variáveis `{{nome_responsavel}}`/`{{nome_aluno}}` | happy | renderizam no preview |
| reg-08.t09 | preview não envia | happy | só renderiza, sem criar `announcements` |
| reg-08.t10 | enviar | happy | cria `announcements` + `announcement_recipients`, `→ log` |
| reg-08.t11 | canal WhatsApp | happy | recipientes ficam `prepared` (API oficial é fase futura) |

---

## reg-09 · Usuários & permissões (API §10 · VALIDACOES §9)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-09.t01 | qualquer rota por não-Diretor | rbac | `403` |
| reg-09.t02 | criar usuário com e-mail único | happy | `201`, senha temporária, `→ log`, e-mail de boas-vindas |
| reg-09.t03 | criar com e-mail duplicado | neg | `409 EMAIL_TAKEN` |
| reg-09.t04 | criar com nome incompleto | neg | "Digite o nome completo" |
| reg-09.t05 | criar com senha temporária fraca | neg | política §8 |
| reg-09.t06 | 1º login do novo usuário | sec | forçado a trocar a senha |
| reg-09.t07 | rebaixar o **último Diretor ativo** | neg | `422 LAST_DIRECTOR` |
| reg-09.t08 | excluir/desativar o último Diretor ativo | neg | `422 LAST_DIRECTOR` |
| reg-09.t09 | desativar um Diretor havendo outro ativo | happy | ok |
| reg-09.t10 | editar papel/nome/e-mail | happy | `→ log` |

---

## reg-10 · Registro de atividades (API §11)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-10.t01 | acesso por não-Diretor | rbac | `403` |
| reg-10.t02 | lista (somente leitura) | happy | itens com ator/ação/alvo/data |
| reg-10.t03 | filtros `actor`/`q`/`page` | happy | aplicados no servidor |
| reg-10.t04 | apagamento LGPD de aluno | lgpd | entradas ficam com alvo anonimizado ("aluno #123 [removido]"), trilha preservada |

---

## reg-11 · Notificações (API §12)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-11.t01 | Diretor lista | rbac | `200` (filtrada por papel) |
| reg-11.t02 | Secretaria lista | rbac | `200` |
| reg-11.t03 | **Supervisor em qualquer rota** | rbac | `403 FORBIDDEN` (não tem sino) |
| reg-11.t04 | marcar 1 como lida | happy | `read_at` setado |
| reg-11.t05 | marcar todas | happy | todas lidas |
| reg-11.t06 | tipos | happy | `enroll\|signed\|viewed\|stale\|email\|rejected\|failed` (bate com enum) |

---

## reg-12 · Editor de site (API §13 · VALIDACOES §17)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-12.t01 | acesso por não-Diretor | rbac | `403` |
| reg-12.t02 | salvar texto | happy | grava em `draft_value` (rascunho), `→ log` |
| reg-12.t03 | publicar | happy | move `draft_value`→`value`, grava `published_at`, limpa rascunho |
| reg-12.t04 | "pendência" | happy | linha com `draft_value` não nulo é listada/avisada |
| reg-12.t05 | título > 120 / subtítulo > 200 / parágrafo > 600 | neg | bloqueia por teto |
| reg-12.t06 | texto com HTML/script | sec | escapado ao renderizar no site (anti-XSS) |

---

## reg-13 · Cron / jobs internos (API §14)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-13.t01 | job de "contrato parado" | happy | marca `sent`/`viewed` há ≥7 dias → `→ notif stale` + comunicado automático |
| reg-13.t02 | `stale` NÃO vem do webhook | happy | só do cron (não duplicar com §9) |
| reg-13.t03 | backup lógico (`pg_dump`) agendado | happy | dump no object storage |

---

## reg-14 · Paridade visual & RBAC global (PLAN §8.2)

| id | caso | tipo | esperado |
|---|---|---|---|
| reg-14.t01 | matriz RBAC completa: cada rota × cada papel | rbac | `200` pro papel permitido, `403` pros demais (gerado da matriz API/PLAN §4) |
| reg-14.t02 | paridade `dashboard.html` × React, mesma tela/viewport | vis | diff < limiar; acima falha com diff em `_review/` |
| reg-14.t03 | 12 módulos × claro/escuro × 3 sidebars × desktop/mobile (amostrado) | vis | dentro do limiar |
| reg-14.t04 | baseline pixelmatch vs snapshot commitado | vis | só acusa quando muda; `UPDATE_SNAPSHOTS=1` regrava |
| reg-14.t05 | fluxo-demo headed: login → matrícula manual → alocar → enviar contrato → webhook → assinado | happy | roda visível (`--headed`+`slowMo`), serve de demo |
| reg-14.t06 | tela inicial por papel | rbac | Diretor→Visão geral · Supervisor→Agenda · Secretaria→Alunos |
| reg-14.t07 | acessibilidade básica | happy | teclado, foco visível, ARIA nos controles custom (§99.12) |

---

## Mecânica do harness (PLAN §8.1) — checklist de infraestrutura

- [ ] `reg-lib`: `launch()` (browser + sessão autenticada via login real, cookie httpOnly).
- [ ] `makeReporter()`: `step/shot/dump`, ✅/❌, print automático no erro.
- [ ] `startWatchdog()`: mata o processo após X ms (anti-trava).
- [ ] `compareScreenshot()`: pixelmatch vs baseline commitado; cria na 1ª vez; `UPDATE_SNAPSHOTS=1` regrava.
- [ ] **Guarda anti-banco-produção**: setup só roda se a connection string for `DATABASE_URL_TEST` (nunca produção) — crítico por LGPD (dados de menores).
- [ ] Setup/teardown de 1 passo + fallback stub (backend em memória) pros fluxos de UI sem banco.
- [ ] Alvo `test:e2e:watch` (headed + slowMo) pra revisão humana; CI roda headless.
- [ ] Diffs/prints em `_review/` (gitignored).
- [ ] Deps já instaladas (09/Jun): `playwright`, `pixelmatch`, `pngjs`, `jsdom`.
- [ ] Cada `reg-NN` entregue **junto com a fase do módulo**, não no fim.

---

## Cobertura — como provar que não há buraco

1. **Validações:** toda linha de `DASHBOARD_VALIDACOES.md` (§1–§17) tem ≥1 caso negativo acima. Conferir 1:1 ao fechar cada `reg-NN`.
2. **Rotas:** toda rota de `DASHBOARD_API.md` (§1–§14) tem caso de RBAC (reg-14.t01 cobre a matriz) + caminho de erro do seu `error.code` (§15).
3. **Códigos de erro:** cada `code` do catálogo §15 da API é disparado por ao menos um caso aqui (`BAD_CREDENTIALS`, `RATE_LIMITED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `EMAIL_TAKEN`, `SLOT_TAKEN`, `ROOM_NAME_TAKEN`, `ROOM_HAS_CLASSES`, `CLASS_NOT_EMPTY`, `ROOM_OVERFLOW`, `CAPACITY_BELOW_OCCUPANCY`, `LEVEL_CHANGE_REQUIRES_CONFIRM`, `OUTSIDE_GO`, `PAYLOAD_TOO_LARGE`, `LAST_DIRECTOR`, `STALE_WRITE`, `UNMAPPED_FIELDS`, `CSRF_INVALID`, `INVALID_SIGNATURE`, `INTERNAL`).
4. **Transversais:** segurança de sessão (reg-00, reg-01), idempotência (reg-04.t02/t62/t63, reg-06.t09), concorrência (reg-04.t40), LGPD (reg-03.t04/t05, reg-04.t72, reg-10.t04), estado-zero (reg-02.t04, reg-03.t19/t20).
5. **Visto rodando:** os fluxos do reg-14 rodam `--headed` — cobertura não é só verde no CI (PLAN §8.2).
</content>
</invoke>
