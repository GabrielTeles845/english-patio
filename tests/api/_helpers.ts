// Utilitários dos testes de integração das rotas /api.
// Simulam o req/res da Vercel e gerenciam usuários de teste no Neon.
import { eq } from 'drizzle-orm';
import { db } from '../../server/db/client';
import { users, loginAttempts } from '../../server/db/schema';
import { hashPassword } from '../../server/lib/password';
import login from '../../api/auth/login';

export const TEST_IP = '198.51.100.5';

// Mock do VercelResponse — tipado como `any` de propósito (não vale recriar a
// superfície inteira do ServerResponse só pro teste).
export function mkRes(): any {
  const r = {
    _status: 0,
    _body: null as any,
    _headers: {} as Record<string, unknown>,
    status(c: number) { r._status = c; return r; },
    json(b: unknown) { r._body = b; return r; },
    send(b: unknown) { r._body = b; return r; }, // respostas não-JSON (ex.: CSV)
    setHeader(k: string, v: unknown) { r._headers[k] = v; return r; },
  };
  return r;
}

export function mkReq(
  method: string,
  body: unknown,
  opts: { cookie?: string; csrf?: string; query?: Record<string, string> } = {},
): any {
  const headers: Record<string, unknown> = { 'x-forwarded-for': TEST_IP };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.csrf) headers['x-csrf-token'] = opts.csrf;
  return { method, body, headers, query: opts.query ?? {}, socket: { remoteAddress: TEST_IP } };
}

// Retorna o par "nome=valor" do Set-Cookie (sem os atributos), ou ''.
export function getCookie(res: any, name: string): string {
  const sc = res._headers['Set-Cookie'];
  const arr = Array.isArray(sc) ? sc : [sc];
  const hit = arr.map(String).find((c) => c.startsWith(name + '='));
  return hit ? hit.split(';')[0] : '';
}

export function cookieValue(pair: string): string {
  return pair.slice(pair.indexOf('=') + 1);
}

// Cria (recriando se já existir) um usuário de teste.
export async function seedUser(
  email: string,
  password: string,
  opts: { role?: 'director' | 'supervisor' | 'secretary'; mustChange?: boolean } = {},
): Promise<number> {
  await removeUser(email);
  const rows = await db
    .insert(users)
    .values({
      name: 'Teste',
      email,
      passwordHash: await hashPassword(password),
      role: opts.role ?? 'director',
      mustChangePassword: opts.mustChange ?? false,
    })
    .returning({ id: users.id });
  return rows[0].id;
}

export async function removeUser(...emails: string[]): Promise<void> {
  for (const email of emails) {
    await db.delete(users).where(eq(users.email, email));
  }
}

export async function clearAttempts(...emails: string[]): Promise<void> {
  for (const email of emails) {
    await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
  }
}

// Limpa as tentativas do IP de teste — o rate-limit por IP conta tentativas
// falhas de QUALQUER e-mail na janela, então rodadas repetidas acumulariam.
export async function clearAttemptsByIp(): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, TEST_IP));
}

// Faz login e devolve os cookies prontos pra usar nos testes autenticados.
export async function loginAs(email: string, password: string): Promise<{
  session: string; csrfPair: string; csrf: string; cookies: string;
}> {
  const res = mkRes();
  await login(mkReq('POST', { email, password }), res);
  const session = getCookie(res, 'ep_session');
  const csrfPair = getCookie(res, 'ep_csrf');
  return { session, csrfPair, csrf: cookieValue(csrfPair), cookies: `${session}; ${csrfPair}` };
}
