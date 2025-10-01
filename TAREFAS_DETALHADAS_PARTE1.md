# Tarefas Detalhadas - English Patio Website

Este arquivo contém todas as alterações solicitadas para o site, organizadas e detalhadas.

---

## ⚠️ REQUISITO CRÍTICO - MOBILE FIRST

**📱 PRIORIDADE MÁXIMA: MOBILE**
- ✅ Site deve ser **100% responsivo**
- ✅ Foco principal: **Mobile** (maioria dos usuários)
- ✅ Testar TUDO no mobile primeiro
- ✅ Design mobile-first (depois adapta para desktop)
- ✅ Touch-friendly (botões grandes, espaçamento adequado)
- ✅ Performance otimizada para mobile (imagens leves, lazy loading)

---

## 1. ALTERAÇÕES DE TEXTOS E CONTEÚDO

### 1.1 Hero Section (Seção Principal)

**Linha original**: "trocar texto: Aprenda inglês de forma divertida! por Ingles com confiança e naturalidade!"

**DETALHAMENTO**:
- ✅ Texto atual: "Aprenda inglês de forma divertida!"
- ✅ Novo texto: "Inglês com confiança e naturalidade!"
- ✅ Estilização (2 linhas):
  - **Linha 1**: "Inglês com" → Azul (primary)
  - **Linha 2**: "confiança e naturalidade!" → "confiança" (amarelo/secondary), "**e**" (azul/primary), "naturalidade!" (amarelo/secondary)

---

### 1.2 Texto "Sobre Nós" / Descrição da Escola

**Linha original**:
```
Trocar
Na English Patio, seu filho aprende inglês naturalmente através de
dinâmicas e atividades interativas, com professores especializados em ensino infantil.

para esse
Na English Patio, seu filho aprende inglês de forma natural por meio de dinâmicas e atividades interativas,
conduzidas por professores treinados em Metodologias Ativas.

Nossas turmas reduzidas garantem atenção individualizada e personalização do aprendizado, respeitando o ritmo de cada aluno.
```

**DETALHAMENTO**:
- ✅ Localização: Logo abaixo do título principal na primeira página (Hero Section)
- ✅ Formato: 2 parágrafos sequenciais, parte do mesmo texto
- ✅ Estilização: Manter formatação padrão, sem destaques especiais
- ✅ Novo texto completo:
  - Parágrafo 1: "Na English Patio, seu filho aprende inglês de forma natural por meio de dinâmicas e atividades interativas, conduzidas por professores treinados em Metodologias Ativas."
  - Parágrafo 2: "Nossas turmas reduzidas garantem atenção individualizada e personalização do aprendizado, respeitando o ritmo de cada aluno."

---

### 1.3 Botões de Ação

**Linha original**: "Trocar aula experimental para fale conosco e adicionar botao de whatsapp flutuante"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Botão "Aula Experimental" está em: `HeroSection.tsx` linha 52
- 📍 Atualmente é um botão primário que leva para `#contact`
- 📍 Há também um botão secundário "Conheça Nossos Cursos" que leva para `#courses`

