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
