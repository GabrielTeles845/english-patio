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
import Placeholder from './Placeholder';
import Alunos from './Alunos';
import Detalhe from './alunos/Detalhe';
import Agenda from './Agenda';

/* App da dashboard administrativa — vive em /dashboard/<tela> (PLAN §9 Fase 1).
   Em produção o /dashboard EXATO continua servindo o preview (rewrite no
   vercel.json) até a Fase 7; estas rotas convivem com ele sem conflito.
   Chunk separado do site público (lazy no router) — fontes e CSS daqui não
   pesam nas páginas institucionais. */

function RequireAuth() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/dashboard/entrar" replace />;
  return <Outlet />;
}

function HomeRedirect() {
  const { user } = useAuth();
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
                  <Route path="visao-geral" element={<Placeholder view="overview" sub="Resumo da escola" />} />
                  <Route path="alunos" element={<Alunos />} />
                  <Route path="alunos/:id" element={<Detalhe />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="contratos" element={<Placeholder view="contratos" sub="Acompanhamento e assinatura" />} />
                  <Route path="comunicados" element={<Placeholder view="emails" sub="E-mail e WhatsApp para as famílias" />} />
                  <Route path="editor" element={<Placeholder view="editor" sub="Textos do site institucional" />} />
                  <Route path="usuarios" element={<Placeholder view="usuarios" sub="Equipe e permissões" />} />
                  <Route path="atividade" element={<Placeholder view="atividade" sub="Auditoria do painel" />} />
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
