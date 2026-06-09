import {
  CalendarDays,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  Megaphone,
  PencilRuler,
  Settings,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

/* Navegação da dashboard — espelha a sidebar do preview (grupos Principal /
   Conteúdo / Administração) e o mapa VIEW_LABEL. `view` é a chave de RBAC
   (auth.roleAllows); `slug` é a rota /dashboard/<slug> (PLAN §9 Fase 1). */

export interface NavItem {
  view: string;
  slug: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { view: 'overview', slug: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard },
      { view: 'alunos', slug: 'alunos', label: 'Alunos', icon: GraduationCap },
      { view: 'agenda', slug: 'agenda', label: 'Agenda', icon: CalendarDays },
      { view: 'contratos', slug: 'contratos', label: 'Contratos', icon: FileText },
      { view: 'emails', slug: 'comunicados', label: 'Comunicados', icon: Megaphone },
    ],
  },
  {
    title: 'Conteúdo',
    items: [{ view: 'editor', slug: 'editor', label: 'Editor do site', icon: PencilRuler }],
  },
  {
    title: 'Administração',
    items: [
      { view: 'usuarios', slug: 'usuarios', label: 'Usuários', icon: UsersRound },
      { view: 'atividade', slug: 'atividade', label: 'Atividade', icon: History },
      { view: 'config', slug: 'configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/* títulos da topbar (VIEW_LABEL do preview) */
export const VIEW_LABEL: Record<string, string> = {
  overview: 'Visão geral',
  alunos: 'Alunos',
  agenda: 'Agenda',
  detalhe: 'Detalhe do aluno',
  contratos: 'Contratos',
  modelos: 'Modelos de contrato',
  emails: 'Comunicados',
  editor: 'Editor do site',
  usuarios: 'Usuários',
  atividade: 'Registro de atividades',
  config: 'Configurações',
  notifs: 'Notificações',
};

export const viewToPath = (view: string): string => {
  const item = ALL_NAV_ITEMS.find((i) => i.view === view);
  return `/dashboard/${item?.slug ?? 'visao-geral'}`;
};
