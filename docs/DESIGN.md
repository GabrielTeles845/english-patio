# Design System — Dashboard English Patio

Criado em **09/Jun/2026** a partir do preview aprovado (`public/dashboard.html`) e dos 47
prints (`scripts/dashboard-prints.mjs` → `/tmp/dashboard-prints/`). É a **lei visual**: a
implementação React tem que ficar **idêntica** (decisão `DASHBOARD_PLAN.md §10`). Os tokens
abaixo são os do CSS do preview — portar 1:1 (Tailwind + os controles do preview), **não**
substituir pelos defaults do shadcn.

> Escopo: a **dashboard administrativa**. O site institucional tem outra identidade
> (fontes Comic Neue/Fredoka One; ver `tailwind.config.js`). Não misturar.

---

## 1. Princípios

1. **Nada de controle HTML cru.** Sem `<select>`, checkbox nativa, `title=`, date input
   nativo, `alert/confirm`. Tudo componentizado (cselect, `.ck`, tooltip global, datepicker,
   toasts, modais próprios).
2. **Clareza acima de enfeite.** Muito branco/respiro, cantos arredondados, sombra suave,
   cor usada com propósito (status, famílias de nível), não decoração.
3. **Acolhedor mas profissional.** Linguagem neutra (sem flexão de gênero, sem
   "bem-vinda"), mínimo de emoji. É ferramenta de trabalho de uma escola infantil.
4. **Consistência de estado.** Toda tela tem skeleton, empty e erro — o caminho feliz não é
   o único estado desenhado.
5. **Tema é do usuário.** Claro/escuro + 3 sidebars, persistidos; o conteúdo nunca muda de
   layout entre temas, só de cor.

---

## 2. Cores

### 2.1 Tokens de superfície (CSS vars — claro / escuro)
| Token | Claro | Escuro |
|---|---|---|
| `--bg` (fundo) | `#F8F9FA` | `#0B1220` |
| `--card` (superfície) | `#FFFFFF` | `#101b30` |
| `--text` | `#16233f` | `#E8EEF7` |
| `--muted` | `#64748B` | `#93a2bd` |
| `--border` | `#E7ECF3` | `#1d2c47` |
| `--hover` | `#F3F6FB` | `#16223a` |
| `--ring` (foco) | `#2F539A` | `#F5B700` |
| `--acc` / `--acc-text` (acento global) | `#F5B700` / `#15294d` | idem |

Superfície padrão = `.surface` (`background:var(--card); border:1px solid var(--border)`).
O **acento global `--acc`** acompanha o tema da sidebar: no tema **amarelo** vira navy
(`--acc:#1E3765`) pra manter contraste.

### 2.2 Marca
- **Navy:** `#1E3765` (primária) · `#15294d` (escura, texto sobre amarelo) · `#2F539A` (clara/links/ring).
- **Amarelo (accent):** `#F5B700` · `#FFE17A` (claro). Texto sobre amarelo = **navy `#15294d`** (nunca branco).
- **Gradiente primário:** `linear-gradient(135deg,#1E3765,#2F539A)` (botões primários, pills ativas).

### 2.3 Cores semânticas — status de contrato (caminho feliz + precisa de ação)
| Status | Rótulo | Cor | Fundo (badge) |
|---|---|---|---|
| `pending` | Pendente | `#B5860B` | `rgba(245,183,0,.16)` |
| `sent` | Enviado | `#2F539A` | `rgba(47,83,154,.12)` |
| `viewed` | Visualizado | `#7C3AED` | `rgba(124,58,237,.12)` |
| `signed` | Assinado | `#16a34a` | `rgba(22,163,74,.12)` |
| `rejected` | Recusado | `#DC2626` | `rgba(220,38,38,.12)` |
| `failed` | Falha no envio | `#EA580C` | `rgba(234,88,12,.12)` |

`rejected`/`failed` são o balde **"precisa de ação"** (vermelho/laranja), fora do caminho
feliz. Alerta de "parado há N dias" = `#DC2626`. Verde de sucesso = `#16a34a`;
WhatsApp = `#25D366`.

### 2.4 Cores das famílias de nível (Agenda/analytics)
`fun` `#E8861B` (laranja) · `conv` `#E0457B` (rosa) · `power` `#2F539A` (azul) ·
`sprint` `#7C3AED` (roxo). A cor da turma na grade vem da família do nível.

### 2.5 Cores das salas
13 salas, cada uma com a cor do próprio nome em tom suave (Green `#7CB342`, Blue `#4A7FD4`,
Peach `#F2997A`, Purple `#8E5AC8`, Mint `#4DB89E`, …). **Nunca saturado/chapado.**

---

