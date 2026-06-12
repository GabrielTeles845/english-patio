/* Service worker da dashboard English Patio — Web Push.
   Recebe os avisos do servidor mesmo com a aba/janela fechada e os mostra como
   notificação do sistema. Clicar foca a dashboard (ou abre, se estiver fechada).
   Registrado por src/lib/dashboard/pushApi.ts; escopo raiz ('/'). */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: 'English Patio', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'English Patio';
  const options = {
    body: data.body || '',
    tag: data.tag,                       // agrupa avisos do mesmo tipo
    data: { url: data.url || '/dashboard/' },
    renotify: !!data.tag,
  };
  if (data.icon) options.icon = data.icon; // ícone só quando o servidor manda um

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/dashboard/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/dashboard') && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
