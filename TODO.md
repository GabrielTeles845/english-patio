# TODO List - English Patio

## 🎨 Design & UX

### Animações
- [ ] Adicionar animações de entrada para as seções do site
- [ ] Implementar animações de hover nos cards
- [ ] Adicionar transições suaves entre páginas
- [ ] Criar animações para o hero section

### Cards & Layout
- [ ] Melhorar design dos cards em alguma das telas
- [ ] Revisar e aprimorar layout dos testemunhos
- [ ] Otimizar cards de cursos/aulas

### Responsividade
- [ ] Melhorar responsividade geral das telas
- [ ] Testar e ajustar para diferentes tamanhos de tela (mobile, tablet, desktop)
- [ ] Verificar quebras de layout em telas pequenas
- [ ] Otimizar imagens para diferentes resoluções

## 📱 Redes Sociais

### Instagram
- [ ] Implementar seção "Faça parte do Instagram"
- [ ] Adicionar feed do Instagram no site
- [ ] Criar botão de CTA para seguir no Instagram
- [ ] Integrar API do Instagram (se necessário)

### Pinterest
- [ ] Melhorar componentes de Pinterest
- [ ] Adicionar botões de compartilhamento
- [ ] Otimizar imagens para Pinterest

## 📧 Sistema de Email & Armazenamento de Dados

### Envio de Emails
- [ ] Implementar sistema de envio de email para contato
- [ ] Configurar templates de email profissionais
- [ ] Adicionar confirmação de envio para o usuário

### Modal de Confirmação (Formulário)
- [ ] Atualizar modal do formulário de matrícula
- [ ] Adicionar mensagem clara: "O email será enviado para a escola"
- [ ] Mostrar informações do email que será enviado
- [ ] Adicionar cópia do email para o responsável

### Armazenamento e Gestão de Matrículas
- [ ] **Implementar banco de dados para salvar formulários**
  - [ ] Escolher solução de backend (Firebase, Supabase, MongoDB Atlas, etc.)
  - [ ] Criar schema/modelo de dados para matrículas
  - [ ] Implementar API para salvar dados do formulário
  - [ ] Salvar timestamp de cada submissão
  - [ ] Armazenar IP e user agent (para auditoria)
- [ ] **Painel administrativo**
  - [ ] Criar dashboard para visualizar matrículas
  - [ ] Implementar filtros e busca
  - [ ] Adicionar exportação para Excel/CSV
  - [ ] Criar visualização em formato de planilha
  - [ ] Implementar paginação para muitos registros
- [ ] **Integração com Google Sheets (alternativa simples)**
  - [ ] Conectar com Google Sheets API
  - [ ] Salvar cada matrícula como nova linha
  - [ ] Formatar colunas automaticamente
  - [ ] Adicionar validação de dados duplicados
- [ ] **Backup e sincronização**
  - [ ] Salvar dados localmente E no servidor
  - [ ] Implementar fila de retry em caso de falha
  - [ ] Enviar email mesmo se salvar no BD falhar (redundância)
  - [ ] Criar backup automático diário dos dados

## 💾 Cache & Persistência de Dados

### Formulário de Matrícula
- [ ] Implementar cache local (localStorage) para dados do formulário
- [ ] Salvar progresso automaticamente enquanto o usuário preenche
- [ ] Permitir recuperação de dados em caso de fechamento acidental
- [ ] Adicionar botão "Limpar dados salvos"

### PDF Gerado
- [ ] Implementar cache do PDF gerado
- [ ] Permitir visualização do último PDF gerado
- [ ] Adicionar opção de baixar PDF salvo
- [ ] Definir tempo de expiração do cache

## 🔧 Melhorias Técnicas

### Performance & Otimização de Arquivos
- [ ] **Otimizar imagens existentes**
  - [ ] Converter imagens PNG/JPG para WebP
  - [ ] Comprimir imagens sem perda de qualidade (TinyPNG, ImageOptim)
  - [ ] Implementar responsive images com `srcset`
  - [ ] Usar Cloudinary ou similar para CDN e otimização automática
- [ ] **Reduzir tamanho do bundle** (atualmente 803KB - aviso no build)
  - [ ] Implementar code splitting com React.lazy()
  - [ ] Fazer tree-shaking de dependências não utilizadas
  - [ ] Analisar bundle com `npm run build -- --analyze`
  - [ ] Substituir bibliotecas pesadas por alternativas menores
