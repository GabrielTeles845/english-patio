# Plano — Rematrícula por link mágico

Decisões tomadas com o Gabriel em Jun/2026. Este plano é para a fase REAL (depois do
preview aprovado), porque a rematrícula mexe também no **site atual** — não só na dashboard.
A tela de campanha já existe desenhada no preview (`public/dashboard.html` → "Rematrículas").

## A decisão (Caminho B)

**Nada muda visualmente no site.** A família recebe um **link único e seguro** por WhatsApp
que abre o **mesmo formulário de matrícula de hoje**, só que **já preenchido** com os dados
da matrícula anterior. Ela revisa, ajusta o que mudou, **escolhe o horário** do próximo
semestre (hoje os pais já escolhem horário pelo formulário) e segue para o contrato.

Decisões fechadas:
- **Contrato da rematrícula é sempre um PDF novo** (cláusulas às vezes mudam; o período
  sempre muda). A campanha aponta para um modelo da tela "Modelos de contrato".
- **Mensalidade pode ter reajuste** — o admin edita o valor na configuração da campanha
  (não é automático).
- **Link com segurança forte**: único por família, **expira** (24/48/72h, configurável)
  e **morre depois de usado** (uso único). Reenviar gera um link novo e invalida o antigo.

## Fluxo completo

1. Admin abre a campanha na dashboard: nome, período, **modelo de contrato (PDF novo)**,
   mensalidade (com reajuste), validade do link.
2. Dashboard gera 1 token por matrícula ativa e dispara os links via WhatsApp
   (mensagem preparada por família, como nos Comunicados).
3. Família abre `englishpatio.com.br/rematricula/<token>`:
   - token válido → formulário de matrícula pré-preenchido (alunos, responsáveis, endereço);
     campo de **horário** em destaque para escolher; mensalidade nova visível.
   - token expirado/usado/inválido → tela amigável "peça um novo link à escola".
4. Família confirma → backend gera o contrato com o **modelo da campanha** + dados revisados
   → envia ao **Autentique** → família assina pelo link de assinatura.
5. Webhook do Autentique marca "assinado" → dashboard atualiza sozinha (campanha + contratos).
6. Fim da campanha: quem confirmou vira matrícula do novo período; quem foi marcado
   "não renova" vira **desligamento com o motivo já registrado**; quem não respondeu fica
   pendente para a escola decidir (cobrar de novo ou desligar).

## O que muda em cada lugar

### Site (React atual — sem mudança visual)
- Nova rota `/rematricula/:token` que **reutiliza o componente do formulário** de matrícula
  (`Enrollment.tsx`) com um modo "pré-preenchido": recebe os dados do backend via token e
  inicializa o `FormData`; tudo continua editável (dados podem ter mudado).
- Validações existentes continuam valendo (CPF, CEP restrito a GO, telefone etc.).
- Tela de erro para token inválido/expirado/usado.

### Backend (fase Neon/serverless)
- Tabela `reenrollment_campaigns` (id, name, period, contract_template_id, fee, link_hours,
  status, created_by) e `reenrollment_links` (id, campaign_id, enrollment_id,
  token_hash, expires_at, used_at, status[none|sent|confirmed|signed|declined],
  declined_reason, new_schedule).
- Token: aleatório (256 bits), guardado **com hash** no banco (como senha); comparação na
  rota pública. Nunca expor dados sem token válido (LGPD — dados de menores).
- Rate limiting na rota pública + log de acessos.
- `GET /api/rematricula/:token` → dados para pré-preencher (só com token válido).
- `POST /api/rematricula/:token` → confirma, gera PDF do modelo da campanha, cria documento
  no Autentique, invalida o token (used_at).
- Webhook Autentique → atualiza status para "signed".

### Dashboard
- Tela já desenhada no preview: campanha (config), 5 status por família, barra de progresso,
  ⋮ por família (ver prévia, copiar/reenviar link, marcar não-renova com motivo).
- Dependência: separação **Aluno × Matrícula** (histórico) — a rematrícula cria uma nova
  matrícula ligada ao mesmo aluno, nunca duplica a pessoa.

## Pré-requisitos / ordem sugerida

1. Modelo de dados Aluno × Matrícula (também resolve histórico de quem sai e volta).
2. Modelos de contrato reais (upload de PDF + coordenadas pdf-lib — preview já desenhado).
3. Integração Autentique (criar doc + webhook) — tira a Stefany do fluxo manual.
4. Campanha de rematrícula (este plano).

## Pontos em aberto

- Mensagem de WhatsApp do disparo: manual (link copiado por família) até a API oficial
  do WhatsApp entrar (fase futura dos Comunicados).
- O que fazer com quem não responde até o fim da campanha (sugestão: lembrete automático
  perto de expirar + lista "sem resposta" para a secretaria cobrar).
- Irmãos em matrículas separadas: 1 link por matrícula ou 1 link por família? (sugestão:
  por família, agrupando pelo CPF do responsável — confirmar com a Priscylla).
