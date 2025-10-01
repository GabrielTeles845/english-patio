# Continuação - Tarefas Detalhadas

### 9.2 Telefone e Horários

**Linha original**:
```
Alterar telefone para o da Stefani 62 3636-7775 com whatsapp
Mudar todos os telefones para o dela
Retirar "Também atendemos via WhatsApp"

Disponível de Segunda à Sexta
das 8:00 às 18:30
```

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Card de Telefone em: `ContactSection.tsx` linha 20-43
- 📍 Telefone atual: (62) 98195-3259
- 📍 Horário atual: "Disponível de Segunda a Sexta das 8:00 às 19:00"
- 📍 Tem texto: "Também atendemos via WhatsApp"

**DETALHAMENTO**:
- ✅ Trocar telefone: (62) 98195-3259 → 62 3636-7775
- ✅ Remover texto: "Também atendemos via WhatsApp"
- ✅ Trocar horário: "das 8:00 às 19:00" → "das 8:00 às 18:30"
- ✅ Atualizar link do WhatsApp para o novo número

**✅ RESPOSTA CONFIRMADA**:
- ✅ Número: **Celular com WhatsApp**
- ✅ Link WhatsApp funciona: `https://wa.me/556236367775`
- ✅ Formato sugerido: **(62) 3636-7775**

---

### 9.3 Horário no Card de Endereço

**Linha original**:
```
Colocar no endereço esse texto com o símbolo de relógio:
Segunda a Sexta
8:00 às 19:00
```

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Card de Endereço em: `ContactSection.tsx` linha 46-64
- 📍 Texto atual: "Horário: Aberto - Fecha às 19:00"

**DETALHAMENTO**:
- ✅ Trocar texto atual por: "Segunda a Sexta\n8:00 às 19:00"
- ✅ Já tem símbolo de relógio no código (linha 58-60)

**✅ RESPOSTA CONFIRMADA**:
- Horário correto: **18:30** (o que está no textos.txt, NÃO o que está no site atual)
- Trocar TODOS os horários do site para: "Segunda a Sexta das 8:00 às 18:30"

---

### 9.4 Card de Email

**Linha original**: "Trocar o instagram para o email"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Card de Email já existe em: `ContactSection.tsx` linha 67-85
- 📍 Email atual: englishpatio@yahoo.com

**✅ DECISÃO CONFIRMADA**:
- ❌ **REMOVER completamente o card de Email** (linha 67-85 ContactSection.tsx)
- ✅ Manter apenas 2 cards: **Telefone** e **Endereço**
- ✅ Email continua disponível no Footer

---

### 9.5 Seção "Oferecemos Flexibilidade"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Seção em: `ContactSection.tsx` linha 89-115
- 📍 Título: "Oferecemos Flexibilidade"
- 📍  2 cards: "Aulas em Nossa Sede" e "Aulas em Casa"

**DETALHAMENTO**:
- ✅ Trocar cor do título de gray-900 para azul (primary)
- ❌ **REMOVER completamente o card "Aulas em Casa"** (linha 103-113)
- ✅ Manter apenas o card "Aulas em Nossa Sede"
- ✅ Ajustar layout para 1 coluna (remover grid de 2 colunas)

---

## 10. FOOTER

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Footer está em: `Footer.tsx`
- 📍 Telefone atual no footer: (62) 98195-3259
- 📍 Email atual: englishpatio@yahoo.com
- 📍 Instagram: @englishpatio

**DETALHAMENTO**:
- ✅ Trocar telefone do footer para: 62 3636-7775 (mesmo do contato)

**OBSERVAÇÃO**: Não vi no textos.txt nenhuma instrução específica para o footer sobre trocar Instagram por Email. Está tudo ok no footer como está?

---

## 11. NAVBAR - ALTERAÇÕES NOS LINKS

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Navbar em: `Navbar.tsx`
- 📍 Links atuais: Início | Nossas Aulas | Foco e Ação | Vacation Classes | Login

**✅ NOVA ORDEM CONFIRMADA**:
1. **Home** (manter - dropdown com seções)
2. **Metodologia** (renomear de "Foco e Ação")
3. **Vacation Classes** (manter)
4. **Infraestrutura** (NOVO - adicionar)
5. **Matrículas** (renomear de "Login")

**MUDANÇAS**:
- ❌ **REMOVER**: "Nossas Aulas"
- ✅ Renomear: "Foco e Ação" → "Metodologia"
- ✅ Adicionar: "Infraestrutura" (novo link)
- ✅ Renomear: "Login" → "Matrículas"

**DECISÕES**:
1. **Link "Metodologia"**:
   - ✅ Usa página de "Foco e Ação" redesenhada (ver seção 13)
   - ✅ Rota: `/metodologia`

2. **Link "Infraestrutura"**:
   - ✅ Vai para **página dedicada** `/infraestrutura`
   - ✅ Home também tem seção resumo (ver seção 2)

