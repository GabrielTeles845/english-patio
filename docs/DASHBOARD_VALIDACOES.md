# Matriz de Validações — English Patio (dashboard + matrícula)

Documento vivo, iniciado em **08/Jun/2026**. Não é código — é o **checklist** que a
implementação tem que cumprir e a fonte dos **testes negativos** (`reg-05`, ver
`docs/AGENDA_PLAN.md`/`DASHBOARD_PLAN.md §8.1`).

**Por que existe:** em vez de "tentar lembrar" o que validar, passamos **todo campo**
pela mesma bateria fixa de perguntas. O que ninguém pensou aparece como célula vazia /
marcador **⚠ A DEFINIR** — consolidados na §99 no fim.

**Fonte da verdade do código:** `src/utils/validators.ts` (canônico). O preview
(`public/dashboard.html`) reimplementou inline porque é HTML solto; na versão React o
módulo é **um só** (reúne validators.ts + as regras dashboard-only abaixo).

---

## A bateria (as 10 perguntas por campo)

1. **Obrigatório?** (e obrigatório *quando* — pode depender de outro campo)
2. **Formato/tipo** (CPF, e-mail, telefone, data real, CEP…)
3. **Tamanho** mín. **e máx.**
4. **Faixa/sanidade** (data não-futura, idade, valor ≥0)
5. **Unicidade/idempotência**
6. **Normalização** (trim, acentos, caixa, dígitos)
7. **Consistência cruzada** (campo A depende de B)
8. **Injeção/XSS**
9. **Revalidação no servidor** (o front nunca é fonte de verdade)
10. **Regra de segurança própria do campo** (senha, rate-limit, token)

## Regras transversais (valem para TODO campo — não repetir nas tabelas)

- **6. Normalização:** todo texto sofre `trim`; dígitos (CPF/tel/CEP) comparados sem
  máscara (`replace(/\D/g,'')`); nomes comparados em minúsculas + espaços colapsados.
- **8. XSS (`badChars`, dashboard-only):** campos de texto livre **bloqueiam** `< > " ' &`
  — mensagem: *"Remova os caracteres especiais (… ) — use só letras, números e pontuação
  simples."* No produto real isto é defesa de XSS, então **também valida no servidor**.
- **9. Servidor:** **toda** rota `/api/*` revalida com **Zod** (mesmas regras). O client
  só melhora a UX; nunca é autoridade. RBAC revalidado por papel.
- **Máscaras (preview):** data `dd/mm/aaaa` (`maskDate`), telefone `(XX) 9XXXX-XXXX`
  (`maskPhone`), CPF `000.000.000-00` (`maskCpf`), CEP `00000-000` (`maskCep`).
- **Tamanho máximo (decidido 08/Jun):** `validators.ts` não tem teto hoje — adotar o
  conjunto da §99 (nome 80, logradouro 120, complemento 60, bairro/cidade 60, teacher 60,
  sala 40, modelo 60, parentesco 30, observações 500). Anti-abuso + layout.

Legenda: **DO** = regra dashboard-only (não está no `validators.ts`). **⚠** = lacuna.

---

## 1. Matrícula — Alunos

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| `student1Name` | sim | nome completo: ≥2 partes significativas (ignora `e/de/da/do/dos/das`), cada ≥2 chars | "Digite o nome completo (nome e sobrenome)" | `isValidFullName`; máx ⚠ |
| `student1BirthDate` | sim | data real `dd/mm/aaaa`, não-futura, **idade ≤ 20** | "Data inválida" / "Data não pode ser no futuro" / "Aluno não pode ter mais de 20 anos" | `isValidStudentBirthDate` |
| `student1Age` | — | **derivado** da data (não digitável) | — | não validar isolado |
| `hasStudent2` | — | boolean (toggle) | — | se `true` → aluno 2 vira obrigatório |
| `student2Name` | se `hasStudent2` | = student1Name | idem | cross-7 com `hasStudent2` |
| `student2BirthDate` | se `hasStudent2` | = student1BirthDate | idem | `isValidStudentBirthDate` |

