// Validações de aplicação reaproveitáveis no backend (espelham src/utils/validators
// onde aplicável). Mantidas puras (sem deps) para serem testáveis em unidade.

const CONNECTORS = new Set(['e', 'de', 'da', 'do', 'dos', 'das']);

// Nome completo = >=2 partes significativas, ignorando conectores PT (VALIDACOES §9/§1).
export function isFullName(name: string): boolean {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !CONNECTORS.has(p.toLowerCase()));
  return parts.length >= 2;
}

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

// CPF com dígitos verificadores (port de src/utils/validators.ts). VALIDACOES §2.
export function isValidCPF(cpf: string): boolean {
  const c = onlyDigits(cpf);
  if (c.length !== 11) return false;
  if (/^(\d)\1+$/.test(c)) return false; // todos iguais
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c.charAt(i), 10) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(c.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c.charAt(i), 10) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(c.charAt(10), 10);
}

// Telefone: 11 dígitos, 3º dígito = 9 (celular). VALIDACOES §2.
export function isValidPhone(phone: string): boolean {
  const p = onlyDigits(phone);
  return p.length === 11 && p.charAt(2) === '9';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidCEP(cep: string): boolean {
  return onlyDigits(cep).length === 8;
}

// Converte dd/mm/aaaa → Date (ou null se inválida, ex.: 31/02). Port do front.
export function parseBrDate(dateStr: string): Date | null {
  const c = onlyDigits(dateStr);
  if (c.length !== 8) return null;
  const day = parseInt(c.substring(0, 2), 10);
  const month = parseInt(c.substring(2, 4), 10) - 1;
  const year = parseInt(c.substring(4, 8), 10);
  const d = new Date(year, month, day);
  if (d.getDate() !== day || d.getMonth() !== month || d.getFullYear() !== year) return null;
  return d;
}

// dd/mm/aaaa → 'aaaa-mm-dd' (formato da coluna `date`), ou null.
export function brDateToISO(dateStr: string): string | null {
  const d = parseBrDate(dateStr);
  if (!d) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Idade em anos completos na data de hoje (a partir de dd/mm/aaaa), ou null.
export function ageFromBrDate(dateStr: string): number | null {
  const d = parseBrDate(dateStr);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

// Aluno: data real, não-futura, idade ≤ 20 (VALIDACOES §1).
export function isValidStudentBirthDate(dateStr: string): boolean {
  const d = parseBrDate(dateStr);
  if (!d || d > new Date()) return false;
  const age = ageFromBrDate(dateStr);
  return age !== null && age <= 20;
}

// Responsável: data real, não-futura, idade ≥ 18 (VALIDACOES §2).
export function isValidResponsibleBirthDate(dateStr: string): boolean {
  const d = parseBrDate(dateStr);
  if (!d || d > new Date()) return false;
  const age = ageFromBrDate(dateStr);
  return age !== null && age >= 18;
}
