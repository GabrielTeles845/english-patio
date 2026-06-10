import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROLE_HOME, roleAllows, useAuth } from '../../../lib/dashboard/auth';
import { ALL_NAV_ITEMS, VIEW_LABEL, viewToPath } from '../../../lib/dashboard/nav';
import { SkeletonView, skeletonKindFor } from '../ui/Skeleton';
import { TourProvider, useTour } from '../ui/Tour';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/* Shell da dashboard — sidebar + topbar + faixa "ver painel como…" + main.
   A cada navegação pisca o skeleton da tela (~560ms, igual ao flashSkel do
   preview) e rola pro topo. Guard de papel: tela fora da matriz (PLAN §4)
   redireciona pra tela inicial do papel. Tours guiados por tela: gatilho na
   navegação (só Diretor, como o go() do preview l.1640) + botão "?" flutuante. */

export function DashboardLayout() {
  return (
    <TourProvider>
      <LayoutInner />
    </TourProvider>
  );
}

function LayoutInner() {
  const { effectiveRole, effectiveUser, viewAs, setViewAs } = useAuth();
  const { startTour, maybeTourFor } = useTour();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [skelView, setSkelView] = useState<string | null>(null);

  const segs = location.pathname.replace(/^\/dashboard\/?/, '').split('/');
  const slug = segs[0];
  /* sub-rota /dashboard/alunos/:id = a view "detalhe" do preview (título e skeleton próprios);
     /dashboard/contratos/modelos = a view "modelos" (sub-tela, só Diretor — go() l.1628) */
  const view =
    slug === 'alunos' && segs[1] ? 'detalhe'
      : slug === 'contratos' && segs[1] === 'modelos' ? 'modelos'
      : ALL_NAV_ITEMS.find((i) => i.slug === slug)?.view ?? null;

  useEffect(() => {
    if (!view) return;
    setSkelView(view);
    window.scrollTo(0, 0);
    const t = setTimeout(() => setSkelView(null), 560);
    return () => clearTimeout(t);
  }, [view]);

  /* tour da tela na 1ª visita — só Diretor efetivo (preview l.1640) e só
     depois do skeleton sumir (doLogin/go esperam ~600ms antes do tour) */
  useEffect(() => {
    if (!view || effectiveRole !== 'Diretor') return;
    const t = setTimeout(() => maybeTourFor(view), 560);
    return () => clearTimeout(t);
  }, [view, effectiveRole, maybeTourFor]);

  if (!effectiveRole) return null;
  if (view && !roleAllows(effectiveRole, view)) {
    return <Navigate to={viewToPath(ROLE_HOME[effectiveRole])} replace />;
  }

  return (
    <div className="lg:flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={VIEW_LABEL[view ?? ''] ?? 'Visão geral'} onOpenSidebar={() => setSidebarOpen(true)} />

        {viewAs && (
          <div className="sticky top-16 z-20 border-b" style={{ background: 'rgba(245,183,0,.15)', borderColor: 'var(--border)' }}>
            <div
              className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              style={{ color: '#B5860B' }}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <p className="min-w-0">
                Você está vendo o painel como <b>{`${viewAs}${effectiveUser ? ` (${effectiveUser.name})` : ''}`}</b> — o menu
                e as ações mudam junto com o papel.
              </p>
              <button
                onClick={() => setViewAs(null)}
                className="ml-auto shrink-0 h-7 px-3 rounded-lg text-xs font-semibold text-white hover:brightness-110 transition"
                style={{ background: '#1E3765' }}
              >
                Voltar a ver como Diretor
              </button>
            </div>
          </div>
        )}

        <main className="relative flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
          {skelView && (
            <div id="mainSkel" className="on p-4 sm:p-6 lg:p-8">
              <SkeletonView kind={skeletonKindFor(skelView)} />
            </div>
          )}
        </main>
      </div>

      {/* botão "?" flutuante (preview l.1044) — tours são desktop-only; os
          botões de comentário do preview são canal de feedback e ficam fora */}
      <button
        onClick={() => view && startTour(view)}
        data-tip="Tour da tela — conheça os recursos"
        className="fixed bottom-6 right-6 z-[78] w-11 h-11 rounded-full surface shadow-xl hidden md:grid place-content-center hover:scale-105 transition"
      >
        <span className="font-heading font-semibold text-lg text-brand-light leading-none">?</span>
      </button>
    </div>
  );
}