## 2. Matrícula — Responsável legal (principal)

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| `responsibleName` | sim | nome completo | "Digite o nome completo…" | `isValidFullName`; máx ⚠ |
| `responsibleBirthDate` | sim | data real, não-futura, **idade ≥ 18** | "Data inválida" / "…futuro" / "Responsável deve ter no mínimo 18 anos" | `isValidResponsibleBirthDate` |
| `responsibleCPF` | sim | 11 dígitos + **dígitos verificadores** | "CPF inválido" | `isValidCPF`. **CPF repetido NÃO é erro** = família; só **aviso** se o mesmo CPF aparece com **outro nome** de responsável (`cpfOwner`, **DO**) |
| `responsiblePhone` | sim | 11 dígitos, **3º dígito = 9** | "Telefone deve começar com 9: (XX) 9XXXX-XXXX" | `isValidPhone` |
| `responsibleRelationship` | sim | **select**: Mãe/Pai/Avó/Avô/Tia/Tio/Tutor Legal/Outro | "Campo obrigatório" | **já é select** no form real |
| `responsibleEmail` | sim | regex `x@y.z` | "E-mail inválido" | `isValidEmail`; máx ⚠ |

## 3. Matrícula — Segundo responsável (opcional, só contato)

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| `hasSecondResponsible` | — | boolean | — | se `true` → campos abaixo obrigatórios |
| `secondResponsibleName` | se toggle | nome completo | idem | cross-7 |
| `secondResponsibleCPF` | se toggle | CPF válido | "CPF inválido" | `isValidCPF` |
| `secondResponsiblePhone` | se toggle | telefone válido | idem | `isValidPhone` |
| `secondResponsibleRelationship` | se toggle | **select** (mesma lista) | "Campo obrigatório" | já é select |

## 4. Matrícula — Responsável financeiro

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| `financialResponsibleType` | sim | enum `legal` \| `second` \| `other` | — | cross-7 define os 2 abaixo |
| `financialResponsibleName` | se `other` | nome completo | "Digite o nome completo…" | só usado se `other` |
| `financialResponsibleCPF` | se `other` | CPF válido | "CPF inválido" | só usado se `other` |
| `paymentMethod` | fixo | **sempre** `boleto/carnê 6x` | — | não inventar PIX/cartão (decisão registrada) |

## 5. Matrícula — Endereço

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| `cep` | sim | 8 dígitos | "CEP inválido" | `isValidCEP`; busca em 4 APIs (`cepService`) |
| `state` | sim | **deve ser `GO`** | "Atendemos apenas o estado de Goiás" | **regra de negócio crítica** (cepService rejeita fora de GO) |
| `street` | sim | texto | "Campo obrigatório" | máx ⚠ |
| `number` | sim | dígitos **ou** "S/N" | "Campo obrigatório" | decidido 08/Jun |
| `complement` | não | texto livre | — | máx ⚠ |
| `neighborhood` | sim | texto | "Campo obrigatório" | máx ⚠ |
| `city` | sim | texto | "Campo obrigatório" | preenchido pelo CEP |

## 6. Matrícula — Contrato & autorizações

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| `classFormat` | sim | enum `sede` \| `domicilio` | — | carimba no PDF (pg.2) |
| `schedule` | sim | enum `seg-qua` \| `ter-qui` | — | sem sexta/sábado/1x |
| `scheduleDay1Start/End`, `Day2Start/End` | sim | **um dos 8 slots reais** (8:30…17:45) | — | decidido 08/Jun |
| `authorizationContract` | sim | **deve ser `true`** (aceite) | "É preciso aceitar o contrato" | bloqueia envio |
| `scheduleConfirmed` | sim | **deve ser `true`** | "Confirme o horário" | bloqueia envio |
| `authorizationMedia` | não | boolean (uso de imagem) | — | carimba no PDF (pg.4); pode ser não |

## 7. Auth — Login

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| email | sim | regex | "E-mail inválido" | `isValidEmail` |
| senha | sim | não-vazia | "Campo obrigatório" | **rate-limit** por IP+e-mail (DASHBOARD_PLAN §3) |

## 8. Auth — Senha (1ª senha, troca, reset)

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| nova senha | sim | **≥10 chars + ≥1 maiúscula + ≥1 minúscula + ≥1 número + ≥1 especial** | "A senha precisa de 10+ caracteres, com maiúscula, minúscula, número e especial" | **decidido 08/Jun**. ⚠ preview usa regra mais fraca (`validNewPass` ≥10+letra+número) — **trocar** |
| confirmar senha | sim | == nova senha | "As senhas não conferem" | cross-7 |
| senha atual | na troca | confere com a do usuário | "Senha atual incorreta" | só no "trocar senha" |
| senha temporária | — | **forçar troca no 1º login** | — | decisão da 1ª senha (DASHBOARD_PLAN §6.10) |

