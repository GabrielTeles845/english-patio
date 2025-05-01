import { createBrowserRouter, Outlet } from 'react-router-dom';
import Home from '../pages/Home';
import OurClasses from '../pages/OurClasses';
import FocusAndAction from '../pages/FocusAndAction';
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
    ],
  },
], {
  basename: '/english-patio'
}); 