- [ ] **Lazy loading**
  - [ ] Implementar lazy loading para imagens (react-lazyload ou Intersection Observer)
  - [ ] Lazy load de rotas/páginas
  - [ ] Adiar carregamento de componentes não críticos
- [ ] **Otimização de fontes**
  - [ ] Usar `font-display: swap` para evitar FOIT
  - [ ] Fazer subset de fontes (apenas caracteres usados)
  - [ ] Considerar fontes variáveis
- [ ] **Melhorar tempo de carregamento inicial**
  - [ ] Implementar service worker para PWA
  - [ ] Configurar cache headers corretos
  - [ ] Pre-load recursos críticos
  - [ ] Minimizar CSS/JS não utilizado

### SEO & Acessibilidade
- [ ] **Meta tags e Open Graph**
  - [ ] Adicionar meta tags apropriadas (title, description)
  - [ ] Implementar Open Graph para redes sociais
  - [ ] Adicionar Twitter Cards
  - [ ] Configurar favicon completo (múltiplos tamanhos)
- [ ] **Estrutura e indexação**
  - [ ] Implementar sitemap.xml
  - [ ] Criar robots.txt
  - [ ] Adicionar dados estruturados (Schema.org/JSON-LD)
  - [ ] Implementar breadcrumbs
- [ ] **Acessibilidade (a11y)**
  - [ ] Adicionar labels em todos os inputs
  - [ ] Melhorar contraste de cores (WCAG AA)
  - [ ] Implementar navegação por teclado
  - [ ] Adicionar textos alternativos em todas as imagens
  - [ ] Testar com leitor de tela

### Monitoramento & Analytics
- [ ] Configurar Google Analytics ou alternativa
- [ ] Implementar tracking de eventos importantes
- [ ] Configurar Google Search Console
- [ ] Monitorar Core Web Vitals
- [ ] Implementar error tracking (Sentry ou similar)

### Segurança
- [ ] **Proteção contra bots e spam**
  - [ ] Implementar Google reCAPTCHA v3 (invisível)
  - [ ] Adicionar honeypot fields (campos ocultos para detectar bots)
  - [ ] Implementar rate limiting por IP (máx. X submissões por hora)
  - [ ] Adicionar validação de tempo mínimo de preenchimento
  - [ ] Implementar fingerprinting de dispositivo
  - [ ] Criar blacklist de IPs suspeitos
  - [ ] Adicionar verificação de email descartável
- [ ] Adicionar Content Security Policy (CSP)
- [ ] Implementar rate limiting no backend (se houver)
- [ ] Validar e sanitizar todos os inputs no backend
- [ ] Configurar HTTPS corretamente
- [ ] Adicionar proteção CSRF nos formulários

### Testes
- [ ] Adicionar testes unitários (Jest + React Testing Library)
- [ ] Implementar testes de integração
- [ ] Criar testes E2E para fluxos críticos (Playwright/Cypress)
- [ ] Adicionar testes de validação de formulários
- [ ] Implementar CI/CD com testes automatizados

### Qualidade de Código
- [ ] Configurar Prettier para formatação consistente
- [ ] Adicionar Husky para pre-commit hooks
- [ ] Implementar lint-staged
- [ ] Revisar e refatorar código duplicado
- [ ] Adicionar comentários JSDoc nas funções principais
- [ ] Criar guia de estilo de código (CONTRIBUTING.md)

### Backup & Recuperação
- [ ] Implementar backup automático dos dados
- [ ] Criar processo de recuperação de desastres
- [ ] Documentar processo de deploy
- [ ] Versionar ambiente (.env.example)

### Infraestrutura
- [ ] Configurar ambiente de staging
- [ ] Implementar deploy automatizado
- [ ] Configurar monitoramento de uptime
- [ ] Otimizar configuração do servidor/hosting
- [ ] Implementar CDN para assets estáticos

---

## 📝 Notas

- Priorizar itens de acordo com impacto no usuário
- Testar todas as funcionalidades antes de fazer deploy
- Manter documentação atualizada

---

**Última atualização:** 2025-10-09
