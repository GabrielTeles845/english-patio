# 📧 PLANO DE IMPLEMENTAÇÃO - Sistema de Email + Google Sheets + Drive

## 📋 Visão Geral

Este documento descreve o plano completo para implementar o sistema de envio de emails, armazenamento de dados em planilha e upload de PDFs no Google Drive para o formulário de matrícula.

---

## 🎯 Objetivos

1. ✅ Enviar email para a escola quando uma matrícula for realizada
2. ✅ Enviar cópia do email para o responsável
3. ✅ Salvar todos os dados do formulário em uma planilha do Google Sheets
4. ✅ Fazer upload do PDF do contrato para o Google Drive
5. ✅ Incluir link do PDF na planilha
6. ✅ Registrar data/hora de cada matrícula

---

## 👤 PARTE 1: O QUE VOCÊ PRECISA FAZER

### 1️⃣ Criar Conta no Resend

**Link:** https://resend.com/signup

**Passos:**
1. Criar conta gratuita (3.000 emails/mês)
2. Verificar domínio ou usar `onboarding@resend.dev` para testes
3. Ir em **API Keys** e gerar uma nova chave
4. Copiar e guardar a API Key em local seguro

**Resultado:** `RESEND_API_KEY=re_xxxxxxxxxxxxx`

---

### 2️⃣ Configurar Google Cloud Project

**Link:** https://console.cloud.google.com

#### Passo 1: Criar Projeto
1. Acessar Google Cloud Console
2. Clicar em "Select a project" (topo da página)
3. Clicar em "New Project"
4. Nome: **"English Patio Matrículas"**
5. Clicar em "Create"

#### Passo 2: Ativar APIs
1. No menu lateral, ir em **"APIs & Services"** → **"Library"**
2. Buscar e ativar:
   - **Google Sheets API**
   - **Google Drive API**

#### Passo 3: Criar Service Account
1. Ir em **"IAM & Admin"** → **"Service Accounts"**
2. Clicar em **"Create Service Account"**
3. Nome: `english-patio-matriculas`
4. Clicar em "Create and Continue"
5. Pular as permissões (clicar em "Continue")
6. Clicar em "Done"

#### Passo 4: Gerar Credenciais JSON
1. Clicar na service account criada
2. Ir na aba **"Keys"**
3. Clicar em **"Add Key"** → **"Create new key"**
4. Selecionar **JSON**
5. Clicar em "Create"
6. Um arquivo JSON será baixado - **guardar em local seguro**

#### Passo 5: Copiar Dados do JSON
Abrir o arquivo JSON baixado e copiar:
- `client_email` (ex: `xxxxx@xxxxx.iam.gserviceaccount.com`)
- `private_key` (começa com `-----BEGIN PRIVATE KEY-----`)

**Resultado:**
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxxx@xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----\n"
```

---

### 3️⃣ Criar Planilha no Google Sheets

**Link:** https://sheets.google.com

#### Passo 1: Criar Planilha
1. Criar nova planilha
2. Nome: **"Matrículas English Patio"**

#### Passo 2: Criar Estrutura (Cabeçalhos na Linha 1)

Copiar e colar na primeira linha:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Data/Hora Envio | Aluno 1 Nome | Aluno 1 Nascimento | Aluno 1 Idade | Tem Aluno 2? | Aluno 2 Nome | Aluno 2 Nascimento | Aluno 2 Idade | Responsável Nome | Responsável Nascimento | Responsável CPF | Responsável Telefone | Responsável Email | Parentesco | 2º Resp. Nome | 2º Resp. Telefone | 2º Resp. Parentesco | CEP | Endereço Completo | Bairro | Cidade/Estado | Resp. Financeiro | Formato Aula | Horário Confirmado? | Autorização Mídia | Autorização Contrato | Link PDF |

#### Passo 3: Compartilhar com Service Account
1. Clicar em **"Share"** (botão no canto superior direito)
2. Colar o email da service account (copiado do JSON: `client_email`)
3. Dar permissão de **"Editor"**
4. Desmarcar "Notify people"
5. Clicar em "Share"

#### Passo 4: Copiar ID da Planilha
- Na URL da planilha: `https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit`
- Copiar a parte: `1AbCdEfGhIjKlMnOpQrStUvWxYz`

**Resultado:** `GOOGLE_SHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz`

---

### 4️⃣ Criar Pasta no Google Drive

**Link:** https://drive.google.com

#### Passo 1: Criar Pasta
1. Clicar em **"New"** → **"Folder"**
2. Nome: **"Contratos - Matrículas English Patio"**
3. Clicar em "Create"

#### Passo 2: Compartilhar com Service Account
1. Clicar com botão direito na pasta criada
2. Clicar em **"Share"**
3. Colar o email da service account
4. Dar permissão de **"Editor"**
5. Desmarcar "Notify people"
6. Clicar em "Share"

#### Passo 3: Copiar ID da Pasta
- Abrir a pasta e copiar da URL: `https://drive.google.com/drive/folders/1XyZaBcDeFgHiJkLmNoPqRsTuVwXyZ`
- Copiar a parte: `1XyZaBcDeFgHiJkLmNoPqRsTuVwXyZ`

