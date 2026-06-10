// Hash e política de senha (DASHBOARD_PLAN §3, VALIDACOES §8).
// bcryptjs (JS puro) em vez de bcrypt nativo — compila sem dor no serverless.
import bcrypt from 'bcryptjs';

const COST = 12; // bcrypt cost >= 12 (PLAN §3)

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Política decidida 08/Jun: >=10 chars com maiúscula, minúscula, número e especial.
// Retorna null se ok, ou a mensagem do 1º problema encontrado.
export function validatePasswordPolicy(pw: string): string | null {
  if (pw.length < 10) return 'A senha deve ter ao menos 10 caracteres.';
  if (!/[A-Z]/.test(pw)) return 'A senha deve conter ao menos uma letra maiúscula.';
  if (!/[a-z]/.test(pw)) return 'A senha deve conter ao menos uma letra minúscula.';
  if (!/[0-9]/.test(pw)) return 'A senha deve conter ao menos um número.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'A senha deve conter ao menos um caractere especial.';
  return null;
}
