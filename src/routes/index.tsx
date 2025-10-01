import { createBrowserRouter, Outlet } from 'react-router-dom';
import Home from '../pages/Home';
import OurClasses from '../pages/OurClasses';
import FocusAndAction from '../pages/FocusAndAction';
import VacationClasses from '../pages/VacationClasses';
import Infrastructure from '../pages/Infrastructure';
import Methodology from '../pages/Methodology';
import Enrollment from '../pages/Enrollment';
import WhatsAppButton from '../components/WhatsAppButton';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'nossas-aulas',
        element: <OurClasses />,
      },
      {
        path: 'foco-e-acao',
        element: <FocusAndAction />,
      },
      {
        path: 'vacation-classes',
        element: <VacationClasses />,
      },
      {
        path: 'infraestrutura',
        element: <Infrastructure />,
      },
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
], {
  basename: '/english-patio'
}); 