**DETALHAMENTO**:
- ✅ Botão "Aula Experimental" → mudar texto para "Fale Conosco"
- ✅ Manter o link para #contact
- ✅ **Botão flutuante do WhatsApp**:
  - ✅ Fixo no canto inferior direito (acompanha scroll)
  - ✅ Número: 62 3636-7775 (Stefani)
  - ✅ Tooltip "Fale Conosco" ao passar o mouse
  - ✅ Cor: Verde WhatsApp padrão (#25D366)

---

### 1.4 Seção de Cursos - Título

**Linha original**: "Trocar Conheça Nossos Cursos para Conheca nosso curso"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Botão "Conheça Nossos Cursos" em: `HeroSection.tsx` linha 59
- 📍 Este é um botão secundário na Hero Section

**DETALHAMENTO**:
- ✅ Trocar texto de "Conheça Nossos Cursos" para "Conheça Nosso Curso" (singular)
- ✅ Manter o link para #courses
- ✅ Manter estilo de botão secundário

---

### 1.5 Cards de Features na Hero Section

**Linha original**:
```
os 4 cards vao ficar assim:

Aulas 100% em inglês
Imersão total no idioma desde a primeira aula

Turmas reduzidas
Até 6 alunos por turma para atendimento personalizado

Metodologia ativa
Práticas interativas que priorizam a conversação.

Espaço que Inspira
Infraestrutura que integra conforto, funcionalidade e foco no aprendizado.
```

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Cards estão em: `HeroSection.tsx` linhas 3-20
- 📍 Atualmente tem 4 cards: "Aulas 100% em inglês", "Turmas reduzidas", "Metodologia ativa", "Fun Space"

**DETALHAMENTO**:
- ✅ Card 1: "Aulas 100% em inglês" - MANTER título, TROCAR descrição
  - Nova descrição: "Imersão total no idioma desde a primeira aula"
  - Atual: "Imersão total no idioma desde a primeira aula" (já está correto!)

- ✅ Card 2: "Turmas reduzidas" - MANTER título, TROCAR descrição
  - Nova descrição: "Até 6 alunos por turma para atendimento personalizado"
  - Atual: "Até 6 alunos por turma para atendimento personalizado" (já está correto!)

- ✅ Card 3: "Metodologia ativa" - MANTER título, TROCAR descrição
  - Nova descrição: "Práticas interativas que priorizam a conversação."
  - Atual: "Aprendizado através de jogos e atividades práticas"

- ✅ Card 4: "Fun Space" → TROCAR TUDO
  - Novo título: "Espaço que Inspira"
  - Nova descrição: "Infraestrutura que integra conforto, funcionalidade e foco no aprendizado."
  - Atual título: "Fun Space"
  - Atual descrição: "Ambiente especialmente projetado para crianças"

**ESTILIZAÇÃO GLOBAL - FONT HEADING (Fredoka One)**:
- ✅ Aumentar **letter-spacing** de TODA a fonte `font-heading` (Fredoka One)
- ✅ Aplicar no CSS global em `index.css` ou `tailwind.config.js`
- ✅ Afeta TODOS os títulos que usam essa fonte:
  - Títulos dos 4 cards da Hero Section
  - "Nossos Níveis"
  - "Contato"
  - "Depoimentos" (será "Feedbacks")
  - "Flexibilidade para sua Família"
  - Todos os h1, h2, h3, etc que usam `font-heading`
- ✅ **CONFIRMADO**: adicionar `letter-spacing: 0.025em` (leve) na classe `.font-heading`

---

## 2. SEÇÃO "SOBRE NÓS" → SUBSTITUIR POR "INFRAESTRUTURA"

**✅ DECISÃO CONFIRMADA**:
- ❌ **REMOVER** seção "Sobre Nós" atual
- ✅ **SUBSTITUIR** por seção "Infraestrutura" (resumo/preview)
- ✅ **CRIAR** página dedicada `/infraestrutura` (completa com galeria)

**ESTRUTURA DUPLA**:

### 2.1 Seção na Home (Resumo)
- 📍 Arquivo: `AboutSection.tsx` (reescrever completamente)
- 📍 Posição: Entre Hero Section e Cursos
- 📍 Conteúdo: **Resumo criativo** da infraestrutura
- 📍 **LIBERDADE CRIATIVA** para escolher melhor design:
  - Opção A: Carrossel automático de imagens + texto resumido
  - Opção B: 3 cards destacando principais pontos (Fun Space, Pátio, Salas)
  - Opção C: Outro layout moderno que funcione bem
- 📍 Fotos: Carrossel lateral automático OU cards com imagens
- 📍 **OBRIGATÓRIO**: Botão "Conheça Nossa Infraestrutura" → link para `/infraestrutura`
- 📍 Texto: Improvisar resumo atrativo baseado no conteúdo completo abaixo

### 2.2 Página Dedicada (Completa)
- 📍 Nova página: `/infraestrutura`
- 📍 Conteúdo: Textos completos + galeria de fotos
- 📍 Layout: Grid de fotos, seções interativas, tour virtual (criativo!)

**CONTEÚDO DA SEÇÃO HOME (Resumo)**:

**Título:** "🏫 Infraestrutura que Estimula o Aprendizado"

**Subtítulo/Intro:**
"A English Patio oferece um ambiente cuidadosamente planejado para promover o aprendizado com conforto, criatividade e acolhimento. Cada espaço da escola foi pensado para estimular o desenvolvimento de crianças e adolescentes de forma leve e eficaz."

**Parágrafo 1:**
"A escola conta com mais de 10 salas de aula, todas com layout interativo, utilizando mesas redondas que favorecem a troca entre os alunos. As salas também possuem estantes com livros literários, decoração lúdica, climatização, e computadores disponíveis para atividades orientadas pelos professores."

**Parágrafo 2:**
"Os ambientes da escola são decorados com murais artísticos e elementos visuais que remetem à cultura de países de língua inglesa, criando uma atmosfera temática que contribui para a imersão no idioma desde o primeiro contato."

**Destaques (3 cards):**

🟡 **Fun Space**
"Sala multiuso equipada com karaokê, cozinha e palco, onde os alunos são incentivados a atuar em apresentações e dramatizações em inglês."

🟢 **Pátio Amplo**
"Espaço planejado para promover o convívio e o bem-estar dos alunos, com bancos, música ambiente, cesta de basquete e um pergolado com mesas que acolhem momentos de lanche, atividades artísticas e os responsáveis durante o período de espera."

🧑‍🏫 **Equipe Solícita**
"Profissionais sempre presentes e acessíveis para orientar e acompanhar alunos, pais e responsáveis com atenção e cuidado."

---

## 4. SEÇÃO DE NÍVEIS (LEVELS)

**Linha original**: "Trocar parte de levels, para mostrar os itens de cima pra baixo"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Seção de Níveis está em: `CoursesSection.tsx` e também existe `LevelsSection.tsx`
- 📍 Atualmente mostra em grid 2x2 (lado a lado)

**DETALHAMENTO**:
- ✅ Alterar layout para mostrar níveis de cima para baixo (vertical, um abaixo do outro)
- ✅ Novos textos para cada grupo:

**🟨 Fun Conversation** (INICIANTES)
- Novo texto: "Primeiros contatos com o inglês, em uma abordagem totalmente lúdica, com jogos, músicas e atividades interativas."

**🟦 Conversation Series** (INICIANTES+)
- Novo texto: "Desenvolvimento da escuta e da fala, com introdução gradual à leitura em inglês. Ideal para alunos que estão começando a formar frases e reconhecer palavras no idioma."

**🟩 Power Track** (INTERMEDIÁRIO)
- Novo texto: "Módulos que desenvolvem as quatro habilidades essenciais — listening, speaking, reading e writing — com início das avaliações orais e escritas."

**🟪 Sprint Fluency** (AVANÇADO)
- Novo texto: "Desafios práticos com foco em fluência, interpretação de texto, produção escrita e expressão espontânea. Aprofunda estruturas gramaticais e dá início à preparação para os exames Cambridge."

**CORES DOS NÍVEIS** (você especificou cores diferentes):

**Fun Conversation:**
- Cor: Verde (qual tom de verde? Verde escuro, médio?)

**Conversation Series:**
- Conversation 1: Verde mais escuro
- Conversation 2: (não especificou cor)

**Power Track:**
- Power 1: Laranja
- Power 2: Verde
- Power 3: Amarelo
- Power 4: Vermelho
- Power 5: Lilás
- Power 6: Azul claro tipo turquesa

**Sprint Fluency:**
- Sprint 1: Laranja
- Sprint 2: Verde
- Sprint 3: Lilás
- Sprint 4: Azul

**✅ RESPOSTA CONFIRMADA**:

**Three House** (3 níveis):
- Three House 1 → Verde
- Three House 2 → Laranja
- Three House 3 → Lilás

**Conversation 2** → Cinza (cor indefinida)

**Power** (2 níveis):
- Power 5 → Lilás
- Power 6 → Azul claro turquesa

**AÇÃO**: Atualizar cores apenas desses níveis específicos, manter outros níveis como estão

---

## 5. CAMBRIDGE PREPARATION

**Linha original**:
```
no cambridge
retirar esses abaixo
CAE
CPE

e colocar o texto:
Alunos dos níveis Sprint iniciam a preparação para exames Cambridge em encontros mensais, realizados como atividade complementar ao curso regular.
```

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Seção Cambridge está em: `CoursesSection.tsx` linha 223-246
- 📍 Atualmente mostra: KET, PET, FCE, CAE, CPE

**DETALHAMENTO**:
- ✅ Remover: CAE e CPE (linha 130-131 em CoursesSection.tsx)
- ✅ Manter: KET, PET, FCE
- ✅ Adicionar texto explicativo **ABAIXO dos botões**: "Alunos dos níveis Sprint iniciam a preparação para exames Cambridge em encontros mensais, realizados como atividade complementar ao curso regular."
- ✅ **QUESTÃO LEGAL**: Trocar logo `/assets/cambridge-compact.png` (linha 230) por texto simples "Cambridge Preparation" para evitar problemas de copyright
- ✅ Ou verificar se tem autorização para usar logo oficial Cambridge

**DECISÃO DE DESIGN**:
- Texto explicativo vai **abaixo dos botões KET/PET/FCE** (melhor posição para contexto)
- Fica antes do link "Agende um teste de nível"

---

## 6. LINK "AGENDE UMA AVALIAÇÃO DE NÍVEL"

**Linha original**: "Mudar texto: Agende uma avaliação de nível para Agende um teste de nivel"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Link está em: `CoursesSection.tsx` linha 253

**DETALHAMENTO**:
- ✅ Trocar: "Agende uma avaliação de nível" → "Agende um teste de nível"

---

## 7. SEÇÃO DE DEPOIMENTOS → FEEDBACKS

**✅ DECISÃO CONFIRMADA**:
- ✅ Trocar "Depoimentos" para "Feedbacks"
- ✅ Remover textos: "Veja o que os pais estão dizendo" e descrição
- ✅ **REDESIGN COMPLETO** - layout atual não está bom
- ✅ Muitos feedbacks novos virão (fotos)

**LOCALIZAÇÃO ATUAL**:
- 📍 Seção em: `TestimonialsSection.tsx`
- 📍 Layout atual: Carrossel simples com imagens
- ❌ Problema: Layout básico, pouco atrativo

**NOVO DESIGN SUGERIDO** (escolher depois):

**Opção 1 - Grid Masonry**:
- Grid tipo Pinterest (tamanhos variados)
- Hover mostra zoom suave
- Click abre lightbox para ver melhor
- Animação de entrada suave

**Opção 2 - Carrossel com Cards**:
- Cards bonitos com sombra/hover
- Múltiplos feedbacks visíveis (2-3 por vez)
- Auto-play suave
- Indicadores elegantes

**Opção 3 - Grade com Filtros**:
- Todos visíveis em grade
- Filtros: "Todos", "Pais", "Alunos"
- Click para ampliar
- Lazy loading

**Opção 4 - Slider Vertical Infinito**:
- 2 colunas verticais
- Scroll infinito automático
- Hover pausa
- Click amplia

**FUNCIONALIDADES CONFIRMADAS**:
- ✅ **Mobile**: Zoom ao **clicar** na imagem (abre lightbox/modal)
- ✅ **Desktop**: Zoom ao **passar mouse** (hover effect)
- ✅ Lightbox com navegação entre feedbacks (setas, swipe)
- ✅ Design moderno e atraente
- ✅ 100% responsivo (mobile-first)
- ✅ Animações suaves

**📱 TIPO DE IMAGEM**: Prints de celular (screenshots)

**OPÇÕES DE DESIGN**:

**Opção A - COM moldura iPhone** (MAIS MODERNO) ⭐ RECOMENDADO
- Você adiciona moldura iPhone 16 Pro Max nas fotos
- Eu coloco em grid/carrossel moderno
- ✅ Vantagens:
  - Visual profissional e moderno
  - Contexto claro (feedback do WhatsApp/Instagram)
  - Fica incrível em carrossel 3D
  - Efeito "flutuante" com sombra
- ❌ Desvantagem: Trabalho manual de adicionar moldura

**Opção B - SEM moldura, com CSS** (MAIS RÁPIDO)
- Prints puros sem moldura
- CSS adiciona borda arredondada + sombra
- Simulação de celular via CSS
- ✅ Vantagens:
  - Mais rápido (sem edição)
  - Flexível (muda CSS quando quiser)
- ❌ Desvantagem: Menos realista

**Opção C - Moldura via CSS/Overlay** (INTERMEDIÁRIO)
- Prints puros
- CSS coloca overlay de moldura iPhone por cima
- ✅ Vantagens:
  - Efeito profissional
  - Sem edição manual
  - Fácil trocar modelo do celular

**MINHA RECOMENDAÇÃO**:
**Opção C** (moldura via CSS) é o melhor dos dois mundos!
Você só manda os prints puros e eu adiciono a moldura automaticamente via código.

**LAYOUT SUGERIDO COM PRINTS**:
- Carrossel 3D com celulares "flutuando"
- Grid tipo "galeria de celulares"
- Slider vertical com efeito parallax
- Cards com perspectiva 3D

**✅ DECISÃO CONFIRMADA**: **Opção C** (moldura via CSS/Overlay)
- Você envia prints puros (screenshots limpos)
- CSS adiciona moldura iPhone automaticamente
- Layout: Carrossel 3D ou grid com efeito flutuante

---



## 8. BADGE FLUTUANTE NA HERO SECTION

**Linha original**: "Retirar texto: Mais de 500 alunos já aprenderam conosco! e mudar para 'Aulas em Casa disponíveis na região dos setores Bueno e Marista'"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Badge está em: `HeroSection.tsx` linha 109-111
- 📍 Texto atual: "Mais de 500 alunos já aprenderam conosco!"

**DETALHAMENTO**:
- ✅ Remover texto atual
- ✅ Novo texto: "Aulas em Casa disponíveis na região dos setores Bueno e Marista"

---

## 9. SEÇÃO DE CONTATO

### 9.1 Título da Seção

**Linha original**: "Retirar contato, e mudar cor do fale conosco abaixo. Adicionar símbolo de whatsapp"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Seção está em: `ContactSection.tsx`
- 📍 Título atual: "Contato" (linha 8)
- 📍 Subtítulo: "Fale Conosco" (linha 10)

**DETALHAMENTO**:
- ✅ Remover o título "Contato" (pequeno, uppercase)
- ✅ Manter "Fale Conosco" como título principal
- ❓ Mudar cor do "Fale Conosco" - Para qual cor? Azul (primary)?

**PERGUNTA**:
- Qual cor deve ser o título "Fale Conosco"? Azul primary (#1E3765)?
- Sobre "adicionar símbolo de whatsapp" - onde exatamente? No título ou nos cards de contato?

**RESPOSTA**: [Aguardando sua resposta]


### 9.2 Telefone e Horários

**Linha original**:
```
Alterar telefone para o da Stefani 62 3636-7775 com whatsapp
Mudar todos os telefones para o dela
Retirar "Também atendemos via WhatsApp"
Disponível de Segunda à Sexta das 8:00 às 18:30
```

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Card de Telefone em: `ContactSection.tsx` linha 20-43
- 📍 Telefone atual: (62) 98195-3259
- 📍 Horário atual: "Disponível de Segunda a Sexta das 8:00 às 19:00"

**DETALHAMENTO**:
- ✅ Trocar telefone: (62) 98195-3259 → 62 3636-7775
- ✅ Remover texto: "Também atendemos via WhatsApp"
- ✅ Trocar horário: "das 8:00 às 19:00" → "das 8:00 às 18:30"
- ✅ Atualizar link do WhatsApp para o novo número

**PERGUNTA**:
- O número 62 3636-7775 é fixo ou celular? Para o link do WhatsApp preciso saber
- Formato: mostrar como "(62) 3636-7775" ou "62 3636-7775"?

**RESPOSTA**: [Aguardando sua resposta]

---

### 9.3 Horário no Card de Endereço

**Linha original**: "Colocar no endereço esse texto com o símbolo de relógio: Segunda a Sexta 8:00 às 19:00"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Card de Endereço em: `ContactSection.tsx` linha 46-64
- 📍 Texto atual: "Horário: Aberto - Fecha às 19:00"

**DETALHAMENTO**:
- ✅ Trocar por: "Segunda a Sexta 8:00 às 19:00"
- ✅ Já tem símbolo de relógio

**OBSERVAÇÃO**: ⚠️ DIVERGÊNCIA! No telefone é 18:30, no endereço é 19:00. Qual correto?

**PERGUNTA**:
- Horário correto: 18:30 ou 19:00?

**RESPOSTA**: [Aguardando sua resposta]

---

### 9.4 Seção "Oferecemos Flexibilidade"

**Linha original**: "mudar cor do texto Oferecemos Flexibilidade para azul"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Título em: `ContactSection.tsx` linha 90

**DETALHAMENTO**:
- ✅ Trocar cor de gray-900 para azul (primary)

---

## 10. FOOTER

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Footer em: `Footer.tsx`
- 📍 Telefone atual: (62) 98195-3259
- 📍 Email: englishpatio@yahoo.com
- 📍 Instagram: @englishpatio

**DETALHAMENTO**:
- ✅ Trocar telefone para: 62 3636-7775

---

## 11. NAVBAR - ALTERAÇÕES NOS LINKS

**Linha original**: "Home Metodologia (no lugar de foco e acao) Vacation Classes Infraestrutura Matrículas (no lugar de login)"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Navbar em: `Navbar.tsx`
- 📍 Links atuais: Início | Nossas Aulas | Foco e Ação | Vacation Classes | Login

**DETALHAMENTO**:
- ✅ "Foco e Ação" → "Metodologia"
- ✅ "Login" → "Matrículas"
- ✅ Adicionar novo link: "Infraestrutura"

**PERGUNTA**:
- A página "Metodologia" usa mesmo conteúdo de "Foco e Ação" ou é diferente?
- Link "Infraestrutura": nova página ou seção na home (#infraestrutura)?
- Link "Matrículas": vai para https://englishpatio.com.br/matricula ?

**RESPOSTA**: [Aguardando sua resposta]

---

## 12. BARRA SUPERIOR DO NAVBAR

**Linha original**: "Fazer barra superior sumir quando scrolla pra baixo"

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Barra em: `Navbar.tsx` linha 199-206
- 📍 Texto: "🎉 Matrículas abertas para o segundo semestre de 2025!"

**DETALHAMENTO**:
- ✅ Esconder barra ao fazer scroll para baixo
- ✅ Mostrar ao fazer scroll para cima

**PERGUNTA**:
- Texto da barra está correto?

**RESPOSTA**: [Aguardando sua resposta]

---

## 13. PÁGINA FOCO E AÇÃO → METODOLOGIA

**Linha original**: "Foco e acao vai mudar pra metodologia. Utilizar o texto inteiro sem quebrar com as imagens. Como se fosse uma carta pro pai"

**PERGUNTA**:
- Redesenhar completamente no estilo "carta para os pais"?
- Usar o texto do textos.txt?
- Manter imagens atuais?
- "Quadrado metodologias ativas" = card destacado?

**RESPOSTA**: [Aguardando sua resposta]

---

## 14. PÁGINA VACATION CLASSES

**Linha original**: Texto grande no textos.txt

**LOCALIZAÇÃO ENCONTRADA**:
- 📍 Página: `VacationClasses.tsx`

**DETALHAMENTO**:
- ✅ Substituir conteúdo pelo texto do textos.txt

**PERGUNTA**:
- Substituir TUDO ou adicionar ao existente?
- Manter imagens atuais?

**RESPOSTA**: [Aguardando sua resposta]

---

## 15. IMAGENS E DESIGN

**Linhas no textos.txt**:
- "alterar fotos para as novas"
- "Colocar uns backgrounds azuis"
- "Incluir seção de posts do instagram"

**PERGUNTAS**:
- Fotos novas: você vai enviar ou já tem?
- Backgrounds azuis: em quais seções?
- Posts do Instagram: onde (footer/home)?

**RESPOSTA**: [Aguardando sua resposta]

---

## 16. SISTEMA DE MATRÍCULA ONLINE

**Linha original**: "https://englishpatio.com.br/matricula - assinar contrato online"

**PERGUNTA**:
- Funcionalidade nova para desenvolver?
- Precisa backend?
- Prioridade/prazo?

**RESPOSTA**: [Aguardando sua resposta]

---

✅ **DOCUMENTO COMPLETO!**

Todas as linhas do textos.txt foram documentadas! 🎉

Agora é só você ir respondendo as perguntas marcadas com [Aguardando sua resposta]
