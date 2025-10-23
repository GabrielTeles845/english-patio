# 📚 Instruções de Configuração - Sistema de Matrícula English Patio

## ⚠️ IMPORTANTE: Siga TODOS os passos na ordem

---

## 🎯 Passo 1: Usar sua Conta Gmail (GRATUITO)

**Você vai usar uma conta Gmail GRATUITA!**
- ✅ 100 emails/dia (mais que suficiente para matrículas)
- ✅ Zero custo
- ✅ Configuração mais simples

**Recomendação:** Use sua conta Gmail pessoal ou crie uma nova conta para a escola.

> **Upgrade futuro (opcional):** Se no futuro precisar de mais emails/dia, pode migrar para Google Workspace (R$35/mês) com 500 emails/dia.

---

## 📊 Passo 2: Criar a Planilha no Google Sheets

1. Acesse: https://sheets.google.com
2. Clique em **"Em branco"** (criar nova planilha)
3. Renomeie a planilha para: **"Matrículas English Patio"**
4. Renomeie a aba para: **"Matrículas"**

### Importar as colunas:

1. Abra o arquivo `planilha-modelo-matriculas.csv` (está na pasta do projeto)
2. No Google Sheets, vá em **Arquivo > Importar**
3. Faça upload do arquivo CSV
4. Escolha **"Substituir planilha atual"**
5. Clique em **"Importar dados"**

### Pegar o ID da planilha:

A URL da planilha será algo como:
```
https://docs.google.com/spreadsheets/d/1ABC123XYZ456/edit
```

O ID é a parte entre `/d/` e `/edit`:
```
1ABC123XYZ456
```

**COPIE ESSE ID!** Você vai precisar dele no Passo 4.

---

## 📁 Passo 3: Criar Pasta no Google Drive

1. Acesse: https://drive.google.com
2. Clique em **"Novo" > "Nova pasta"**
3. Nome da pasta: **"Contratos - English Patio"**
4. Clique com botão direito na pasta > **"Compartilhar"**
5. Em **"Acesso geral"**, escolha **"Qualquer pessoa com o link"** (VISUALIZADOR)
6. Clique em **"Concluído"**

### Pegar o ID da pasta:

A URL da pasta será algo como:
```
https://drive.google.com/drive/folders/1XYZ789ABC
```

O ID é a parte final:
```
1XYZ789ABC
```

**COPIE ESSE ID!** Você vai precisar dele no Passo 4.

---

## 💻 Passo 4: Criar o Google Apps Script (Backend)

### 4.1 - Criar o projeto:

1. Acesse: https://script.google.com
2. Clique em **"Novo projeto"**
3. Renomeie para: **"English Patio - Backend Matrícula"**

### 4.2 - Colar o código:

1. Abra o arquivo `google-apps-script/Code.gs` (está na pasta do projeto)
2. **COPIE TODO O CONTEÚDO** do arquivo
3. No Google Apps Script, **COLE** no editor (substitua todo o código padrão)

### 4.3 - Configurar as variáveis:

No topo do código, você verá:

```javascript
const CONFIG = {
  EMAIL_ESCOLA: 'englishpatio@yahoo.com',
  SPREADSHEET_ID: 'COLE_AQUI_O_ID_DA_SUA_PLANILHA',
  SHEET_NAME: 'Matrículas',
  DRIVE_FOLDER_ID: 'COLE_AQUI_O_ID_DA_PASTA_DRIVE',
  ...
};
```

**SUBSTITUA:**
- `SPREADSHEET_ID`: Cole o ID da planilha (do Passo 2)
- `DRIVE_FOLDER_ID`: Cole o ID da pasta do Drive (do Passo 3)

### 4.4 - Salvar:

Clique no ícone de **disquete** ou pressione `Ctrl+S`.

---

## 🚀 Passo 5: Fazer Deploy do Script

### 5.1 - Testar primeiro (IMPORTANTE!):

1. No Google Apps Script, procure a função `testarConfiguracao` no dropdown (no topo)
2. Clique em **"Executar"**
3. **AUTORIZE** as permissões quando solicitado:
   - Clique em **"Revisar permissões"**
   - Escolha sua conta Google
   - Clique em **"Avançado"** (canto inferior esquerdo)
   - Clique em **"Acessar English Patio - Backend Matrícula (não seguro)"**
   - Clique em **"Permitir"**

