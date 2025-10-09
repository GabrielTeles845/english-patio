# Configuração do EmailJS para Envio de Contratos

Este guia explica como configurar o EmailJS para enviar os contratos preenchidos por email.

## 1. Criar Conta no EmailJS

1. Acesse [https://www.emailjs.com/](https://www.emailjs.com/)
2. Clique em **Sign Up** e crie uma conta gratuita
3. Confirme seu email

## 2. Configurar Serviço de Email

1. No dashboard do EmailJS, vá em **Email Services**
2. Clique em **Add New Service**
3. Escolha seu provedor de email (Gmail, Outlook, etc.)
4. Siga as instruções para conectar sua conta
5. Anote o **Service ID** gerado

## 3. Criar Template de Email

1. Vá em **Email Templates**
2. Clique em **Create New Template**
3. Use o seguinte template:

```
Assunto: Contrato de Matrícula - {{student_name}}

Olá {{contractor_name}},

Obrigado por se matricular na English Patio!

Segue em anexo o contrato de prestação de serviços preenchido com seus dados.

**Dados da Matrícula:**
- Aluno: {{student_name}}
- Responsável: {{contractor_name}}
- Email: {{contractor_email}}
- Telefone: {{contractor_phone}}

Por favor, guarde este contrato para seus registros.

Atenciosamente,
Equipe English Patio
```

4. **IMPORTANTE**: Na seção de **Settings** do template:
   - Marque a opção **Advanced Settings**
   - Adicione um campo de anexo usando esta configuração:

```javascript
// Em "To Email" coloque:
{{to_email}}

// Em "Attachments" adicione:
{
  "filename": "{{pdf_filename}}",
  "content": "{{pdf_attachment}}",
  "encoding": "base64"
}
```

5. Clique em **Save** e anote o **Template ID**

## 4. Obter Public Key

1. Vá em **Account** > **General**
2. Encontre a seção **API Keys**
3. Copie o **Public Key**

## 5. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e preencha com seus dados:
   ```
   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxx
   ```

3. **IMPORTANTE**: Nunca commite o arquivo `.env` no Git (já está no .gitignore)

## 6. Testar a Configuração

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a página de matrícula: `http://localhost:5173/matricula`

3. Preencha o formulário completamente

4. Clique em **Finalizar Matrícula**

5. Verifique se:
   - Você recebeu um email com o contrato em anexo
   - O email `gabriel_teles2010@hotmail.com` também recebeu o contrato

## 7. Limites da Conta Gratuita

- **200 emails por mês** no plano gratuito
- Para mais emails, considere fazer upgrade no EmailJS

## 8. Troubleshooting

### Erro: "Service ID not found"
- Verifique se o Service ID no `.env` está correto
- Certifique-se de que o serviço está ativo no dashboard do EmailJS

### Erro: "Template not found"
- Verifique se o Template ID no `.env` está correto
- Certifique-se de que o template está salvo e publicado

### Emails não estão sendo enviados
- Verifique o console do navegador para erros
- Confirme que as credenciais do EmailJS estão corretas
- Verifique se você não excedeu o limite de 200 emails/mês

### Anexo não está chegando
- Certifique-se de que configurou o campo de anexo no template
- Verifique se o formato do base64 está correto
- O EmailJS tem limite de 500KB por anexo

## 9. Segurança

- **NUNCA** compartilhe suas chaves do EmailJS publicamente
- O arquivo `.env` está no `.gitignore` por motivos de segurança
- Para produção, configure as variáveis de ambiente no seu servidor/host

## 10. Deploy (Vercel/Netlify)

Ao fazer deploy, adicione as variáveis de ambiente no painel do seu hosting:

**Vercel:**
1. Vá em Settings > Environment Variables
2. Adicione cada variável do `.env`

**Netlify:**
1. Vá em Site settings > Environment variables
2. Adicione cada variável do `.env`

---

**Dúvidas?** Entre em contato com o desenvolvedor ou consulte a [documentação oficial do EmailJS](https://www.emailjs.com/docs/).
