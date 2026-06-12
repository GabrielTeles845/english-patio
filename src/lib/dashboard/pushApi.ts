// Web Push no front: registra o service worker, pede permissão ao navegador e
// inscreve em POST /api/notifications/subscribe. A chave VAPID pública vem do
// GET /api/auth/me. Tudo degrada com elegância onde não há suporte/permissão.
import { apiFetch } from './api';

export type PushState = 'unsupported' | 'default' | 'granted' | 'denied';

export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Estado atual da permissão (sem pedir nada). 'unsupported' onde não há API.
export function pushState(): PushState {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission as PushState;
}

// VAPID em base64url → Uint8Array, formato exigido por pushManager.subscribe.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Pede permissão, registra o SW, inscreve e manda a inscrição pro backend.
// Devolve o estado final ('granted' em caso de sucesso). Lança se o servidor
// não tiver a chave VAPID configurada.
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission as PushState;

  const { vapidPublicKey } = await apiFetch<{ vapidPublicKey: string | null }>('/auth/me');
  if (!vapidPublicKey) throw new Error('As notificações ainda não foram configuradas no servidor.');

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  await apiFetch('/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint: json.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } }),
  });

  return 'granted';
}
