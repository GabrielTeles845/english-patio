// GET   /api/enrollments/:id — detalhe completo da família (os 3 papéis). Revela
//         CPF inteiro ⇒ log view_student_pii (LGPD §3).
// PATCH /api/enrollments/:id — edita kids/responsáveis/endereço/"na escola desde"
//         (director/secretary). Escrita otimista: o cliente manda o updatedAt que
//         leu; se a matrícula mudou desde então ⇒ 409 STALE_WRITE. DASHBOARD_API §3/§4.3.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import {
  enrollments,
  students,
  responsibles,
  addresses,
  contracts,
  activityLog,
} from '../../server/db/schema';
import { ok, fail, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../server/lib/rbac';
import {
  enrollmentDTO,
  studentDTO,
  responsibleDTO,
  addressDTO,
  contractDTO,
} from '../../server/lib/serializers';
import {
  isFullName,
  isValidCPF,
  isValidPhone,
  isValidEmail,
  isValidCEP,
  isValidStudentISODate,
  isValidResponsibleISODate,
  parseISODate,
  onlyDigits,
} from '../../server/lib/validators';

const NAME_MSG = 'Digite o nome completo (nome e sobrenome).';
const CPF_MSG = 'CPF inválido.';
const PHONE_MSG = 'Telefone deve começar com 9: (XX) 9XXXX-XXXX.';

async function loadFamily(id: number, revealCpf: boolean) {
  const found = await db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1);
  if (!found.length) return null;
  const kids = await db.select().from(students).where(eq(students.enrollmentId, id)).orderBy(asc(students.id));
  const resps = await db.select().from(responsibles).where(eq(responsibles.enrollmentId, id)).orderBy(asc(responsibles.id));
  const addr = await db.select().from(addresses).where(eq(addresses.enrollmentId, id)).limit(1);
  const ctrs = await db.select().from(contracts).where(eq(contracts.enrollmentId, id)).orderBy(desc(contracts.createdAt));
  return {
    enrollment: found[0],
    dto: {
      ...enrollmentDTO(found[0]),
      students: kids.map(studentDTO),
      responsibles: resps.map((r) => responsibleDTO(r, { revealCpf })),
      address: addr.length ? addressDTO(addr[0]) : null,
      contracts: ctrs.map(contractDTO),
      contract: ctrs.length ? contractDTO(ctrs[0]) : null,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'VALIDATION', 'ID inválido.');

  if (req.method === 'GET') {
    const fam = await loadFamily(id, true);
    if (!fam) return fail(res, 404, 'NOT_FOUND', 'Matrícula não encontrada.');
    await db.insert(activityLog).values({
      actorType: 'user', actorId: session.user.id, action: 'view_student_pii',
      targetType: 'enrollment', targetId: id, ip: clientIp(req),
    });
    return ok(res, fam.dto);
  }

  if (req.method === 'PATCH') return editEnrollment(req, res, session, id);

  return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
}

const EditBody = z.object({
  expectedUpdatedAt: z.string().min(1),
  students: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string().optional(),
    birthDate: z.string().optional(),
    atSchoolSince: z.string().nullable().optional(),
  })).optional(),
  responsibles: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string().optional(),
    cpf: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    relationship: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional(),
  })).optional(),
  address: z.object({
    cep: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().nullable().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  authorizationMedia: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

async function editEnrollment(
  req: VercelRequest,
  res: VercelResponse,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  id: number,
): Promise<void> {
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const parsed = EditBody.safeParse(req.body ?? {});
  if (!parsed.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.');
  const body = parsed.data;

  const found = await db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Matrícula não encontrada.');

  // escrita otimista: a matrícula mudou desde que o cliente leu?
  if (new Date(body.expectedUpdatedAt).getTime() !== found[0].updatedAt.getTime()) {
    return fail(res, 409, 'STALE_WRITE', 'A matrícula foi alterada por outra pessoa. Recarregue e tente de novo.');
  }

  // valida só os campos enviados; acumula tudo num mapa de erros.
  const fields: Record<string, string> = {};
  (body.students ?? []).forEach((s, i) => {
    if (s.name !== undefined && !isFullName(s.name)) fields[`students.${i}.name`] = NAME_MSG;
    if (s.birthDate !== undefined && !isValidStudentISODate(s.birthDate)) fields[`students.${i}.birthDate`] = 'Data inválida (aluno ≤ 20 anos).';
    if (s.atSchoolSince != null && s.atSchoolSince !== '' && !parseISODate(s.atSchoolSince)) fields[`students.${i}.atSchoolSince`] = 'Data inválida.';
  });
  (body.responsibles ?? []).forEach((r, i) => {
    if (r.name !== undefined && !isFullName(r.name)) fields[`responsibles.${i}.name`] = NAME_MSG;
    if (r.cpf != null && r.cpf !== '' && !isValidCPF(r.cpf)) fields[`responsibles.${i}.cpf`] = CPF_MSG;
    if (r.phone != null && r.phone !== '' && !isValidPhone(r.phone)) fields[`responsibles.${i}.phone`] = PHONE_MSG;
    if (r.email != null && r.email !== '' && !isValidEmail(r.email)) fields[`responsibles.${i}.email`] = 'E-mail inválido.';
    if (r.relationship !== undefined && !(r.relationship ?? '').trim()) fields[`responsibles.${i}.relationship`] = 'Campo obrigatório.';
    if (r.birthDate != null && r.birthDate !== '' && !isValidResponsibleISODate(r.birthDate)) fields[`responsibles.${i}.birthDate`] = 'Responsável deve ter ≥ 18 anos.';
  });
  if (body.address) {
    const a = body.address;
    if (a.cep !== undefined && !isValidCEP(a.cep)) fields['address.cep'] = 'CEP inválido.';
    if (a.street !== undefined && !a.street.trim()) fields['address.street'] = 'Campo obrigatório.';
    if (a.number !== undefined && !a.number.trim()) fields['address.number'] = 'Campo obrigatório.';
    if (a.neighborhood !== undefined && !a.neighborhood.trim()) fields['address.neighborhood'] = 'Campo obrigatório.';
    if (a.city !== undefined && !a.city.trim()) fields['address.city'] = 'Campo obrigatório.';
  }
  if (Object.keys(fields).length) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', fields);

  // checa que os ids enviados pertencem mesmo a esta matrícula (não vaza/edita alheio).
  const famKids = new Set((await db.select({ id: students.id }).from(students).where(eq(students.enrollmentId, id))).map((s) => s.id));
  for (const s of body.students ?? []) if (!famKids.has(s.id)) return fail(res, 404, 'NOT_FOUND', 'Aluno não pertence a esta matrícula.');
  const famResps = new Set((await db.select({ id: responsibles.id }).from(responsibles).where(eq(responsibles.enrollmentId, id))).map((r) => r.id));
  for (const r of body.responsibles ?? []) if (!famResps.has(r.id)) return fail(res, 404, 'NOT_FOUND', 'Responsável não pertence a esta matrícula.');

  const now = new Date();
  for (const s of body.students ?? []) {
    const set: Record<string, unknown> = { updatedAt: now };
    if (s.name !== undefined) set.name = s.name.trim();
    if (s.birthDate !== undefined) set.birthDate = s.birthDate;
    if (s.atSchoolSince !== undefined) set.atSchoolSince = s.atSchoolSince || null;
    await db.update(students).set(set).where(eq(students.id, s.id));
  }
  for (const r of body.responsibles ?? []) {
    const set: Record<string, unknown> = { updatedAt: now };
    if (r.name !== undefined) set.name = r.name.trim();
    if (r.cpf !== undefined) set.cpf = r.cpf ? onlyDigits(r.cpf) : null;
    if (r.phone !== undefined) set.phone = r.phone ? onlyDigits(r.phone) : null;
    if (r.email !== undefined) set.email = r.email?.trim() || null;
    if (r.relationship !== undefined) set.relationship = r.relationship?.trim() || null;
    if (r.birthDate !== undefined) set.birthDate = r.birthDate || null;
    await db.update(responsibles).set(set).where(eq(responsibles.id, r.id));
  }
  if (body.address) {
    const a = body.address;
    const set: Record<string, unknown> = { updatedAt: now };
    if (a.cep !== undefined) set.cep = onlyDigits(a.cep);
    if (a.street !== undefined) set.street = a.street.trim();
    if (a.number !== undefined) set.number = a.number.trim();
    if (a.complement !== undefined) set.complement = a.complement?.trim() || null;
    if (a.neighborhood !== undefined) set.neighborhood = a.neighborhood.trim();
    if (a.city !== undefined) set.city = a.city.trim();
    await db.update(addresses).set(set).where(eq(addresses.enrollmentId, id));
  }

  // bump do updatedAt da matrícula = novo token de concorrência da família.
  const enrSet: Record<string, unknown> = { updatedAt: now };
  if (body.authorizationMedia !== undefined) enrSet.authorizationMedia = body.authorizationMedia;
  if (body.notes !== undefined) enrSet.notes = body.notes || null;
  await db.update(enrollments).set(enrSet).where(eq(enrollments.id, id));

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'enrollment_updated',
    targetType: 'enrollment', targetId: id,
    detail: {
      students: (body.students ?? []).length,
      responsibles: (body.responsibles ?? []).length,
      address: !!body.address,
    },
    ip: clientIp(req),
  });

  const fresh = await loadFamily(id, true);
  return ok(res, fresh!.dto);
}