3. **Link "Matrículas"**:
   - ✅ **NOVA PÁGINA** no nosso site: `/matriculas`
   - ✅ Design **nosso** (moderno e bonito)
   - ✅ Campos baseados em englishpatio.com.br/matricula
   - ✅ Sistema completo de contrato (ver seção 16)

**RESPOSTA PENDENTE**: Pergunta 2 (Infraestrutura)

---

## 12. BARRA SUPERIOR DO NAVBAR

**Linha original**: "Fazer barra superior sumir quando scrolla pra baixo"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Barra superior em: `Navbar.tsx` linha 199-206
- 📍 Texto atual: "🎉 Matrículas abertas para o segundo semestre de 2025!"

**DETALHAMENTO**:
- ✅ Implementar comportamento: **esconder barra COMPLETAMENTE** ao fazer scroll para baixo
- ✅ Mostrar barra novamente ao fazer scroll para cima
- ✅ **Trocar texto**: "🎉 Matrículas abertas para o segundo semestre de 2025!" → "🎉 Matrículas abertas para o primeiro semestre de 2026!"

---

## 13. PÁGINA FOCO E AÇÃO → METODOLOGIA

**✅ DECISÃO CONFIRMADA**:
- ✅ Renomear: `/foco-e-acao` → `/metodologia`
- ✅ Usar conteúdo de "Foco e Ação" MAS **redesenhar no estilo "carta para os pais"**
- ✅ Texto corrido sem imagens quebrando o fluxo
- ✅ Card destacado: "Quadrado Metodologias Ativas"

**DESIGN NOVO**:
1. Tom de **carta pessoal** para os pais (mais acolhedor)
2. Texto corrido sem quebras
3. **Card/Box destacado** explicando "Metodologias Ativas"
4. Imagens no final ou laterais (sem quebrar leitura)

**ESTRUTURA SUGERIDA**:
```
[Introdução - tom carta]
Prezados pais...

[Texto principal]
Conteúdo de Foco e Ação reescrito

┌─────────────────────────────────┐
│  🎯 Metodologias Ativas         │
│  [Explicação conceito]          │
└─────────────────────────────────┘

[Galeria imagens]
```

**PERGUNTAS**:
- Reescrever texto no tom "carta" ou você passa texto pronto?
- Manter imagens atuais?

**RESPOSTA**: [Aguardando sua resposta]

---

## 14. PÁGINA VACATION CLASSES

**Linha original**: Tem um texto grande no textos.txt explicando Vacation Classes

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Página existe em: `VacationClasses.tsx`

**DETALHAMENTO**:
- ✅ Substituir conteúdo pelo novo texto do textos.txt

**PERGUNTA**:
- Quer que eu substitua TODO o conteúdo atual ou adicionar esse texto ao que já existe?
- As imagens atuais devem ser mantidas?

**RESPOSTA**: [Aguardando sua resposta]

---

## 15. DESIGN E MELHORIAS VISUAIS

### 15.1 Backgrounds Azuis (Alternar Cores)

**OBJETIVO**: Quebrar a monotonia do fundo todo branco, alternando cores de fundo das seções