## 9. Usuários (Diretor cadastra)

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| nome | sim | nome completo | "Digite o nome completo…" | máx ⚠ |
| e-mail | sim | regex + **único** entre usuários | "E-mail inválido" / "Já existe um usuário com esse e-mail" | unicidade-5 (decidido) |
| papel | sim | enum `director`\|`supervisor`\|`secretary` | — | **último Diretor não rebaixa/exclui/desativa** (cross-7) |
| senha temporária | sim | = §8 (ou gera forte) | idem §8 | trocada no 1º login |

## 10. Agenda — Turma

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| sala | sim | existe e ativa | — | — |
| par de dias | sim | enum `seg-qua`\|`ter-qui` | — | — |
| horário | sim | um dos 8 slots válidos | — | `8:30/9:30/10:30/13:30/14:30/15:30/16:45/17:45` |
| (sala+par+horário) | — | **único** | "Já existe turma nesse horário/sala" | unicidade-5 (slot não duplica) |
| nível | sim | um dos 19 níveis | — | — |
| capacidade | sim | **1..7**; ao editar **nunca < ocupação atual** | "A capacidade não pode ser menor que os alunos já na turma" | cap padrão=máx=7 (DO) |
| teacher | não | texto | — | opcional; máx ⚠ |

## 11. Agenda — Sala

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| nome | sim | texto, **único** (case-insensitive), máx 40 | "Campo obrigatório" / "Já existe uma sala com esse nome" | 13 vêm prontas (decidido) |
| cor | sim | da paleta | — | — |
| teacher | não | texto | — | opcional |
| desativar | — | só **sem turmas** | "Mova as turmas antes de desativar a sala" | cross-7 |

## 12. Modelos de contrato (PDF)

| Campo | Obrig. | Regra | Mensagem | Notas |
|---|---|---|---|---|
| nome do modelo | sim | texto | "Campo obrigatório" | máx ⚠ |
| arquivo | sim | **PDF**, **≤ 16 MB** | "Envie um PDF" / "Arquivo acima do limite" | decidido 08/Jun |
| mapeamento de campos | sim p/ ativar | todos os campos posicionados | "Posicione os N campos pendentes antes de usar" | bloqueia "usar nas matrículas" |

## 13. Aluno — Mover / Alocar em turma (`openMoverKid`)

| Regra | Detalhe | Bloqueio/aviso |
|---|---|---|
| destino obrigatório | botão "Mover/Alocar" **desabilitado** até escolher | — |
| só turmas com vaga | turmas cheias só via "abrir vaga extra" explícito | — |
| **mudança de nível** | destino de outro nível exige **confirmação** | "muda o nível do aluno — confirme com cuidado" |
| **vaga extra** | cap 7→8→9 (**máx 2 extras**); a partir de 9 bloqueia | "já está com 9 lugares — passaria do que cabe na sala" |
| compatibilidade de idade | sugere mesmo nível / faixa de idade primeiro | — |
| auditoria | **toda** movimentação loga no Registro de atividades | — |

## 14. Aluno — Desligamento (`openExitModal`)

| Campo | Obrig. | Regra | Notas |
|---|---|---|---|
| motivo | sim | **select** (EXIT_REASONS) | botão desabilitado sem motivo |
| observação | **condicional** | **obrigatória se motivo = "Outro"** ("Descreva o motivo *"); máx 500 | senão opcional |
| (efeito) | — | matrícula vira **inativa** (reativável); dados/contratos ficam no histórico | não apaga |

## 15. Comunicados — escrever + modelos

| Campo | Obrig. | Regra | Notas |
|---|---|---|---|
| assunto (`emailSubject`) | sim | texto, **máx 150** | **preview é leniente** (não trava vazio) → spec **exige** |
| corpo (`emailBody`) | sim | texto, **máx 2000**; **variáveis `{{nome_responsavel}}`/`{{nome_aluno}}` fechadas** | escape ao montar o e-mail (não `badChars` cru — é texto de e-mail) |
| canais | sim | **≥1** de `email`/`whatsapp` (ou ambos) | — |
| público (`emailTo`) | sim | select: todos · Seg/Qua · Ter/Qui · contratos pendentes | — |
| variável aberta | — | `{{` sem `}}` **bloqueia** | regra de negócio (mesma ideia do `reg-05` do evollutezap) |

## 16. Importação de planilha de matrículas (`openImportModal`)

