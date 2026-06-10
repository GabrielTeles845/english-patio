// Sessão stateless em JWT (DASHBOARD_PLAN §3, API §0).
// JWT curto (~15 min) com renovação deslizante + vida máxima absoluta (~12h)
// gravada no token (claim `mca`). Sem tabela de sessões nem refresh token.
import { SignJWT, jwtVerify } from 'jose';

const SLIDING_TTL_SECONDS = 15 * 60; // janela curta re-emitida a cada request
const ABSOLUTE_TTL_SECONDS = 12 * 60 * 60; // vida máxima absoluta da sessão

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET não definida — configure no ambiente (ver .env.example).');
  return new TextEncoder().encode(s);
}

export interface SessionClaims {
  sub: number; // id do usuário
  role: string;
  name: string;
  email: string;
  pwdAt: number; // password_changed_at no momento da emissão (epoch s; 0 se null)
  mca: number; // max cumulative age — expiração absoluta (epoch s)
}

interface SeedUser {
  id: number;
  role: string;
  name: string;
  email: string;
  passwordChangedAt: Date | null;
}

function pwdAtSeconds(at: Date | null): number {
  return at ? Math.floor(at.getTime() / 1000) : 0;
}

// Claims de uma sessão recém-criada (login): fixa a vida máxima absoluta a partir de agora.
export function createSessionClaims(user: SeedUser): SessionClaims {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    pwdAt: pwdAtSeconds(user.passwordChangedAt),
    mca: nowSec + ABSOLUTE_TTL_SECONDS,
  };
}

// Assina (ou re-assina, na renovação deslizante) preservando o `mca` original.
export async function signSession(claims: SessionClaims): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = Math.min(nowSec + SLIDING_TTL_SECONDS, claims.mca);
  return new SignJWT({
    role: claims.role,
    name: claims.name,
    email: claims.email,
    pwdAt: claims.pwdAt,
    mca: claims.mca,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(claims.sub))
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret());
}

// Verifica assinatura + expiração (jose) e a vida máxima absoluta (`mca`).
export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const mca = Number(payload.mca);
    const nowSec = Math.floor(Date.now() / 1000);
    if (!mca || nowSec >= mca) return null; // vida máxima absoluta estourada
    return {
      sub: Number(payload.sub),
      role: String(payload.role),
      name: String(payload.name),
      email: String(payload.email),
      pwdAt: Number(payload.pwdAt ?? 0),
      mca,
    };
  } catch {
    return null;
  }
}