**DECISÃO CONFIRMADA**:
- ✅ Alternar backgrounds entre **branco** e **azul claro** (tipo #F0F6FF)
- ✅ Criar contraste visual e dar "respirada" no design
- ✅ Deixar site menos "chapado" e mais dinâmico

**SUGESTÃO DE DISTRIBUIÇÃO**:
1. Hero Section → Gradiente atual (manter)
2. **Infraestrutura → Azul claro** 💙
3. Cursos/Níveis → Branco
4. **Feedbacks → Azul claro** 💙
5. Contato → Branco ou gradiente suave
6. Footer → Manter atual

**✅ DECISÃO CONFIRMADA**:
- ✅ Designer tem **liberdade criativa** para backgrounds
- ✅ Usar: Gradientes suaves, azul claro (#F0F6FF), transições
- ✅ Quebrar monotonia do branco
- ✅ Foco: Visual moderno e agradável

**SUGESTÃO A SER IMPLEMENTADA**:
- Hero: Gradiente azul-branco (atual está ok)
- Infraestrutura: Azul claro suave com gradiente
- Cursos/Níveis: Branco com detalhes azuis
- Feedbacks: Gradiente invertido (branco→azul claro)
- Contato: Azul bem claro
- Instagram: Branco
- Footer: Azul escuro (primary) como atual

---

### 15.2 Fotos Novas

**STATUS**: ⏸️ Deixar para o final
- Pasta com 1.9GB de fotos
- Organizar depois das outras alterações

---

### 15.3 Seção de Posts do Instagram

**OBJETIVO**: Mostrar feed automático do Instagram (@englishpatio) sempre atualizado

**DECISÃO**: Feed automático que atualiza sozinho quando tem post novo

**OPÇÕES GRATUITAS**:

✅ **Opção 1 - Elfsight Instagram Feed (MAIS FÁCIL)**:
- Widget gratuito pronto
- Atualiza automaticamente
- Sem código complicado
- Limites: 6 posts na versão gratuita
- Link: https://elfsight.com/instagram-feed-instashow/

✅ **Opção 2 - SnapWidget**:
- Widget HTML simples
- Gratuito até 8 posts
- Atualiza automaticamente
- Link: https://snapwidget.com/

✅ **Opção 3 - Curator.io**:
- Feed agregador gratuito
- Mostra até 25 posts (free)
- Atualização automática
- Link: https://curator.io/

⚠️ **Opção 4 - Instagram Basic Display API**:
- API oficial do Instagram/Meta
- Precisa de app no Meta Developers
- Mais trabalhoso mas totalmente gratuito
- Token precisa ser renovado a cada 60 dias

**RECOMENDAÇÃO**:
- Usar **Elfsight** ou **SnapWidget** (mais simples)
- Mostrar **6-8 posts** mais recentes
- Colocar **antes do Footer** na home page

**✅ RESPOSTA CONFIRMADA**:
- ✅ Usar widget pronto (Elfsight ou SnapWidget)
- ✅ Quantidade: **6 ou 8 posts** (tanto faz)
- ✅ Localização: **Antes do Footer**, depois de Contato
- ✅ **Botão "Ver Mais"**: Leva para https://www.instagram.com/englishpatio/

---

### 15.4 Questões Legais

**STATUS**: 📝 Anotar como TODO (verificar uso imagem Cambridge)

---

## 16. SISTEMA DE MATRÍCULA ONLINE

**OBJETIVO**: Criar sistema completo de matrícula online para substituir/melhorar o atual (https://englishpatio.com.br/matricula)

**FUNCIONALIDADES NECESSÁRIAS**:

✅ **Formulário de Matrícula** (baseado na imagem a.jpg):
- **Dados do Aluno 1:**
  - Nome completo
  - Data de nascimento
  - Idade (calcular automaticamente)

- **Dados do Aluno 2** (opcional - irmão):
  - Nome completo
  - Data de nascimento
  - Idade (calcular automaticamente)

- **Dados da Mãe:**
  - Nome completo
  - Data de nascimento
  - Telefone

- **Dados do Pai:**
  - Nome completo
  - Data de nascimento
  - Telefone

- **Dados do Pagamento:**
  - Nome do responsável financeiro
  - CPF
  - Endereço completo
  - CEP
  - E-mail
  - Forma de pagamento (dropdown: Pix, Boleto, Cartão, etc)

- **Autorizações:**
  - [ ] Checkbox: "Eu autorizo a escola a publicar e veicular vídeos ou fotos do aluno nas redes sociais da mesma, enquanto durar este contrato."
  - [ ] Checkbox: "Declaro que li e aceito os termos do contrato."

**FLUXO DO SISTEMA**:

1. **Pais preenchem formulário** com validação de campos
2. **Visualizar contrato** formatado com os dados preenchidos
3. **Assinar digitalmente** (campo para assinatura ou upload)
4. **Baixar PDF** do contrato assinado
5. **Enviar email automático** para englishpatio@yahoo.com com:
   - Todos os dados preenchidos formatados
   - Contrato em PDF anexado
   - Data e hora da matrícula

**SOLUÇÃO GRATUITA SEM BACKEND**:

✅ **Opção Escolhida - EmailJS + jsPDF**:
- Nova página: `/matriculas`
- Design moderno (nosso)
- Campos baseados em englishpatio.com.br/matricula
- Envio de email via EmailJS (200/mês grátis)
- PDF gerado com jsPDF
- Canvas para assinatura digital

**DECISÃO CONFIRMADA**:
- ✅ **NOVA PÁGINA** `/matriculas` no site
- ✅ Design **nosso** (bonito e moderno, não copiar o atual)
- ✅ **SEM backend**
- ✅ **Ferramentas gratuitas** apenas
- ✅ **Não salvar dados** (só enviar por email)
- ✅ **Prioridade**: Deixar para **DEPOIS** das outras alterações

**FLUXO COMPLETO**:
1. Usuário preenche formulário na `/matriculas`
2. Visualiza contrato com dados preenchidos
3. Assina digitalmente (canvas)
4. Baixa PDF do contrato assinado
5. Email automático enviado para englishpatio@yahoo.com com:
   - Dados formatados
   - PDF anexado
   - Data/hora da matrícula

**STATUS**: ⏸️ Implementar **DEPOIS** de todas as outras alterações do site

---

## ✅ RESUMO FINAL

**TUDO DO textos.txt FOI DOCUMENTADO!** 🎉

Total de seções: **17 seções principais**

**Próximos passos**:
Responda as perguntas pendentes e podemos começar a implementar! 😊
