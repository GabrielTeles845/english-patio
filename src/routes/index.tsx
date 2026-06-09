import { createBrowserRouter, Outlet } from 'react-router-dom';
import Home from '../pages/Home';
import VacationClasses from '../pages/VacationClasses';
// import Infrastructure from '../pages/Infrastructure';
import Methodology from '../pages/Methodology';
import Enrollment from '../pages/Enrollment';
import WhatsAppButton from '../components/WhatsAppButton';
import { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Dashboard administrativa — chunk separado (fontes/CSS próprios não pesam no site)
const DashboardApp = lazy(() => import('../pages/dashboard'));

// Componente que faz scroll para o topo quando muda de rota
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Layout que contém o ScrollToTop e renderiza as rotas filhas
const RootLayout = () => {
  return (
    <>
      <ScrollToTop />
      <WhatsAppButton />
      <Outlet />
    </>
  );
};

export const router = createBrowserRouter([
  {
    // Fora do RootLayout: a dashboard não herda o WhatsAppButton do site.
    // Em produção o /dashboard EXATO ainda serve o preview (vercel.json);
    // o React atende /dashboard/<tela> (DASHBOARD_PLAN.md §9, Fase 1).
    path: '/dashboard/*',
    element: (
      <Suspense fallback={null}>
        <DashboardApp />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'vacation-classes',
        element: <VacationClasses />,
      },
      // {
      //   path: 'infraestrutura',
      //   element: <Infrastructure />,
      // },
      {
        path: 'metodologia',
        element: <Methodology />,
      },
      {
        path: 'matriculas',
        element: <Enrollment />,
      },
    ],
  },
]); 