# Integração Autentique — guia completo (assinatura digital)

Documento criado em **09/Jun/2026**, conferido contra a **documentação oficial**
(`docs.autentique.com.br/api`, API **v2 GraphQL**). É a fonte de verdade pra implementar
o fluxo de contratos da dashboard sem errar. Complementa: `DASHBOARD_API.md` §6 (rotas) e §9
(webhook), `DASHBOARD_PLAN.md` §7 (fluxo), `DASHBOARD_SCHEMA.sql` (tabelas `contracts` /
`contract_events`).

> **Regra de ouro:** o **webhook é a fonte de verdade** do status do contrato. O nosso
> envio só dispara o documento; quem diz "visualizado/assinado/recusado" é o Autentique,
> de forma **assíncrona, fora de ordem e possivelmente duplicada**. Toda a lógica tem que
> ser **idempotente**.

---

## 0. Fundamentos (conferidos na doc)

| Item | Valor oficial |
|---|---|
| Endpoint | `POST https://api.autentique.com.br/v2/graphql` |
| Autenticação | Header `Authorization: Bearer <API_KEY>` |
| Onde gerar a key | painel → `https://painel.autentique.com.br/perfil/api` |
| Protocolo | GraphQL via POST (multipart quando há upload de arquivo) |
| **Rate limit** | **60 requisições/minuto** |
| Tamanho do PDF | **5 MB** (plano grátis) · **20 MB** (profissional) |
| Sandbox | `createDocument(sandbox: true, …)` — **não consome créditos**, doc apagado em poucos dias |

**Env vars** (ver `DASHBOARD_PLAN.md §14`):
```
AUTENTIQUE_TOKEN            # Bearer da API
AUTENTIQUE_WEBHOOK_SECRET   # secret do HMAC-SHA256 do webhook
```

---

## 1. Enviar o contrato — mutation `createDocument`

A mutation recebe `document: DocumentInput!`, `signers: [SignerInput!]!` e `file: Upload!`.
Aceita `sandbox: true` (testes) e os opcionais `organization_id` / `folder_id`.

```graphql
mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
  createDocument(sandbox: $sandbox, document: $document, signers: $signers, file: $file) {
    id
    name
    created_at
    signatures {
      public_id
      name
      email
      action { name }
      link { short_link }     # link de assinatura (útil p/ signer SEM e-mail / cobrança manual)
    }
  }
}
```

### 1.1 `DocumentInput` (campos que usamos)
- `name` *(obrigatório)* — ex. `"Contrato de matrícula — Helena Duarte Lima — 2026.2"`.
- `message` — texto que acompanha o convite de assinatura.
- `refusable: true` — permite **recusar** (gera `signature.rejected`).
- `reminder: "WEEKLY"|"DAILY"` — lembretes automáticos do próprio Autentique.
- `whatsapp_template: "STANDARD"|"FORMAL"|"CASUAL"|"DIRECT"` — template da mensagem de WhatsApp.
- (opcionais avançados existentes: `sortable`, `qualified`, `scrolling_required`,
  `stop_on_rejected`, `deadline_at`, `cc`, `expiration`, `locale`, `show_audit_page`,
  `ignore_cpf`, `ignore_birthdate` — não precisamos no MVP.)

### 1.2 `SignerInput` — quem assina (o responsável financeiro/legal)
- **Por e-mail:** `{ email: "...", action: "SIGN" }` → o Autentique manda o link por e-mail.
- **Por WhatsApp:** `{ email?, name, phone: "+5562...", delivery_method: "DELIVERY_METHOD_WHATSAPP", action: "SIGN" }`.
  (Também existe `DELIVERY_METHOD_SMS`.) **Custo extra de WhatsApp a confirmar — a dona já
  aprovou pagar** (`DASHBOARD_PLAN.md §7`).
- **Sem e-mail (link manual):** `{ name: "...", action: "SIGN" }` → o link volta em
  `signatures[].link.short_link` (a Secretaria copia/manda).