**Resultado:** `GOOGLE_DRIVE_FOLDER_ID=1XyZaBcDeFgHiJkLmNoPqRsTuVwXyZ`

---

### 5️⃣ Configurar Variáveis de Ambiente na Vercel

**Link:** https://vercel.com (ir no seu projeto)

#### Passos:
1. Acessar seu projeto na Vercel
2. Ir em **"Settings"** → **"Environment Variables"**
3. Adicionar as seguintes variáveis (uma por uma):

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxxx@xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_DRIVE_FOLDER_ID=1XyZaBcDeFgHiJkLmNoPqRsTuVwXyZ
SCHOOL_EMAIL=contato@englishpatio.com.br
```

**IMPORTANTE:**
- A variável `GOOGLE_PRIVATE_KEY` deve incluir as aspas e os `\n`
- Selecionar ambiente: **Production**, **Preview** e **Development**

4. Clicar em **"Save"**

---

## 💻 PARTE 2: O QUE SERÁ IMPLEMENTADO (CÓDIGO)

### 1️⃣ Instalar Dependências

```bash
npm install resend googleapis
```

---

### 2️⃣ Estrutura de Arquivos a Criar

```
/api
  └── enviar-matricula.ts       # Vercel Function (endpoint principal)

/src/services
  ├── googleSheetsService.ts    # Serviço para Google Sheets
  ├── googleDriveService.ts     # Serviço para Google Drive
  └── resendService.ts          # Serviço para envio de emails
```

---

### 3️⃣ Funcionalidades Implementadas

#### Vercel Function (`/api/enviar-matricula.ts`)
- ✅ Receber dados do formulário via POST
- ✅ Validar dados recebidos
- ✅ Gerar PDF do contrato (já existe no código)
- ✅ Fazer upload do PDF para Google Drive
- ✅ Obter link público do PDF
- ✅ Salvar dados + link na planilha Google Sheets
- ✅ Enviar email para escola (com PDF anexado)
- ✅ Enviar email para responsável (cópia, com PDF anexado)
- ✅ Retornar sucesso/erro para o frontend

#### Google Sheets Service
- ✅ Conectar com Google Sheets API
- ✅ Adicionar nova linha com dados da matrícula
- ✅ Incluir timestamp (data/hora de envio)
- ✅ Incluir link do PDF

#### Google Drive Service
- ✅ Conectar com Google Drive API
- ✅ Fazer upload do PDF
- ✅ Nomear arquivo: `Contrato_[Nome_Aluno]_[Data].pdf`
- ✅ Tornar arquivo público (leitura)
- ✅ Retornar link público do arquivo

#### Resend Service (Email)
- ✅ Templates de email HTML responsivos
- ✅ Email para escola com dados completos
- ✅ Email para responsável com confirmação
- ✅ Anexar PDF nos emails
- ✅ Tratamento de erros

#### Frontend Update (`Enrollment.tsx`)
- ✅ Modificar `handleSubmit` para chamar a API
- ✅ Atualizar modal de confirmação com novas mensagens
- ✅ Melhorar feedback de loading/sucesso/erro

---

## 🔄 FLUXO COMPLETO DO SISTEMA

```
1. Usuário preenche formulário de matrícula
         ↓
2. Clica em "Finalizar Matrícula"
         ↓
3. Frontend envia dados para /api/enviar-matricula
         ↓
4. Vercel Function processa:
   ├─ Gera PDF do contrato
   ├─ Upload PDF → Google Drive (retorna link)
   ├─ Salva dados + link + timestamp → Google Sheets
   ├─ Envia email → Escola (com PDF anexo)
   └─ Envia email → Responsável (com PDF anexo)
         ↓
5. Retorna sucesso para o frontend
         ↓
6. Modal de confirmação exibido
```

---

## 📊 ESTRUTURA DA PLANILHA (Exemplo)

| Data/Hora | Aluno 1 Nome | Aluno 1 Nasc. | ... | Email | Link PDF |
|-----------|--------------|---------------|-----|-------|----------|
| 16/10/2025 14:35:22 | João Silva | 15/03/2015 | ... | pai@email.com | https://drive.google.com/file/d/xxx |
| 16/10/2025 15:42:10 | Maria Costa | 22/08/2016 | ... | mae@email.com | https://drive.google.com/file/d/yyy |

---

## 📧 TEMPLATES DE EMAIL

### Email para Escola

**Assunto:** Nova Matrícula - [Nome do Aluno]

```
Olá equipe English Patio! 👋

