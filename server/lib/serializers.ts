// Serializers de saída (DB → DTO da API). Datas em ISO 8601 (API §0); a UI formata.
import type { rooms, classes } from '../db/schema';

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

export function classDTO(c: typeof classes.$inferSelect, occupancy: number) {
  return {
    id: c.id,
    roomId: c.roomId,
    dayPair: c.dayPair,
    startTime: c.startTime,
    levelId: c.levelId,
    capacity: c.capacity,
    occupancy,
    period: c.period,
    isActive: c.isActive,
    updatedAt: c.updatedAt,
  };
}