## 3. Tipografia
- **Títulos** (`h1–h3`, `.font-heading`): **Fredoka** — arredondada, amigável.
- **Corpo/UI:** **Inter** (`system-ui` fallback).
- Escala observada: KPI numbers grandes e bold; títulos de seção `.font-heading` semibold;
  labels `text-sm`/`text-xs`; metadados em `--muted` `text-xs`/`text-[11px]`.

---

## 4. Forma, sombra, espaço
- **Raios:** input/botão/cselect `12px` · card/modal/surface `16px` (`rounded-2xl` ~24px nos
  cards maiores) · checkbox `6px` · pills e badges `999px` (full) · avatar `xl`.
- **Pin de comentário:** `border-radius:50% 50% 50% 4px` (gota).
- **Sombras:** sidebar `6px 0 24px rgba(7,15,34,.22)` (separa do conteúdo) · tooltip
  `0 8px 20px rgba(0,0,0,.28)` · modal forte · cards com borda fina, sombra mínima.
- **Espaço:** main `p-4 sm:p-6 lg:p-8`; gaps de grid generosos; muito respiro entre seções.
- **Scrollbars discretas:** `scrollbar-width:thin`, thumb `var(--border)`.

---

## 5. Temas (claro/escuro × 3 sidebars)
Aplicados por `html.dark` e `html[data-sidebar="blue|white|yellow"]`. **6 combinações.**

- **Azul** (padrão): sidebar navy (`#1E3765`→`#15294d`), texto claro, item ativo com barra amarela.
- **Branca:** sidebar `#ffffff`→`#fbfcfe`, texto navy, ativo `#e9f0fa`.
- **Amarela (pastel):** sidebar `#FFF6DB`→`#FFEBB5`, texto `#6e5a1c`, **item ativo navy** —
  **amarelo pastel, nunca saturado**.
- Cada uma tem variante escura. A sidebar sempre tem **borda + sombra** separando do conteúdo.
- **Dark mode:** transição **circular a partir do clique** (View Transitions API,
  `circle(...) at x y`, ~520ms). Não usar Framer pra isso.

---

## 6. Layout & navegação
- **Sidebar fixa:** logo + "Dashboard"; nav em 3 grupos (**Principal** · **Conteúdo** ·
  **Administração**); rodapé com 3 theme dots + toggle claro/escuro e avatar+papel+logout.
- **Topbar:** título da tela + data; pill **"Preview · dados fictícios"** (só no preview);
  sino de notificações (Diretor/Secretaria).
- **Main:** uma `[data-view]` por tela (`.view-active`).
- **Responsivo (`<768px`):** a **tabela vira cards** (`#tableBody > div` = card radius 16px),
  filtros vêm **colapsados**, sidebar vira drawer. Botão "Comentar" flutua (FAB).
- **RBAC visual:** itens fora do papel ficam `hidden`; faixa **"Ver painel como…"** quando
  não-Diretor. (O servidor é a autoridade real — `DASHBOARD_API.md §0`.)

---

## 7. Componentes (o set próprio — portar 1:1)

- **Select (`cselect` / `.cs`):** botão `h40 radius12 border`, chevron que gira; ao abrir,
  `border #2F539A` + `ring rgba(47,83,154,.15)`; menu com animação `pop`, `max-height:320px`.
  Itens podem ter `dot` (cor) e ícone. Dentro de modal abre em `position:fixed`.
- **Checkbox (`.ck`):** `18px radius6 border2`; on = preenchido navy `#1E3765` + check branco.
- **Tooltip global (`#tipBubble`, via `.tip[data-tip]`):** balão **único** navy `#15294d`,
  `position:fixed` (imune a `overflow:hidden`), seta, `max-width 230px`. Substitui `title=`.
- **Datepicker próprio** + máscaras: data `dd/mm/aaaa`, CPF `000.000.000-00`,
  telefone `(XX) 9XXXX-XXXX`, CEP `00000-000`. Senha com botão de mostrar/ocultar (olhinho).
- **Modais:** card `rounded-2xl`, header com título + `X`; **rodapé sticky** (botões sempre
  visíveis ao rolar); largura por tamanho (`max-w-md/lg`).
- **Toasts:** **amarelos** (`#F5B700`, texto `#15294d`), ícone à esquerda, auto-dismiss.
  **Nunca verdes.** Erro de salvar = toast amarelo com ícone de alerta + form preservado.
- **Botões:** primário = gradiente navy + texto branco; secundário/ghost = `border` +
  hover `--hover`; **WhatsApp** `#25D366`; destrutivo `#DC2626`. Ao submeter: vira
  **"Salvando…"** + desabilita (trava duplo-clique).
- **Badges/pills de status:** cor própria + fundo translúcido (10–16%), formato `999px`,
  às vezes com `dot` ou ícone.
