import { Hammer } from 'lucide-react';
import { EmptyState } from '../../components/dashboard/ui/EmptyState';
import { VIEW_LABEL } from '../../lib/dashboard/nav';

/* Tela ainda não portada do preview — andaime honesto da Fase 1.
   Cada uma destas vira o port 1:1 da tela correspondente do dashboard.html,
   na ordem das fases (DASHBOARD_PLAN.md §9 / DESIGN.md §15.11). */

const PHASE_BY_VIEW: Record<string, string> = {
  overview: 'Fase 4',
  alunos: 'Fase 2',
  agenda: 'Fase 2',
  contratos: 'Fase 3',
  emails: 'Fase 5',
  editor: 'Fase 6',
  usuarios: 'Fase 1',
  atividade: 'Fase 1',
};

export default function Placeholder({ view, sub }: { view: string; sub?: string }) {
  const label = VIEW_LABEL[view] ?? view;
  return (
    <section className="fade-in">
      <h1 className="font-heading text-2xl sm:text-3xl font-semibold mb-1">{label}</h1>
      <p className="text-[var(--muted)] text-sm mb-6">{sub ?? 'Em construção'}</p>
      <div className="surface rounded-2xl">
        <EmptyState
          icon={Hammer}
          title={`${label} ainda não foi portada do preview`}
          sub={`Esta tela chega na ${PHASE_BY_VIEW[view] ?? 'próxima fase'} do plano (DASHBOARD_PLAN.md §9). Enquanto isso, a versão navegável completa continua no preview, em /dashboard.`}
        />
      </div>
    </section>
  );
}
