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
O **acento global `--acc`** acompanha o tema da sidebar: no tema **amarelo claro** vira
navy (`--acc:#1E3765`, `--acc-text:#ffffff` — texto branco sobre navy, ok); no
**amarelo + escuro** volta a `#F5B700` (a sidebar pastel escurece e o navy perderia
contraste). Conferido no preview (l.45–46) em 09/Jun.

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
- **Toasts:** card `.surface` (fundo `var(--card)`, texto `var(--text)`) com **círculo de
  ícone amarelo** à esquerda (`#F5B700` com ícone navy `#15294d`), auto-dismiss (~2600ms,
  anim. translateY). É essa a anatomia exata do preview — o corpo NÃO é todo amarelo; o
  amarelo é o badge do ícone. **Nunca verdes.** Erro de salvar = mesmo toast com ícone de
  alerta + form preservado.
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

---

# 15. Handoff técnico — do preview (CSS+Tailwind CDN) para o React real

O preview **não é descartável como design**: ele já usa **Tailwind** (via CDN) para layout e
**CSS variables** para tema — exatamente os dois mecanismos do stack-alvo (Tailwind + shadcn,
`DASHBOARD_PLAN.md §2`). Portanto a migração é **mecânica, não um rebuild visual**: as
variáveis e classes do preview são **transplantadas**, não reinventadas. Esta seção é o passo
a passo para isso ficar idêntico (a meta dos testes de paridade visual, `DASHBOARD_PLAN.md §8.2`).

## 15.1 Stack & estrutura de pastas
- **Front:** a SPA Vite + React + TS já existente. A dashboard vive em `/dashboard/*`
  (rotas protegidas, `react-router`), reusando a base de componentes.
- **Estilo:** Tailwind (já no projeto) + `globals.css` com os tokens (§15.3). **shadcn/ui =
  andaime secundário** (Button/Dialog/Input base), **tematizado pelos nossos tokens** —
  nunca o visual default do shadcn.
- **Backend:** Vercel Functions em `/api/*` (`DASHBOARD_API.md`).
```
src/
  pages/dashboard/            # uma pasta por tela (Overview, Alunos, Agenda, Contratos…)
  components/dashboard/
    ui/                       # controles portados do preview (CSelect, Checkbox, Tooltip,
                              #   DatePicker, Toast, Modal, Badge, RowMenu, Skeleton…)
    charts/                   # wrappers react-chartjs-2 (LineEnroll, BarLevels, DonutHours…)
    agenda/                   # GridView, RoomPage (Canva), LevelView, MoveModal…
  lib/
    theme.tsx                 # ThemeProvider + useTheme (dark + sidebar) — §15.4
    api.ts                    # fetch + envelope { ok, data|error } — §15.7
    status.ts                 # STATUS map (cores/labels) — §15.6
  styles/globals.css          # :root / .dark / [data-sidebar] + componentes (§15.3)
```

## 15.2 `tailwind.config.js` — tokens (extend, sem reinventar)
Mapeie as cores para as **CSS vars** (assim `bg-card`, `text-muted`, `border-border`
respeitam claro/escuro/sidebar automaticamente) e fixe as cores de marca/semânticas:
```js
// tailwind.config.js  → theme.extend
export default {
  darkMode: 'class',                         // troca por html.dark (igual ao preview)
  theme: { extend: {
    colors: {
      bg: 'var(--bg)', card: 'var(--card)', fg: 'var(--text)', muted: 'var(--muted)',
      border: 'var(--border)', hover: 'var(--hover)', ring: 'var(--ring)',
      acc: { DEFAULT: 'var(--acc)', fg: 'var(--acc-text)' },
      // marca (fixas)
      primary: { DEFAULT: '#1E3765', light: '#2F539A', dark: '#15294d' },
      accent:  { DEFAULT: '#F5B700', light: '#FFE17A' },
      wa: '#25D366',
      // status de contrato (§2.3) e famílias de nível (§2.4)
      status: { pending:'#B5860B', sent:'#2F539A', viewed:'#7C3AED', signed:'#16a34a', rejected:'#DC2626', failed:'#EA580C' },
      fam: { fun:'#E8861B', conv:'#E0457B', power:'#2F539A', sprint:'#7C3AED' },
    },
    fontFamily: { heading: ['Fredoka','system-ui','sans-serif'], sans: ['Inter','system-ui','sans-serif'] },
    borderRadius: { lg: '12px', xl: '16px', '2xl': '24px' },
    boxShadow: { sidebar: '6px 0 24px rgba(7,15,34,.22)', tip: '0 8px 20px rgba(0,0,0,.28)' },
    keyframes: { 'skel-shine': { to: { transform: 'translateX(100%)' } },
                 pop: { from:{opacity:0,transform:'translateY(-4px) scale(.98)'}, to:{opacity:1,transform:'none'} },
                 'tour-pulse': { '0%,100%':{boxShadow:'0 0 0 4px rgba(245,183,0,.32)'}, '50%':{boxShadow:'0 0 0 11px rgba(245,183,0,.10)'} } },
  }},
}
```

