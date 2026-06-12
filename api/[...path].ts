// Roteador único de /api — consolida TODAS as rotas numa só Serverless Function
// da Vercel. O plano Hobby limita a 12 funções e cada arquivo em api/* contava
// como uma (eram 43 → deploy sempre falhava). Aqui os handlers continuam em
// routes/**, recebendo o req/res REAIS da Vercel repassados intactos — só
// injetamos os params de URL (:id) no req.query, como o roteamento por arquivo
// da Vercel fazia. Sem conversão, sem shim em produção: comportamento idêntico.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { matchPath } from '../server/lib/router';

import accountPatch from '../routes/account/index';
import accountPassword from '../routes/account/password';
import activity from '../routes/activity';
import announcements from '../routes/announcements/index';
import announcementsPreview from '../routes/announcements/preview';
import announcementTemplates from '../routes/announcement-templates/index';
import announcementTemplateById from '../routes/announcement-templates/[id]';
import authForgot from '../routes/auth/forgot';
import authLogin from '../routes/auth/login';
import authLogout from '../routes/auth/logout';
import authMe from '../routes/auth/me';
import authReset from '../routes/auth/reset';
import classById from '../routes/classes/[id]';
import classes from '../routes/classes/index';
import contractById from '../routes/contracts/[id]';
import contractPdf from '../routes/contracts/[id]/pdf';
import contractRemind from '../routes/contracts/[id]/remind';
import contractSend from '../routes/contracts/[id]/send';
import contractStatus from '../routes/contracts/[id]/status';
import contracts from '../routes/contracts/index';
import enrollmentById from '../routes/enrollments/[id]';
import enrollmentsExport from '../routes/enrollments/export';
import enrollmentsImportCommit from '../routes/enrollments/import/commit';
import enrollmentsImport from '../routes/enrollments/import/index';
import enrollments from '../routes/enrollments/index';
import levels from '../routes/levels';
import notificationRead from '../routes/notifications/[id]/read';
import notifications from '../routes/notifications/index';
import notificationsReadAll from '../routes/notifications/read-all';
import notificationsSubscribe from '../routes/notifications/subscribe';
import overview from '../routes/overview';
import roomDeactivate from '../routes/rooms/[id]/deactivate';
import roomPatch from '../routes/rooms/[id]/index';
import rooms from '../routes/rooms/index';
import siteContent from '../routes/site-content';
import studentClass from '../routes/students/[id]/class';
import studentDeactivate from '../routes/students/[id]/deactivate';
import studentReactivate from '../routes/students/[id]/reactivate';
import templateActivate from '../routes/templates/[id]/activate';
import templateById from '../routes/templates/[id]/index';
import templates from '../routes/templates/index';
import userDeactivate from '../routes/users/[id]/deactivate';
import userPatch from '../routes/users/[id]/index';
import userReactivate from '../routes/users/[id]/reactivate';
import users from '../routes/users/index';
import webhookAutentique from '../routes/webhooks/autentique';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

// Caminho → handler. Cada handler trata os métodos HTTP internamente (devolve
// 405 nos não suportados), então casamos só por caminho — exatamente como o
// roteamento por arquivo da Vercel que isto substitui.
const routes: Record<string, Handler> = {
  '/api/account': accountPatch,
  '/api/account/password': accountPassword,
  '/api/activity': activity,
  '/api/announcements': announcements,
  '/api/announcements/preview': announcementsPreview,
  '/api/announcement-templates': announcementTemplates,
  '/api/announcement-templates/:id': announcementTemplateById,
  '/api/auth/forgot': authForgot,
  '/api/auth/login': authLogin,
  '/api/auth/logout': authLogout,
  '/api/auth/me': authMe,
  '/api/auth/reset': authReset,
  '/api/classes': classes,
  '/api/classes/:id': classById,
  '/api/contracts': contracts,
  '/api/contracts/:id': contractById,
  '/api/contracts/:id/pdf': contractPdf,
  '/api/contracts/:id/remind': contractRemind,
  '/api/contracts/:id/send': contractSend,
  '/api/contracts/:id/status': contractStatus,
  '/api/enrollments': enrollments,
  '/api/enrollments/:id': enrollmentById,
  '/api/enrollments/export': enrollmentsExport,
  '/api/enrollments/import': enrollmentsImport,
  '/api/enrollments/import/commit': enrollmentsImportCommit,
  '/api/levels': levels,
  '/api/notifications': notifications,
  '/api/notifications/:id/read': notificationRead,
  '/api/notifications/read-all': notificationsReadAll,
  '/api/notifications/subscribe': notificationsSubscribe,
  '/api/overview': overview,
  '/api/rooms': rooms,
  '/api/rooms/:id': roomPatch,
  '/api/rooms/:id/deactivate': roomDeactivate,
  '/api/site-content': siteContent,
  '/api/students/:id/class': studentClass,
  '/api/students/:id/deactivate': studentDeactivate,
  '/api/students/:id/reactivate': studentReactivate,
  '/api/templates': templates,
  '/api/templates/:id': templateById,
  '/api/templates/:id/activate': templateActivate,
  '/api/users': users,
  '/api/users/:id': userPatch,
  '/api/users/:id/deactivate': userDeactivate,
  '/api/users/:id/reactivate': userReactivate,
  '/api/webhooks/autentique': webhookAutentique,
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  const match = matchPath(Object.keys(routes), pathname);

  if (!match) {
    res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } });
    return;
  }

  // Injeta os params de URL (ex.: :id) no req.query — os handlers leem tudo
  // via req.query, igual ao que a Vercel populava no roteamento por arquivo.
  req.query = { ...req.query, ...match.params };
  await routes[match.pattern](req, res);
}
