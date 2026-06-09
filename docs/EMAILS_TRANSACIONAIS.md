# Textos dos e-mails e mensagens transacionais — English Patio

Criado em **09/Jun/2026**. Cópia pronta dos e-mails (Resend) e mensagens (Autentique /
WhatsApp) que a dashboard dispara. Versionado aqui; na implementação vira template no
código/Resend. Referência: `DASHBOARD_PLAN.md §12`, `DASHBOARD_API.md §1/§8`,
`AUTENTIQUE_INTEGRACAO.md §1`.

## Convenções (valem para todos)

- **Tom:** acolhedor e claro, mas profissional. **Linguagem neutra** — sem flexão de
  gênero, **sem "bem-vindo/bem-vinda"** (usar "Que bom ter você" / "Olá"). Emoji: **mínimo**
  (no máximo 1, e só quando soma).
- **Remetente:** `English Patio <contato@englishpatio.com.br>` (domínio verificado no
  Resend — `DASHBOARD_PLAN.md §14`).
- **Assinatura padrão:** `Equipe English Patio`.
- **Variáveis:** `{{nome}}` (1º nome do destinatário), `{{nome_aluno}}`,
  `{{nome_aluno_2}}` (2º aluno da matrícula, quando houver — irmãos),
  `{{nome_responsavel}}`, `{{email}}`, `{{link_dashboard}}`, `{{link_reset}}`,
  `{{prazo}}`, `{{periodo}}` (ex. `2026.2`). Toda variável é **escapada** ao montar o
  e-mail; variável aberta `{{` sem `}}` bloqueia o envio (VALIDACOES §15).
- **Rodapé padrão (todos os e-mails):**
  > English Patio · Escola de inglês para crianças e adolescentes
  > Este é um e-mail automático — em caso de dúvida, fale com a escola.

---

## 1. Conta criada (usuário interno) — Resend · Fase 1

**Gatilho:** o Diretor cadastra a pessoa (`POST /api/users`). A senha provisória é definida
pelo Diretor e repassada **por fora** (não vai no e-mail, por segurança).

**Assunto:** `Seu acesso à dashboard da English Patio`

**Corpo:**
```
Olá, {{nome}}.

Foi criado um acesso para você na dashboard administrativa da English Patio.

Para entrar:
1. Acesse {{link_dashboard}}
2. Use o seu e-mail ({{email}}) e a senha provisória que a administração passou para você.
3. No primeiro acesso, você vai definir uma senha pessoal.

Se você não esperava este acesso, pode ignorar este e-mail com segurança.

Equipe English Patio
```

---

## 2. Redefinição de senha ("Esqueci a senha") — Resend · Fase 1

**Gatilho:** `POST /api/auth/forgot`. Link com token de uso único e expiração curta.

**Assunto:** `Redefinição de senha — English Patio`

**Corpo:**
```
Olá, {{nome}}.

Recebemos um pedido para redefinir a sua senha de acesso à dashboard.

Para criar uma nova senha, acesse: {{link_reset}}
Este link expira em {{prazo}} e só pode ser usado uma vez.

Se não foi você que pediu, ignore este e-mail — a sua senha atual continua valendo.

Equipe English Patio
```

---

## 3. Confirmação de matrícula (responsável) — Resend · Fase 5 (automático)

**Gatilho:** matrícula registrada (`POST /api/enrollments`, evento automático). Vai para o
responsável legal.

**Assunto:** `Recebemos a matrícula de {{nome_aluno}} 🎉`

**Corpo:**
```
Olá, {{nome_responsavel}}.

Que alegria ter {{nome_aluno}} com a gente! A matrícula para o período {{periodo}} foi
recebida com sucesso.

Próximos passos:
• Em breve você recebe o contrato para assinar digitalmente — é rápido e pelo celular.
• Assim que a turma e o horário forem confirmados, avisamos por aqui.
• Forma de pagamento: Boleto Bancário · Carnê em 6 parcelas (conforme o contrato).

Qualquer dúvida, é só falar com a escola. Estamos à disposição.

Equipe English Patio
```

> Se a matrícula tiver 2 alunos (irmãos), usar "{{nome_aluno}} e {{nome_aluno_2}}" e
> "a matrícula" no plural conforme o caso.

---

## 4. Mensagem do contrato (campo `message` do Autentique) — Fase 3

**Gatilho:** envio do contrato via `createDocument` (`AUTENTIQUE_INTEGRACAO.md §1.1`). O
**Autentique** entrega o link (e-mail/WhatsApp); este texto aparece no convite de assinatura.

**Texto (`DocumentInput.message`):**
```
Olá, {{nome_responsavel}}. Este é o contrato de matrícula de {{nome_aluno}} na English Patio
para o período {{periodo}}. Leia com calma e, se estiver tudo certo, assine digitalmente por
aqui mesmo — leva poucos minutos e pode ser pelo celular. Qualquer dúvida, fale com a escola
antes de assinar. Agradecemos!
```

---

## 5. Lembrete de contrato parado (automático) — Resend · Fase 5

**Gatilho:** contrato `sent`/`viewed` há ≥7 dias sem assinatura (cron, `DASHBOARD_PLAN.md
§7.4 / §14`).

**Assunto:** `Lembrete: contrato de {{nome_aluno}} aguardando assinatura`

**Corpo:**
```
Olá, {{nome_responsavel}}.

Notamos que o contrato de matrícula de {{nome_aluno}} ainda está aguardando a sua assinatura.

Para concluir, é só acessar o link que enviamos e assinar digitalmente — leva poucos minutos.
Se você não encontrou o link ou teve algum problema, responda este e-mail ou fale com a escola
que reenviamos na hora.

Equipe English Patio
```

---

## 6. Mensagens de WhatsApp (preparadas por família) — Fase 5 / Comunicados

WhatsApp é **mensagem preparada por família** (a pessoa revisa e envia; API oficial é fase
futura — `DASHBOARD_PLAN.md §6.7`). Texto curto, sem formatação pesada.

**6a. Cobrança de contrato (botão "cobrar no WhatsApp"):**
```
Olá, {{nome_responsavel}}! Aqui é da English Patio. Passando para lembrar que o contrato de
matrícula de {{nome_aluno}} ainda está aguardando assinatura. É rápido e pelo celular — quando
puder, é só abrir o link que enviamos. Qualquer dúvida, estou à disposição!
```

**6b. Parabéns de aniversário (lista de aniversariantes):**
```
Olá, {{nome_responsavel}}! A English Patio deseja um feliz aniversário para {{nome_aluno}}! 🎉
Que esse novo ano seja cheio de alegria e aprendizado. Um abraço de toda a equipe!
```

---

## Notas de implementação

- Versão HTML dos e-mails: usar o template da marca (cabeçalho navy `#1E3765`, botão amarelo
  `#F5B700` com texto navy `#15294d`) — o mesmo do preview do e-mail no `dashboard.html`.
- Comunicados em massa (não-transacionais) são escritos na tela Comunicados; estes aqui são
  os **fixos do sistema**.
- Antes de produção: alguém da escola revisa e aprova os textos (podem ajustar o tom).