- `action`: `"SIGN"` (nosso caso) · também há `SIGN_AS_A_WITNESS`, `APPROVE`, `RECOGNIZE`.
- `configs: { cpf: "..." }` — exige validação de CPF do assinante.
- `security_verifications: [{ type: "SMS"|"PF_FACIAL"|"BIOMETRIC_AND_TEXT_EXTRACTION"|… }]`
  — camadas extras (biometria facial etc.). MVP: provavelmente nenhuma.
- `positions: [{ x, y, z, element: "SIGNATURE"|"NAME"|"DATE"|"CPF"|"INITIALS" }]` —
  onde carimbar a assinatura no PDF (`z` = página). **Atenção:** isto é o posicionamento da
  **assinatura**, separado do nosso `pdfService` que já carimba os dados do contrato.

### 1.3 Upload do PDF (multipart/form-data — GraphQL multipart spec)
O `file` **não** vai em JSON; a requisição é `multipart/form-data` com 3 partes:
```
operations = { "query": "<mutation>", "variables": { "document": {...}, "signers": [...], "file": null } }
map        = { "file": ["variables.file"] }
file       = <bytes do PDF>
```
Ou seja: `variables.file` fica `null` no `operations` e é "preenchido" pelo `map` apontando
pra parte binária `file`. (É o mesmo PDF que o `pdfService.ts` gera hoje.)

### 1.4 Resposta → o que guardamos
- `createDocument.id` → `contracts.autentique_doc_id`.
- `signatures[].link.short_link` → guardar pra cobrança manual / "cobrar no WhatsApp".
- status local `contracts.status = 'sent'`, `sent_at = now()`, `sent_via = email|whatsapp`.
- **→ `activity_log`** (ator = usuário) e **→ `notifications`**.

---

## 2. Consultar status — query `document` (fallback / reconciliação)

O caminho normal é o webhook empurrar os status. Mas pra **reconciliar** (ex. webhook
perdido, ou tela de detalhe), dá pra puxar sob demanda:

```graphql
query GetDocument($id: UUID!) {
  document(id: $id) {
    id
    name
    signatures {
      public_id
      email
      name
      action { name }
      link { short_link }
      viewed   { created_at }   # null = ainda não viu
      signed   { created_at }   # null = ainda não assinou
      rejected { created_at }   # preenchido = recusou
    }
  }
}
```
`viewed`/`signed`/`rejected` são objetos com `created_at` (ou `null`). Há também
`email_events` (envio/abertura/entrega/falha) e eventos biométricos quando aplicável.

---

## 3. Webhooks — a parte que NÃO pode errar

### 3.1 Cadastro
**Por conta/organização** (não por documento): no Painel de Desenvolvedor do Autentique,
registra-se a **URL de callback** e **seleciona-se os eventos** que aquele endpoint recebe.
Nossa URL: `POST https://<dominio>/api/webhooks/autentique`.

### 3.2 Segurança — HMAC-SHA256 (OBRIGATÓRIO validar)
- O Autentique assina cada entrega com **HMAC-SHA256 do corpo (payload) usando um secret
  compartilhado** e põe no header **`X-Autentique-Signature`** (case-insensitive:
  `x-autentique-signature`).
- **Não** há IP fixo, nem Bearer no webhook — **a assinatura HMAC é a única garantia**.
- Validar sobre o **corpo CRU (raw body)**, antes de qualquer parse de JSON, e comparar em
  **tempo constante**.