## 15.3 `globals.css` — transplante direto do preview
Copiar **verbatim** do `public/dashboard.html` (são CSS puro, independem de framework):
- **Variáveis de tema + 3 sidebars × claro/escuro:** linhas **39–93** (`:root`, `html.dark`,
  `html[data-sidebar="blue|white|yellow"]` e suas variantes dark). É o coração do tema.
- **Componentes portados (CSS):** cselect `.cs/.cs-btn/.cs-menu` (156–164) · checkbox `.ck`
  (171–175) · tooltip `#tipBubble` (148–153) · skeleton `.skel`/`skel-shine` (195–201) ·
  editor `.editable` (122–130) · comentário `.cm-pin`/draft (131–144) · `tour-pulse` (146) ·
  ajuda `.qm` (182–184) · drag `.ag-drop` (190–194) · **mobile tabela→cards** (114–121) ·
  view-transition do dark (154–155).
- Manter os nomes de classe (`.surface`, `.cs-*`, `.ck`, `.qm`, `.ag-drop`) — os componentes
  React só **adicionam** esses className; não recriar com utilitários soltos.

## 15.4 Tema em React (`lib/theme.tsx`)
Replica o mecanismo do preview: classe `dark` no `<html>` + atributo `data-sidebar`, com a
**transição circular** (View Transitions). Persistir em `localStorage` (§15.8).
```tsx
type Sidebar = 'blue' | 'white' | 'yellow';
function applySidebar(s: Sidebar){ document.documentElement.setAttribute('data-sidebar', s); localStorage.setItem('ep-sb-theme', s); }
function toggleDark(ev?: MouseEvent){
  const run = () => { const dark = document.documentElement.classList.toggle('dark'); localStorage.setItem('ep-dark', dark ? '1' : '0'); };
  if (!document.startViewTransition || !ev) return run();        // fallback
  const x = ev.clientX, y = ev.clientY;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(run).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 520, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' });
  });
}
// no boot: ler ep-dark / ep-sb-theme e aplicar antes do 1º paint (evita flash)
```
> O preview **não** persiste o dark (reseta ao recarregar) — no real, **persistir** em
> `ep-dark` (melhoria assumida).

## 15.5 Fontes, ícones, gráficos
- **Fontes:** `@fontsource/fredoka` (títulos) + `@fontsource/inter` (corpo) — importar no entry;
  já refletido no `fontFamily` do Tailwind.
- **Ícones:** `lucide-react` (os mesmos nomes do preview: `file-x`, `mail-warning`,
  `alert-triangle`, `file-clock`, `user-plus`…).
- **Gráficos:** `react-chartjs-2` + `chart.js` 4.4.x (o preview usa Chart.js — **não** trocar
  por Recharts, `DASHBOARD_PLAN.md §2/§10`). Espelhar os configs do preview (cores das
  famílias, donut de horário, linha de matrículas, barras de nível/ocupação).

## 15.6 Mapa de port — cada widget do preview → React
| Preview (função/classe) | React | Base |
|---|---|---|
| `STATUS` map (cores/labels de contrato) | `lib/status.ts` + `<StatusBadge>` | port (§15.9) |
| `cselect`/`csPick`/`csToggle` | `<CSelect>` | **port 1:1** (CSS `.cs-*`); NÃO usar Select do shadcn |
| checkbox `.ck` | `<Checkbox>` | port (ou shadcn tematizado p/ virar `.ck`) |
| tooltip global `#tipBubble`/`.tip` | `<Tooltip>` (portal único) | **port 1:1** |
| `maskDate/maskCpf/maskPhone/maskCep` + datepicker | `<MaskedInput>` + `<DatePicker>` | port (máscaras) |
| `openModal`/`closeModal` (rodapé sticky) | `<Modal>` | shadcn Dialog tematizado + footer sticky |
| `toast()` (amarelo, translateY, 2600ms) | `<Toaster>`/`useToast()` | port (cor/anim do preview) |
| `openRowMenu` (`⋮`, transições válidas) | `<RowMenu>` | shadcn DropdownMenu tematizado |
| badges/pills de status | `<StatusBadge>`/`<Badge>` | port |
| `renderTable`/cards mobile | `<DataTable>` (tabela↔card via `<768px`) | port (CSS 114–121) |
| `renderHealth` (funil + "precisa de ação") | `<ContractFunnel>` | port + Chart.js |
| `autentiqueTimeline` (passo de exceção vermelho) | `<ContractTimeline>` | port |
| Agenda: grade / sala (Canva) / níveis / mover | `<AgendaGrid/RoomPage/LevelView/MoveModal>` | **port 1:1** (visual é a estrela) |
| skeleton `flashSkel`/`skelFor` | `<Skeleton>` + `useRouteSkeleton()` | port |
| empty/error states | `<EmptyState>`/`<ErrorState>` | port |
| editor `.editable` | `<EditableText>` | port |
| comentários `.cm-pin` | (fora do produto — era feedback da dona) | — |

