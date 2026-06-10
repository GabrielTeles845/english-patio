// Serializers de saída (DB → DTO da API). Datas em ISO 8601 (API §0); a UI formata.
import type { rooms } from '../db/schema';

export function roomDTO(r: typeof rooms.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    teacherName: r.teacherName,
    isActive: r.isActive,
    updatedAt: r.updatedAt,
  };
}