```typescript
import crypto from 'crypto';

function verifyAutentique(rawBody: Buffer, headerSig: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.AUTENTIQUE_WEBHOOK_SECRET!)
    .update(rawBody)               // CORPO CRU — não o objeto já parseado
    .digest('hex');
  // comparação em tempo constante (evita timing attack)
  const a = Buffer.from(expected);
  const b = Buffer.from((headerSig || '').trim());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

> **Vercel (pegadinha):** as Serverless Functions fazem `bodyParser` por padrão — isso
> **destrói o raw body** e quebra o HMAC. Desligar na rota do webhook:
> ```typescript
> export const config = { api: { bodyParser: false } };
> // e ler o stream manualmente pra obter o Buffer cru antes de JSON.parse
> ```
> A rota do webhook também é **isenta de CSRF** (é máquina-a-máquina).

### 3.3 Eventos (nomes EXATOS da doc)
**Document:** `document.created` · `document.updated` · `document.deleted` · `document.finished`
**Signature:** `signature.created` · `signature.updated` · `signature.deleted` ·
`signature.viewed` · `signature.accepted` · `signature.rejected` ·
`signature.biometric_approved` · `signature.biometric_unapproved` ·
`signature.biometric_reset` · `signature.biometric_rejected` · `signature.delivery_failed`
**Member:** `member.created` · `member.deleted`

**Os que nos interessam (assinamos só estes no painel):**

| Evento Autentique | `contracts.status` | Efeito |
|---|---|---|
| `signature.viewed` | `viewed` (roxo) | a família abriu o link |
| `signature.accepted` | (parcial) | um signatário assinou |
| `document.finished` | `signed` | **documento concluído** → fonte de verdade do "assinado" |
| `signature.rejected` | `rejected` | recusou → balde "precisa de ação", alerta + notif |
| `signature.delivery_failed` | `failed` | e-mail/WhatsApp não entregou → alerta + notif |

> Como temos **1 assinante** (o responsável), `signature.accepted` ≈ `document.finished`.
> Marcamos `signed` no **`document.finished`** (mais seguro: o doc inteiro fechou).

### 3.4 Payload (estrutura real)
Envelope: `{ id, object:"webhook", name, format:"json", url, event }`. O que importa:
```json
{
  "event": {
    "id": "event_uuid",                         // ← CHAVE DE DEDUP
    "object": "event",
    "organization": 1,
    "type": "signature.accepted",               // ← qual evento
    "data": { /* document OU signature */ },
    "previous_attributes": { /* só em *.updated */ },
    "created_at": "2026-06-09T18:03:27.387179Z"
  }
}
```
Em eventos de **assinatura**, `event.data` é o objeto `signature`:
```json
{
  "public_id": "uuid",
  "document": "document_id",                     // ← liga ao nosso contracts.autentique_doc_id
  "action": "Sign",
  "viewed":   "ISO8601|null",
  "signed":   "ISO8601|null",
  "rejected": "ISO8601|null",
  "user": { "name": "...", "email": "...", "cpf": "...", "birthday": "YYYY-MM-DD" },
  "events": [
    { "type": "viewed|accepted|rejected",
      "ip": "...", "port": 0,
      "geolocation": { "country":"Brazil","state":"...","city":"...","latitude":0,"longitude":0 },
      "created_at": "ISO8601" }
  ],
  "created_at": "ISO8601"
}
```
Em `document.finished`, `event.data` é o objeto `document` (tem `signed_count`,
`signatures_count`, `signatures[]`, `files.signed` = URL do PDF assinado, `sandbox`).

### 3.5 Idempotência, ordem e retentativas (regras da doc)
- **Dedup:** guardar o **`event.id`** já processado e ignorar repetidos (a doc recomenda
  usar o id do objeto em `event.data` + `event.type`). → nosso `contract_events.event_id UNIQUE`.
- **Ordem NÃO garantida:** `document.updated` pode chegar antes de `document.created`. Não
  assumir sequência; cada handler tem que ser tolerante.
- **Retentativas:** 1 entrega + **3 retentativas** (após **60s, 120s, 300s**). Não entregues
  ficam no log por **14 dias**.
- **Responder rápido:** retornar **2xx imediatamente**, processar o trabalho depois
  (idealmente assíncrono). Logar e seguir.
- **Sandbox:** `event.data.sandbox` indica evento de teste — em produção, ignorar/segregar.

### 3.6 Esqueleto do handler (mapeado pro nosso modelo)
```typescript
// api/webhooks/autentique.ts  (DASHBOARD_API §9)
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const raw = await readRawBody(req);                       // Buffer cru
  if (!verifyAutentique(raw, req.headers['x-autentique-signature']))
    return res.status(401).end();                           // assinatura inválida → fora

  const { event } = JSON.parse(raw.toString('utf8'));

  // DEDUP idempotente: contract_events.event_id é UNIQUE → insert "on conflict do nothing"
  const fresh = await tryInsertEvent(event.id, event.type, event.data);
  if (!fresh) return res.status(200).end();                 // já processado → 2xx e sai

  const docId = event.data.document ?? event.data.id;       // signature.* | document.*
  const contract = await findContractByAutentiqueId(docId);
  if (contract) {
    switch (event.type) {
      case 'signature.viewed':           await setStatus(contract, 'viewed');   notify('viewed'); break;
      case 'document.finished':          await setStatus(contract, 'signed');   notify('signed'); break;
      case 'signature.rejected':         await setStatus(contract, 'rejected'); alert('rejected'); break;
      case 'signature.delivery_failed':  await setStatus(contract, 'failed');   alert('failed');   break;
      // signature.accepted: registra, mas o "assinado" oficial é document.finished
    }
    await logActivity('autentique', `contrato ${contract.id}: ${event.type}`);  // ator = Autentique
  }
  return res.status(200).end();                              // sempre 2xx rápido
}
```

---

## 4. Mapa Autentique → nosso banco

| Autentique | Nosso schema (`DASHBOARD_SCHEMA.sql`) |
|---|---|
| `createDocument.id` | `contracts.autentique_doc_id` |
| status inicial pós-envio | `contracts.status='sent'`, `sent_at`, `sent_via` |
| `signature.viewed` | `contracts.status='viewed'` + `viewed_at` |
| `document.finished` | `contracts.status='signed'` + `signed_at`; `files.signed` → `pdf_url` |
| `signature.rejected` | `contracts.status='rejected'` + `rejected_at` |
| `signature.delivery_failed` | `contracts.status='failed'` + `failed_at` |
| cada `event` recebido | linha em `contract_events` (`event_id` UNIQUE = dedup) |
| toda transição | linha em `activity_log` (ator `autentique`) + `notifications` |
| "parado há ≥7 dias" | derivado de `status in (sent,viewed)` + `sent_at`/`viewed_at` (cron, §14) |

---

## 5. Checklist anti-erro (revisar antes do go-live)

- [ ] Token no header `Authorization: Bearer`; **respeitar 60 req/min** (enfileirar envios em massa).
- [ ] Upload do PDF como **multipart** (operations/map/file), não JSON; PDF ≤ 5/20 MB.
- [ ] **Sandbox em TODO teste** (`sandbox: true`) — nunca queimar crédito real testando.
- [ ] Webhook cadastrado **na conta**, com os 5 eventos que usamos selecionados.
- [ ] **HMAC-SHA256 validado** sobre o **raw body**, header `x-autentique-signature`, compare em tempo constante.
- [ ] Vercel: `bodyParser:false` na rota do webhook + rota **isenta de CSRF**.
- [ ] **Dedup por `event.id`** (UNIQUE) — duplicatas acontecem.
- [ ] **Não assumir ordem** dos eventos; handlers idempotentes e tolerantes.
- [ ] Responder **2xx rápido**; processar depois. Não estourar timeout.
- [ ] `document.finished` = "assinado" oficial (não `signature.accepted` sozinho).
- [ ] `rejected`/`failed` saem do caminho feliz → alerta + notificação + badge vermelho.
- [ ] Guardar `files.signed` (PDF assinado) e o `short_link` (cobrança manual).

---

## Fontes (documentação oficial Autentique, conferida 09/Jun/2026)

- [Introdução / API v2](https://docs.autentique.com.br/api)
- [Criando um documento (`createDocument`)](https://docs.autentique.com.br/api/mutations/criando-um-documento)
- [Resgatando documentos (query `document`)](https://docs.autentique.com.br/api/queries/resgatando-documentos)
- [Webhooks](https://docs.autentique.com.br/api/integration-basics/webhooks)
- [Sandbox / testes](https://docs.autentique.com.br/api/integration-basics/sandbox-testes)
