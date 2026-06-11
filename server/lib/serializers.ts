// Serializers de saída (DB → DTO da API). Datas em ISO 8601 (API §0); a UI formata.
import type {
  rooms,
  classes,
  users,
  notifications,
  enrollments,
  students,
  responsibles,
  addresses,
  contracts,
} from '../db/schema';

export function notificationDTO(n: typeof notifications.$inferSelect) {
  return {
    id: n.id,
    type: n.type,
    studentId: n.studentId,
    title: n.title,
    body: n.body,
    readAt: n.readAt,
    createdAt: n.createdAt,
  };
}

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

// ── CPF: formatação e máscara LGPD ──────────────────────────────────────────
// O banco guarda 11 dígitos sem máscara (enrollment.ts). A lista expõe o CPF
// MASCARADO (API §3); o detalhe revela o CPF inteiro, mas grava log de acesso.
export function formatCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function maskCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return null;
  // mantém os 3 primeiros e os 2 dígitos verificadores; oculta o miolo.
  return `${d.slice(0, 3)}.•••.•••-${d.slice(9, 11)}`;
}

export function enrollmentDTO(e: typeof enrollments.$inferSelect) {
  return {
    id: e.id,
    status: e.status,
    source: e.source,
    classFormat: e.classFormat,
    paymentMethod: e.paymentMethod,
    financialResponsibleType: e.financialResponsibleType,
    requestedDayPair: e.requestedDayPair,
    requestedTimes: e.requestedTimes,
    authorizationMedia: e.authorizationMedia,
    authorizationContract: e.authorizationContract,
    scheduleConfirmed: e.scheduleConfirmed,
    period: e.period,
    notes: e.notes,
    submittedAt: e.submittedAt,
    updatedAt: e.updatedAt,
  };
}

export function studentDTO(s: typeof students.$inferSelect) {
  return {
    id: s.id,
    enrollmentId: s.enrollmentId,
    name: s.name,
    birthDate: s.birthDate,
    classId: s.classId,
    atSchoolSince: s.atSchoolSince,
    isActive: s.isActive,
    exitReason: s.exitReason,
    exitNote: s.exitNote,
    exitDate: s.exitDate,
    updatedAt: s.updatedAt,
  };
}

// revealCpf=false → máscara (lista). true → CPF inteiro (detalhe, com log).
export function responsibleDTO(
  r: typeof responsibles.$inferSelect,
  { revealCpf = false }: { revealCpf?: boolean } = {},
) {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    cpf: revealCpf ? formatCpf(r.cpf) : maskCpf(r.cpf),
    phone: r.phone,
    email: r.email,
    relationship: r.relationship,
    birthDate: r.birthDate,
    updatedAt: r.updatedAt,
  };
}

export function addressDTO(a: typeof addresses.$inferSelect) {
  return {
    id: a.id,
    cep: a.cep,
    street: a.street,
    number: a.number,
    complement: a.complement,
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
    updatedAt: a.updatedAt,
  };
}

export function contractDTO(c: typeof contracts.$inferSelect) {
  return {
    id: c.id,
    enrollmentId: c.enrollmentId,
    templateId: c.templateId,
    pdfUrl: c.pdfUrl,
    status: c.status,
    sentVia: c.sentVia,
    sentAt: c.sentAt,
    viewedAt: c.viewedAt,
    signedAt: c.signedAt,
    rejectedAt: c.rejectedAt,
    failedAt: c.failedAt,
    createdAt: c.createdAt,
  };
}