- **Menu de ações `⋮` por linha (`rowMenu`):** concentra as ações (sem fileira de ícones
  soltos); transições de status só mostram opções **válidas** para o status atual.
- **Ajuda `?` (`.qm`):** bolinha que no hover vira amarela e mostra tooltip — no lugar de
  texto solto.
- **KPI cards + gráficos:** Chart.js (canvas) — linha (matrículas), barras (níveis,
  entradas×saídas, ocupação), **donut** (distribuição por horário). Cores = famílias/marca.

---

## 8. Estados (todos existem no preview — "completar o preview" antes do React)
- **Skeleton/shimmer:** overlay `#mainSkel` por formato de tela (cards/tabela/grade/painel/
  editor), `.skel` com `skel-shine` (~560ms), disparado a cada navegação e no login.
- **Empty state:** componente que **distingue** "nenhum dado ainda" de "filtro não achou";
  com ícone, título, sub e CTA opcional (ex. "Criar primeira turma").
- **Erro:** (1) carregar → overlay "Não foi possível carregar esta tela" + **Tentar de novo**;
  (2) salvar → toast amarelo e **form fica aberto** preservando o digitado.
- **Carregando/desabilitado:** botão "Salvando…" + spinner.

---

## 9. Padrões de tela específicos
- **Agenda — "página do Canva" (visão da sala):** header colorido com a cor da sala + nome +
  "Teacher X · Mon/Wed"; 2 colunas de horários; cada slot = horário + sigla do nível (cor da
  família) + lista **numerada** de alunos com `(idade)` e marcador **NOVO/NOVA**; turma cheia
  fecha com **"NÃO TEM VAGA"** em verde. Pills de visão (Grade/Salas/Níveis) + filtros
  transversais. **Drag-and-drop:** alvo válido com `outline 2px dashed #F5B700` + fundo
  `rgba(245,183,0,.12)`.
- **Editor de site:** elementos editáveis com **outline pontilhado amarelo** no hover +
  etiqueta "editar"; estado "editando" com outline sólido. Preview desktop/mobile.
- **Comentários estilo Figma:** modo comentário (cursor crosshair), **pin roxo `#7C3AED`**
  em gota, balão de composição, pin de rascunho que pulsa. Canal de feedback da dona.
- **Tours por tela:** spotlight + **halo amarelo pulsante** (`tour-pulse`,
  `box-shadow 0 0 0 …px rgba(245,183,0,…)`), opt-out global, botão "?".

---

## 10. Iconografia & ilustração
- **Lucide** (stroke, `w-4/5 h-4/5`), nunca emoji no lugar de ícone funcional.
- Avatares = iniciais sobre gradiente (`initials()` + paleta).

---

## 11. Voz & conteúdo
- **PT-BR**, neutro: sem flexão de gênero, **sem "bem-vindo/a"**; mínimo de emoji.
- Papéis sem flexão: **Diretor · Supervisor · Secretaria**.
- **Pagamento é sempre boleto/carnê em 6 parcelas** — exibir "Boleto Bancário · Carnê em 6
  parcelas"; não inventar PIX/cartão/dinheiro.
- Textos transacionais prontos em `docs/EMAILS_TRANSACIONAIS.md`.

---

## 12. Acessibilidade (básico pragmático — `DASHBOARD_PLAN.md §11`)
Teclado (Tab/Enter/Esc/setas), **foco visível** (ring `--ring`), label/ARIA nos controles
custom (cselect, datepicker, checkbox). Sem perseguir WCAG AA formal, mas sem deixar o "sem
nativo" tirar acessibilidade de graça.

---

## 13. Do / Don't (referência rápida)
| ✅ Faça | ❌ Não faça |
|---|---|
| cselect, `.ck`, tooltip global, datepicker próprio | `<select>`, checkbox nativa, `title=`, date input nativo |
| Toast **amarelo** (`#F5B700`/`#15294d`) | Toast verde |
| Texto navy sobre amarelo | Texto branco sobre amarelo |
| Amarelo pastel na sidebar | Amarelo saturado chapado |
| Confirmação destrutiva em modal próprio | `confirm()` nativo |
| Ações no menu `⋮`, só transições válidas | Fileira de ícones soltos; ações inválidas pro status |
| Linguagem neutra, mínimo de emoji | "Bem-vinda", flexão de gênero, emoji decorativo |
| Chart.js (canvas), View Transitions | Recharts; Framer pro dark mode |

---

## 14. Referência visual
Os 47 prints (desktop 1440×900 + mobile 390×844) ficam em `/tmp/dashboard-prints/` ao rodar
`node scripts/dashboard-prints.mjs`. Cobrem todas as telas, modais, os 3 temas de sidebar,
claro/escuro e mobile — a fonte de verdade visual ao lado do `public/dashboard.html`.
