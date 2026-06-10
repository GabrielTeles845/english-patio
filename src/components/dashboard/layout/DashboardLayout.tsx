import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROLE_HOME, roleAllows, useAuth } from '../../../lib/dashboard/auth';
import { ALL_NAV_ITEMS, VIEW_LABEL, viewToPath } from '../../../lib/dashboard/nav';
import { SkeletonView, skeletonKindFor } from '../ui/Skeleton';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/* Shell da dashboard — sidebar + topbar + faixa "ver painel como…" + main.
   A cada navegação pisca o skeleton da tela (~560ms, igual ao flashSkel do
   preview) e rola pro topo. Guard de papel: tela fora da matriz (PLAN §4)
   redireciona pra tela inicial do papel. */

export function DashboardLayout() {
  const { effectiveRole, effectiveUser, viewAs, setViewAs } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [skelView, setSkelView] = useState<string | null>(null);

  const segs = location.pathname.replace(/^\/dashboard\/?/, '').split('/');
  const slug = segs[0];
  /* sub-rota /dashboard/alunos/:id = a view "detalhe" do preview (título e skeleton próprios) */
  const view = slug === 'alunos' && segs[1] ? 'detalhe' : ALL_NAV_ITEMS.find((i) => i.slug === slug)?.view ?? null;

  useEffect(() => {
    if (!view) return;
    setSkelView(view);
    window.scrollTo(0, 0);
    const t = setTimeout(() => setSkelView(null), 560);
    return () => clearTimeout(t);
  }, [view]);

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
    </div>
  );
}
