# Sistema de Matrícula com Preenchimento Automático de Contrato

## Visão Geral

O sistema de matrícula permite que usuários preencham um formulário online que:
1. Coleta todos os dados necessários do aluno e responsáveis
2. Preenche automaticamente o PDF do contrato
3. Envia o contrato preenchido por email para dois destinatários:
   - Email da escola: `gabriel_teles2010@hotmail.com`
   - Email do usuário informado no formulário

## Arquitetura

### Serviços Criados

#### 1. `src/services/pdfService.ts`
Responsável por manipular o PDF do contrato:
- Carrega o `contrato.pdf` da raiz do projeto
- Usa `pdf-lib` para escrever texto sobre o PDF
- Preenche campos como: nome, endereço, CPF, CEP, telefone, horários, etc.
- Marca checkboxes (formato das aulas, autorização de imagem)
- Retorna o PDF preenchido como `Uint8Array`

**Função principal:** `fillContractPDF(contractData: ContractData)`

#### 2. `src/services/emailService.ts`
Responsável pelo envio de emails:
- Converte o PDF para Base64
- Usa EmailJS para enviar emails com anexo
- Envia para 2 destinatários simultaneamente
- Inclui dados do aluno e responsável no corpo do email

**Função principal:** `sendContractEmails(pdfBytes, emailData, config)`

### Formulário de Matrícula

Localizado em: `src/pages/Enrollment.tsx`

#### Estrutura em 4 Etapas:

**Etapa 1: Dados dos Alunos**
- Nome completo do aluno 1
- Data de nascimento (calcula idade automaticamente)
- Opção de adicionar aluno 2 (irmão/irmã)

**Etapa 2: Dados dos Pais**
- Nome, data de nascimento e telefone da mãe
- Nome, data de nascimento e telefone do pai

**Etapa 3: Dados de Pagamento e Aulas**
- Responsável financeiro: nome, CPF, email
- Endereço completo e CEP
- Forma de pagamento
- **Formato das aulas:**
  - Presencial na sede
  - Presencial no domicílio
- **Dias da semana:**
  - Segunda/Quarta
  - Terça/Quinta
- **Horários** (entre 08h e 20h)

**Etapa 4: Revisão e Confirmação**
- Exibe resumo de todos os dados
- Checkboxes de autorização:
  - Uso de imagem nas redes sociais
  - Aceite dos termos do contrato
- Botão de finalização

### Fluxo de Envio

```
1. Usuário preenche formulário
      ↓
2. Clica em "Finalizar Matrícula"
      ↓
3. Sistema prepara dados do contrato
      ↓
4. pdfService.fillContractPDF() preenche o PDF
      ↓
5. emailService.sendContractEmails() envia emails
      ↓
6. Email 1: gabriel_teles2010@hotmail.com
   Email 2: email do usuário
      ↓
7. Mensagem de sucesso exibida
```

## Campos do Contrato Preenchidos

### Página 1 do PDF:
- **Nome do Contratante** (linha após "CONTRATANTE:")
- **Endereço** (residente e domiciliado à)
- **CEP**
- **CPF**
- **Telefone**

### Página 2 do PDF:
- **Formato das aulas** (checkbox):
  - `( X )` Presencial na sede OU
  - `( X )` Presencial no domicílio
- **Dias e horários**:
  - Segunda/Quarta OU Terça/Quinta (checkbox)
  - Horários de início e término

### Página 4 do PDF:
- **Autorização de uso de imagem** (checkbox)
- **Data de assinatura** (preenchida automaticamente com data atual)

## Configuração

### 1. Dependências Instaladas

```bash
npm install pdf-lib @emailjs/browser
```