4. Veja o log de execução (ícone de papel na parte inferior):
   - Se tudo der certo, verá mensagens de ✅ sucesso
   - **Você receberá um email de teste** em englishpatio@yahoo.com

### 5.2 - Fazer o Deploy:

1. Clique em **"Implantar" > "Nova implantação"**
2. Clique no ícone de **engrenagem** ⚙️ ao lado de "Selecionar tipo"
3. Escolha **"Aplicativo da Web"**
4. Configure:
   - **Descrição:** Sistema de Matrícula English Patio
   - **Executar como:** Eu (seu email)
   - **Quem tem acesso:** Qualquer pessoa
5. Clique em **"Implantar"**

### 5.3 - Copiar URL do Web App:

Após o deploy, você verá uma URL assim:
```
https://script.google.com/macros/s/ABC123XYZ.../exec
```

**COPIE ESSA URL COMPLETA!** Você vai precisar dela no próximo passo.

---

## 🎨 Passo 6: Configurar o Frontend

### 6.1 - Criar arquivo de variáveis de ambiente:

1. Na pasta do projeto, crie o arquivo `.env.local` (se ainda não existe)
2. Adicione a seguinte linha:

```
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SUA_URL_AQUI/exec
```

**SUBSTITUA** pela URL que você copiou no Passo 5.3.

### 6.2 - Instalar dependências (se necessário):

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

---

## ✅ Passo 7: Testar o Sistema Completo

### 7.1 - Rodar o projeto localmente:

```bash
npm run dev
```

### 7.2 - Preencher uma matrícula de teste:

1. Acesse: http://localhost:5173/matricula
2. Preencha o formulário completo
3. Finalize a matrícula

### 7.3 - Verificar se funcionou:

✅ **Planilha:** Deve aparecer uma nova linha com os dados
✅ **Drive:** Deve aparecer o PDF do contrato
✅ **Email:** Você deve receber o email em gabriel_teles2010@hotmail.com

---

## 🔒 Segurança

### O que está protegido:

✅ **Dados sensíveis no servidor:** Tudo roda no Google (backend server-side)
✅ **Impossível burlar:** Usuários não conseguem manipular dados via DevTools
✅ **PDFs seguros:** Salvos no Google Drive com link privado
✅ **Emails confiáveis:** Enviados pelo Gmail oficial

### Domínios permitidos (CORS):

O script só aceita requisições de:
- `https://gabrielteles845.github.io` (seu site em produção)
- `http://localhost:5173` (desenvolvimento)

Se você mudar o domínio do site, edite a variável `ALLOWED_ORIGINS` no arquivo `Code.gs`.

---

## 🆘 Solução de Problemas

### Erro: "Planilha não encontrada"
- Verifique se o `SPREADSHEET_ID` está correto
- Verifique se o nome da aba é exatamente `Matrículas`

### Erro: "Pasta do Drive não encontrada"
- Verifique se o `DRIVE_FOLDER_ID` está correto
- Verifique se você deu permissão de acesso público à pasta

### Email não está sendo enviado
- Verifique se o email `gabriel_teles2010@hotmail.com` está correto no arquivo Code.gs
- Veja os logs no Google Apps Script (ícone de papel)
- Se atingiu o limite diário (100 emails), aguarde 24h ou upgrade para Workspace

### Erro CORS no frontend
- Verifique se a URL do script está correta no `.env.local`
- Verifique se você fez o deploy do script (Passo 5.2)

---

## 📞 Próximos Passos Após Configuração

1. **Teste com dados reais** (preencha 2-3 matrículas de teste)
2. **Verifique os emails, planilha e Drive**
3. **Se tudo estiver OK, faça deploy em produção:**

```bash
npm run build
npm run deploy
```

4. **Monitore as matrículas** pela planilha do Google Sheets

---

## 💰 Custos

- **TOTALMENTE GRATUITO!** ✅
  - Usando conta Gmail gratuita
  - Limite: 100 emails/dia (suficiente para matrículas)

- **Upgrade opcional:** Google Workspace Business Starter (R$35/mês)
  - Apenas se precisar de mais de 100 emails/dia
  - 500 emails/dia

---

## ✨ Pronto!

Agora você tem um sistema profissional, seguro e escalável para gerenciar suas matrículas!

Se tiver dúvidas, entre em contato com o desenvolvedor.
