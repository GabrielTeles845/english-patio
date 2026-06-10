// Serializers de saída (DB → DTO da API). Datas em ISO 8601 (API §0); a UI formata.
import type { rooms, classes, users } from '../db/schema';

// Nunca expõe password_hash.
export function userDTO(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

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
