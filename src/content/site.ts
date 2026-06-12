// Catálogo central de conteúdo do site institucional.
//
// Cada peça de texto das páginas públicas vira uma string aqui, chaveada por
// (pageKey, fieldKey) — exatamente o par que o backend `site_content` usa
// (server/db/schema/communication.ts, api/site-content.ts). Os valores abaixo
// são os DEFAULTS publicados hoje no código; quando a API subir, os valores
// vindos de `GET /api/site-content` serão sobrepostos a estes defaults (ver
// `applyContentOverlay`), e só então o Editor de site fecha o loop de ponta a
// ponta. Enquanto o deploy está adiado, o site renderiza só os defaults.
//
// Convenção de fieldKey (kebab-case): o backend deriva o teto de caracteres do
// nome — "...titulo..." → 120, "...subtitulo..." → 200, demais → 600
// (VALIDACOES §17 / api/site-content.ts capFor). Mantenha os nomes coerentes
// com o tipo de campo para que toda string aqui seja publicável pela API real.

export const siteDefaults = {
  home: {
    'hero-paragrafo-1':
      'Somos a English Patio, uma escola de inglês dedicada a construir a fluência com leveza e propósito.',
    'hero-paragrafo-2':
      'Adotamos uma abordagem lúdica, dinâmica e contextualizada, voltada ao ensino de crianças e adolescentes organizados em pequenas turmas de até seis alunos.',
    'hero-paragrafo-3':
      'Nossa unidade foi cuidadosamente planejada para proporcionar um ambiente acolhedor, inspirador e propício ao desenvolvimento linguístico, cognitivo e pessoal.',
    'hero-cta-matricula': 'Faça Sua Matrícula',
    'hero-cta-curso': 'Conheça Nosso Curso',
    'hero-badge': 'Matrículas Abertas!',
    'hero-feature-1-titulo': 'Aulas 100% em inglês',
    'hero-feature-1-descricao': 'Imersão total no idioma desde a primeira aula',
    'hero-feature-2-titulo': 'Turmas reduzidas',
    'hero-feature-2-descricao': 'Até 6 alunos por turma para atendimento personalizado',
    'hero-feature-3-titulo': 'Metodologia ativa',
    'hero-feature-3-descricao': 'Práticas interativas que priorizam a conversação.',
    'hero-feature-4-titulo': 'Espaço que Inspira',
    'hero-feature-4-descricao':
      'Infraestrutura que integra conforto, funcionalidade e foco no aprendizado.',
    'about-titulo': 'Infraestrutura que Estimula o Aprendizado',
    'about-paragrafo':
      'A English Patio oferece um ambiente cuidadosamente planejado para promover o aprendizado com conforto, criatividade e acolhimento.',
    'about-destaque-1-titulo': 'Salas Interativas',
    'about-destaque-1-descricao':
      'Layout com mesas redondas, livros literários, decoração lúdica e climatização',
    'about-destaque-2-titulo': 'Ambiente Imersivo',
    'about-destaque-2-descricao':
      'Murais artísticos e decoração temática que remetem à cultura de língua inglesa',
    'about-destaque-3-titulo': 'Fun Space',
    'about-destaque-3-descricao':
      'Sala multiuso com karaokê, cozinha e palco para apresentações em inglês',
    'about-destaque-4-titulo': 'Pátio Amplo',
    'about-destaque-4-descricao':
      'Espaço acolhedor com bancos, música ambiente, cesta de basquete e pergolado',
  },
} as const;

export type PageKey = keyof typeof siteDefaults;
export type FieldKey<P extends PageKey> = keyof (typeof siteDefaults)[P];

// Overlay de valores publicados (preenchido a partir da API quado o deploy
// existir). Chave interna: `${pageKey}|${fieldKey}`.
const overlay: Record<string, string> = {};

/** Sobrepõe valores publicados (vindos de GET /api/site-content) aos defaults. */
export function applyContentOverlay(
  items: ReadonlyArray<{ pageKey: string; fieldKey: string; value: string }>,
): void {
  for (const it of items) overlay[`${it.pageKey}|${it.fieldKey}`] = it.value;
}

/**
 * Texto de uma peça do site: usa o valor publicado (overlay) quando existir,
 * senão o default chumbado no catálogo. Tipado: só aceita (page, field) válidos.
 */
export function c<P extends PageKey>(pageKey: P, fieldKey: FieldKey<P>): string {
  const k = `${pageKey}|${String(fieldKey)}`;
  if (k in overlay) return overlay[k];
  return siteDefaults[pageKey][fieldKey] as string;
}