| Regra | Detalhe | Mensagem |
|---|---|---|
| tipo de arquivo | **só `.csv`** (`accept=".csv,text/csv"`) | "Somente .csv" |
| **dedup idempotente** | linhas iguais exceto **Data/Hora** e **Link PDF** = mesma matrícula → fica a 1ª | **mata o bug DEBITOS #1** (re-gerar contrato duplica) |
| não re-duplica | quem já está na dashboard não entra de novo | — |
| **validação por linha** | CPF (formato+dígito), telefone, datas, e-mail, **endereço fora de GO** → vão pra **fila de revisão** antes de confirmar | — |
| campos ausentes | "Na escola desde" em branco; sem dia/horário → aluno entra **sem turma** (fila "aguardando turma") | — |

> **Conferido na planilha REAL (08/Jun — `public/…xlsx`, NÃO versionada):** 30 colunas; a
> coluna de aceite chama-se **"Aceitou termos do Contrato"** (não "Autorização Contrato").
> **694 linhas → 568 matrículas únicas → 126 duplicadas (18%)** — confirma o bug e a dedup.
> **Formato (DECIDIDO 08/Jun): aceita CSV e XLSX.** O preview já lê os dois — `.xlsx` via
> SheetJS (converte p/ CSV e reusa o mesmo pipeline de dedup/validação). Testado com o
> arquivo real: 694 linhas → 127 repetidas removidas → 565 novas + 2 para conferir.
> **Reset p/ testes:** o preview tem botão "Excluir todas as matrículas" no modal de importação.

## 17. Editor de site — textos editáveis

| Regra | Detalhe |
|---|---|
| cada texto | **XSS**: escapar ao renderizar; **teto por campo** — título 120 · subtítulo 200 · parágrafo 600 |
| publicação | bloqueia/avisa quando há pendências |

---

## 99. Decisões (08/Jun/2026) — lacunas resolvidas

**Importante (reconciliado com o código):** o formulário de matrícula real
(`src/pages/Enrollment.tsx`) **já valida tudo** das §1–§6 — CPF com dígito verificador,
telefone (3º=9), nome completo, e-mail, CEP, datas (≤20/≥18), **restrição a GO** e campos
obrigatórios — e o **parentesco já é um `<select>`** (Mãe/Pai/Avó/Avô/Tia/Tio/Tutor
Legal/Outro). Para a matrícula, esta matriz **documenta** o que já existe; o trabalho novo
de validação é nas telas da **dashboard** (que reusam as mesmas regras).

1. **Tamanho máximo de texto** — DECIDIDO: nome 80 · logradouro 120 · complemento 60 ·
   bairro/cidade 60 · teacher 60 · nome de sala 40 · nome de modelo 60 · parentesco 30 ·
   observações 500. (`validators.ts` não tem teto hoje → único buraco real; adicionar.)
2. **`number` do endereço** — DECIDIDO: aceita dígitos e **"S/N"**; bloqueia o resto.
3. **Parentesco** — JÁ É SELECT na matrícula (opções acima); a dashboard usa a mesma lista.
4. **Horários do contrato** — DECIDIDO: validar contra os **8 slots reais** (8:30…17:45).
5. **E-mail de usuário** — DECIDIDO: **único** ("Já existe um usuário com esse e-mail").
6. **Nome de sala** — DECIDIDO: **único** (ignorando maiúscula/minúscula).
7. **Limite do PDF do modelo** — DECIDIDO: **16 MB** (igual aos uploads do preview).
8. **Política de senha** — trocar a regra fraca do preview por
   `≥10 + maiúscula + minúscula + número + especial` (decidido antes).
9. **Idempotência da matrícula** (`submission_id`) — mata duplicatas (DEBITOS #1); camada
   de save.
10. **Comunicado — máx de assunto/corpo** — DECIDIDO: **150 / 2000**. (O envio do preview
    é leniente — não trava vazios; a spec **exige** assunto + corpo.)
11. **Texto do site (editor)** — DECIDIDO: teto por campo — título 120 · subtítulo 200 ·
    parágrafo 600 (protege o layout do site).
12. **Acessibilidade** — DECIDIDO: **básico pragmático** (teclado, foco visível, ARIA nos
    controles custom; sem WCAG AA formal). Ver `DASHBOARD_PLAN.md §11`.
13. **LGPD (apagamento × log)** — DECIDIDO: **anonimizar o alvo no `activity_log`**. Ver
    `DASHBOARD_PLAN.md §11`.

> Cada linha desta matriz (incl. as ⚠ quando resolvidas) vira um **teste negativo** no
> `reg-05`: a regra que bloqueia salvar é exercida com um valor inválido e tem que falhar.