Uma nova matrícula foi realizada através do site:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👦 DADOS DO ALUNO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Nome: [Nome Aluno 1]
• Data de Nascimento: [Data] ([Idade] anos)
[Se houver Aluno 2: mesma estrutura]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍👩‍👦 RESPONSÁVEL LEGAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Nome: [Nome]
• CPF: [CPF]
• Telefone: [Telefone]
• Email: [Email]
• Parentesco: [Parentesco]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 ENDEREÇO E PAGAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Endereço: [Endereço completo]
• Responsável Financeiro: [Nome]
• Formato das Aulas: [Sede/Domicílio]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 O contrato preenchido está em anexo.

🗂️ Acesse a planilha completa: [Link da planilha]

⏰ Data do envio: [DD/MM/YYYY HH:mm:ss]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este email foi gerado automaticamente pelo sistema de matrículas.
```

---

### Email para Responsável

**Assunto:** Confirmação de Matrícula - English Patio 🎉

```
Olá [Nome do Responsável]! 👋

Recebemos a matrícula de [Nome do Aluno] com sucesso! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Sua matrícula foi registrada e nossa equipe já foi notificada!

📄 Em anexo está o contrato preenchido com os dados fornecidos.

📞 Nossa equipe entrará em contato em breve para:
   • Confirmar os dados
   • Finalizar detalhes do pagamento
   • Esclarecer qualquer dúvida

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 Dúvidas? Entre em contato:
• Email: contato@englishpatio.com.br
• Telefone: (62) XXXX-XXXX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Atenciosamente,
Equipe English Patio 🇬🇧

www.englishpatio.com.br
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Você (Configuração)
- [ ] Criar conta no Resend e obter API Key
- [ ] Criar projeto no Google Cloud
- [ ] Ativar Google Sheets API
- [ ] Ativar Google Drive API
- [ ] Criar Service Account e baixar JSON
- [ ] Criar planilha no Google Sheets
- [ ] Estruturar cabeçalhos da planilha
- [ ] Compartilhar planilha com Service Account
- [ ] Copiar ID da planilha
- [ ] Criar pasta no Google Drive
- [ ] Compartilhar pasta com Service Account
- [ ] Copiar ID da pasta
- [ ] Configurar variáveis de ambiente na Vercel
- [ ] Informar Claude que está pronto para implementação

### Claude (Desenvolvimento)
- [ ] Instalar dependências (resend, googleapis)
- [ ] Criar serviço Google Sheets
- [ ] Criar serviço Google Drive
- [ ] Criar serviço Resend (emails)
- [ ] Criar Vercel Function principal
- [ ] Atualizar frontend (Enrollment.tsx)
- [ ] Criar templates de email
- [ ] Adicionar tratamento de erros
- [ ] Testar fluxo completo
- [ ] Documentar código

---

## 🚀 PRÓXIMOS PASSOS

1. **Você:** Seguir todos os passos da PARTE 1
2. **Você:** Confirmar que está tudo configurado
3. **Claude:** Implementar código da PARTE 2
4. **Ambos:** Testar sistema completo
5. **Deploy:** Publicar na Vercel

---

## 📝 NOTAS IMPORTANTES

### Segurança
- ✅ Chaves de API ficam seguras no servidor (Vercel)
- ✅ Frontend não tem acesso direto às APIs
- ✅ Service Account tem permissões limitadas
- ✅ PDFs ficam no Google Drive (backup automático)

### Custos
- **Resend:** Gratuito até 3.000 emails/mês
- **Google Cloud:** Gratuito (dentro dos limites)
- **Vercel:** Plano hobby gratuito suporta tudo

### Backup
- Dados salvos na planilha (fácil exportar)
- PDFs salvos no Drive (backup automático do Google)
- Emails enviados ficam no histórico do Resend

### Escalabilidade
- Sistema aguenta facilmente 1000+ matrículas/mês
- Se precisar mais, é só migrar para plano pago

---

## 🆘 SUPORTE

Se tiver dúvidas durante a configuração:
1. Consultar documentação oficial:
   - Resend: https://resend.com/docs
   - Google Cloud: https://cloud.google.com/docs
   - Vercel: https://vercel.com/docs
2. Chamar o Claude novamente! 😊

---

**Data de criação:** 16/10/2025
**Versão:** 1.0
**Status:** Aguardando configuração (PARTE 1)
