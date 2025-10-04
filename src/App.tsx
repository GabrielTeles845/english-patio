import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import GlobalImageZoom from './components/GlobalImageZoom';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <GlobalImageZoom />
    </>
  );
}

export default App; 