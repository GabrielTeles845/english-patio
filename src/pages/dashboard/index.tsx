import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '../../styles/dashboard.css';
import { DashboardAuthProvider, ROLE_HOME, useAuth } from '../../lib/dashboard/auth';
import { DashboardThemeProvider } from '../../lib/dashboard/theme';
import { viewToPath } from '../../lib/dashboard/nav';
import { ToastProvider } from '../../components/dashboard/ui/Toast';
import { GlobalTooltip } from '../../components/dashboard/ui/Tooltip';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import Login from './Login';
import Config from './Config';
import Comunicados from './Comunicados';
import Editor from './Editor';
import Alunos from './Alunos';
import Overview from './Overview';
import Detalhe from './alunos/Detalhe';
import Agenda from './Agenda';
import Contratos from './Contratos';
import Modelos from './contratos/Modelos';
import Usuarios from './Usuarios';
import Atividade from './Atividade';

/* App da dashboard administrativa — vive em /dashboard/<tela> (PLAN §9 Fase 1).
   Em produção o /dashboard EXATO continua servindo o preview (rewrite no
   vercel.json) até a Fase 7; estas rotas convivem com ele sem conflito.
   Chunk separado do site público (lazy no router) — fontes e CSS daqui não
   pesam nas páginas institucionais. */

/* enquanto o GET /api/auth/me não respondeu, não decide rota (evita piscar login) */
function AuthLoading() {
  return (
    <div className="min-h-screen grid place-content-center">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-brand-light animate-spin" />
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/dashboard/entrar" replace />;
  return <Outlet />;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/dashboard/entrar" replace />;
  return <Navigate to={viewToPath(ROLE_HOME[user.role])} replace />;
}

export default function DashboardApp() {
  return (
    <DashboardThemeProvider>
      <DashboardAuthProvider>
        <ToastProvider>
          <GlobalTooltip />
          <div className="dash-root min-h-screen antialiased">
            <Routes>
              <Route path="entrar" element={<Login />} />
              <Route element={<RequireAuth />}>
                <Route element={<DashboardLayout />}>
                  <Route path="visao-geral" element={<Overview />} />
                  <Route path="alunos" element={<Alunos />} />
                  <Route path="alunos/:id" element={<Detalhe />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="contratos" element={<Contratos />} />
                  <Route path="contratos/modelos" element={<Modelos />} />
                  <Route path="comunicados" element={<Comunicados />} />
                  <Route path="editor" element={<Editor />} />
                  <Route path="usuarios" element={<Usuarios />} />
                  <Route path="atividade" element={<Atividade />} />
                  <Route path="configuracoes" element={<Config />} />
                </Route>
              </Route>
              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </div>
        </ToastProvider>
      </DashboardAuthProvider>
    </DashboardThemeProvider>
  );
}
