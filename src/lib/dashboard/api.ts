/* Cliente da API da dashboard — envelope { ok, data | error } (DESIGN.md §15.7,
   contrato completo em docs/DASHBOARD_API.md). Ainda sem backend: as telas usam
   o stub em memória; quando as rotas /api/* existirem, é só trocar a camada de
   dados pelas chamadas daqui. */

export interface ApiErrorShape {
  code: string;
  message?: string;
}

export class ApiError extends Error {
  code: string;
  constructor(err: ApiErrorShape) {
    super(err.message ?? err.code);
    this.code = err.code;
  }
}

function getCsrf(): string {
  return document.cookie.match(/(?:^|;\s*)ep_csrf=([^;]+)/)?.[1] ?? '';
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.method && init.method !== 'GET' ? { 'x-csrf-token': getCsrf() } : {}),
    },
    ...init,
  });
  const json = await r.json();
  if (!json.ok) throw new ApiError(json.error);
  return json.data as T;
}