## 15.7 Dados: do mock em memória para `/api`
Cada array mock (`STUDENTS`, `TURMAS`, `USERS`, `NOTIFS`, `ACTIVITY`…) vira fetch a uma rota
do `DASHBOARD_API.md`. Usar **React Query** (cache + estados de loading/erro que casam com
skeleton/error states). Helper único do envelope:
```ts
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, { credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.method && init.method !== 'GET' ? { 'x-csrf-token': getCsrf() } : {}) }, ...init });
  const json = await r.json();
  if (!json.ok) throw new ApiError(json.error);   // .code → toast/UX (ex. SLOT_TAKEN, FORBIDDEN)
  return json.data as T;
}
```
- **Loading** → `<Skeleton>` (§15.6). **Erro de carregar** → `<ErrorState onRetry>`. **Erro de
  salvar** → toast amarelo + manter o form aberto (`DASHBOARD_PLAN.md §11`).
- **Update otimista + rollback** e **conflito concorrente (409 STALE_WRITE)**: tratar via
  React Query mutations (estados que o preview não tinha — `DASHBOARD_PLAN.md §11`).

## 15.8 Chaves de `localStorage` (manter as do preview)
`ep-sb-theme` (tema da sidebar) · `ep-dark` (**novo** no real) · `ep-tours-off` (opt-out de
tours) · `ep-tour-seen-<view>` (tour já visto por tela). (`ep-feedbacks`/`ep-fb-name` eram do
modo comentário — fora do produto.)

## 15.9 Exemplo de port (o padrão a seguir) — Status Badge
Mostra como um pedaço do preview vira React+Tailwind mantendo os tokens. O `STATUS` do preview
(`dashboard.html`) vira:
```ts
// lib/status.ts — espelha o STATUS do preview (§2.3)
export const STATUS = {
  pending:  { label: 'Pendente',       color: 'var(--c)', cls: 'text-status-pending  bg-status-pending/15' },
  sent:     { label: 'Enviado',        cls: 'text-status-sent     bg-status-sent/15' },
  viewed:   { label: 'Visualizado',    cls: 'text-status-viewed   bg-status-viewed/15' },
  signed:   { label: 'Assinado',       cls: 'text-status-signed   bg-status-signed/15' },
  rejected: { label: 'Recusado',       cls: 'text-status-rejected bg-status-rejected/15' },
  failed:   { label: 'Falha no envio', cls: 'text-status-failed   bg-status-failed/15' },
} as const;
export type ContractStatus = keyof typeof STATUS;
export const needsAction    = (s: ContractStatus) => s === 'rejected' || s === 'failed';
export const needsSignature = (s: ContractStatus) => s === 'pending' || s === 'sent' || s === 'viewed';
```
```tsx
// components/dashboard/ui/StatusBadge.tsx
export function StatusBadge({ status }: { status: ContractStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />{s.label}
    </span>
  );
}
```
Mesmo padrão para `<CSelect>`, `<Tooltip>`, `<Modal>`, etc.: **className = as classes do
preview** (`.cs-btn`, `.ck`, `.tip`) + lógica em React; o visual sai do `globals.css` (§15.3).

## 15.10 "Definição de pronto" por tela
1. Renderiza com dados reais da `/api` (loading=skeleton, vazio=empty, falha=error).
2. RBAC respeitado (esconde no front **e** servidor barra — `DASHBOARD_API §0`).
3. **Paridade visual** com o print correspondente (pixelmatch vs `/tmp/dashboard-prints/`,
   `DASHBOARD_PLAN.md §8.2`) nos 3 sidebars × claro/escuro × desktop/mobile relevantes.
4. `reg-NN` do módulo verde (caminho feliz + negativos da `DASHBOARD_VALIDACOES.md`).
5. Sem controle nativo, toast amarelo, linguagem neutra (checklist §13).

## 15.11 Ordem de port (determinística)
1. `globals.css` (tokens §15.3) + `tailwind.config` (§15.2) + `theme.tsx` (§15.4) + fontes.
2. Shell: sidebar (3 temas) + topbar + layout responsivo + `useTheme`.
3. `ui/` primitives portadas (CSelect, Checkbox, Tooltip, Modal, Toast, Badge, Skeleton,
   Empty/Error, MaskedInput, DatePicker, RowMenu).
4. `lib/api.ts` + React Query + `lib/status.ts`.
5. Telas, na ordem das fases (`DASHBOARD_PLAN.md §9`): Alunos → Agenda → Contratos → Visão
   geral → Comunicados → Editor. Cada tela fecha com sua "definição de pronto" (§15.10).

> Regra de ouro do handoff: **quando em dúvida visual, o `public/dashboard.html` + o print
> mandam.** O React copia; não recria.
