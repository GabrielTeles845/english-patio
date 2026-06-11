// Regras de modelo de contrato. field_map = lista de campos com coordenadas
// (como o pdfService atual); ativar exige TODOS mapeados. DASHBOARD_API §7.
import { z } from 'zod';

export const FieldMapSchema = z.array(
  z.object({
    key: z.string().min(1),
    label: z.string().optional(),
    src: z.string().optional(),
    page: z.number().int().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    mapped: z.boolean().optional(),
  }),
);
export type FieldMap = z.infer<typeof FieldMapSchema>;

// Mapeado = mapped===true OU tem coordenadas (page/x/y). Conta os pendentes.
export function unmappedCount(fieldMap: unknown): number {
  const parsed = FieldMapSchema.safeParse(fieldMap);
  if (!parsed.success) return -1; // formato inválido
  return parsed.data.filter((f) => !(f.mapped === true || (f.page != null && f.x != null && f.y != null))).length;
}