### 2. Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
VITE_EMAILJS_SERVICE_ID=seu_service_id
VITE_EMAILJS_TEMPLATE_ID=seu_template_id
VITE_EMAILJS_PUBLIC_KEY=sua_public_key
```

### 3. Setup do EmailJS

Consulte o arquivo `EMAILJS_SETUP.md` para instruções completas de configuração.

## Posicionamento do Texto no PDF

O código usa coordenadas X/Y para posicionar o texto sobre o PDF:
- Origem (0,0) é no **canto inferior esquerdo**
- X aumenta para a direita
- Y aumenta para cima

**Exemplo:**
```typescript
page1.drawText(formData.contractorName, {
  x: 120,   // posição horizontal
  y: 540,   // posição vertical
  size: 10,
  font: font,
  color: textColor,
});
```

### Ajustes Necessários

**IMPORTANTE:** As coordenadas atuais são estimativas. Você precisará testar e ajustar:

1. Abra o PDF preenchido
2. Verifique se o texto está alinhado corretamente
3. Ajuste as coordenadas X/Y em `pdfService.ts`
4. Teste novamente até o alinhamento estar perfeito

**Dica:** Use esta técnica para encontrar coordenadas:
```typescript
// Desenhe marcadores de teste no PDF
page.drawText('X', { x: 100, y: 500 });
page.drawText('X', { x: 200, y: 500 });
// Assim você visualiza onde cada coordenada fica
```

## Testando o Sistema

### Teste Local

1. Configure o EmailJS (veja `EMAILJS_SETUP.md`)
2. Inicie o servidor:
   ```bash
   npm run dev
   ```
3. Acesse: `http://localhost:5173/matricula`
4. Preencha o formulário completo
5. Clique em "Finalizar Matrícula"
6. Verifique:
   - Console do navegador (logs de progresso)
   - Emails recebidos
   - PDF anexado está correto

### Logs de Debug

O sistema exibe logs no console:
```
Preenchendo PDF...
PDF preenchido com sucesso!
Enviando emails...
Email enviado com sucesso para gabriel_teles2010@hotmail.com
Email enviado com sucesso para usuario@email.com
```

## Tratamento de Erros

O sistema possui tratamento robusto de erros:

```typescript
try {
  // Processo de matrícula
} catch (error) {
  console.error('Erro ao processar matrícula:', error);
  alert('❌ Erro ao processar matrícula. Tente novamente.');
} finally {
  setIsSubmitting(false);
}
```

### Possíveis Erros:

1. **PDF não encontrado**: Verifique se `contrato.pdf` está na raiz
2. **Credenciais EmailJS inválidas**: Confira o `.env`
3. **Limite de emails excedido**: Conta gratuita tem 200 emails/mês
4. **Anexo muito grande**: EmailJS limita anexos em 500KB

## Melhorias Futuras

1. **Assinatura Digital**
   - Implementar canvas para assinatura
   - Usar biblioteca `signature_pad`
   - Adicionar assinatura ao PDF

2. **Validação de Campos**
   - Máscara para CPF: `000.000.000-00`
   - Máscara para CEP: `00000-000`
   - Máscara para telefone: `(00) 00000-0000`

3. **Preview do PDF**
   - Permitir visualizar PDF antes de enviar
   - Botão "Baixar Contrato"

4. **Notificações**
   - Substituir `alert()` por toast notifications
   - Biblioteca sugerida: `react-hot-toast`

5. **Banco de Dados**
   - Salvar matrículas em banco de dados
   - Backend com Node.js + MongoDB/PostgreSQL

## Estrutura de Arquivos

```
english-patio/
├── contrato.pdf                    # PDF original do contrato
├── .env                            # Variáveis de ambiente (não commitado)
├── .env.example                    # Template de variáveis
├── EMAILJS_SETUP.md               # Guia de configuração EmailJS
├── CONTRATO_MATRICULA.md          # Esta documentação
├── src/
│   ├── pages/
│   │   └── Enrollment.tsx         # Formulário de matrícula
│   └── services/
│       ├── pdfService.ts          # Serviço de PDF
│       └── emailService.ts        # Serviço de email
└── package.json
```

## Suporte

Em caso de dúvidas:
1. Consulte `EMAILJS_SETUP.md` para problemas com email
2. Verifique o console do navegador para logs de erro
3. Teste com dados fictícios primeiro
4. Ajuste as coordenadas do PDF conforme necessário

---

**Desenvolvido para English Patio** 🎓
