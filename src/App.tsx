import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import GlobalImageZoom from './components/GlobalImageZoom';

function App() {
  return (
    <>
      {/* v7_startTransition: opt-in antecipado do wrapping de state updates
          em React.startTransition (silencia o aviso de migração do v7). */}
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <GlobalImageZoom />
    </>
  );
}

export default App; 