// GET   /api/enrollments/:id — detalhe completo da família (os 3 papéis). Revela
//         CPF inteiro ⇒ log view_student_pii (LGPD §3).
// PATCH /api/enrollments/:id — edita kids/responsáveis/endereço/"na escola desde"
//         (director/secretary). Escrita otimista: o cliente manda o updatedAt que
//         leu; se a matrícula mudou desde então ⇒ 409 STALE_WRITE. DASHBOARD_API §3/§4.3.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../server/db/client';
import {
  enrollments,
  students,
  responsibles,
  addresses,
  contracts,
  contractEvents,
  notifications,
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
  if (req.method === 'DELETE') return deleteEnrollment(req, res, session, id);

  return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
}

// DELETE — exclui a matrícula de vez (cadastro errado/teste). RBAC director/
// secretary. Sem transação (driver HTTP) → apaga os filhos em ordem de FK.
async function deleteEnrollment(
  req: VercelRequest,
  res: VercelResponse,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  id: number,
): Promise<void> {
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const found = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.id, id)).limit(1);
  if (!found.length) return fail(res, 404, 'NOT_FOUND', 'Matrícula não encontrada.');

  const kidIds = (await db.select({ id: students.id }).from(students).where(eq(students.enrollmentId, id))).map((s) => s.id);
  const ctrIds = (await db.select({ id: contracts.id }).from(contracts).where(eq(contracts.enrollmentId, id))).map((c) => c.id);
  if (kidIds.length) await db.delete(notifications).where(inArray(notifications.studentId, kidIds));
  if (ctrIds.length) await db.delete(contractEvents).where(inArray(contractEvents.contractId, ctrIds));
  await db.delete(contracts).where(eq(contracts.enrollmentId, id));
  await db.delete(students).where(eq(students.enrollmentId, id));
  await db.delete(responsibles).where(eq(responsibles.enrollmentId, id));
  await db.delete(addresses).where(eq(addresses.enrollmentId, id));
  await db.delete(enrollments).where(eq(enrollments.id, id));

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'enrollment_removed',
    targetType: 'enrollment', targetId: id, ip: clientIp(req),
  });

  return ok(res, { id });
}

// Edição declarativa por papel (há no máx. 1 responsável de cada tipo):
//  - legalResponsible: edita o responsável legal (sempre existe).
//  - secondResponsible: objeto = cria/atualiza o 2º responsável; null = remove.
//  - financialResponsibleType + financialResponsible: troca quem é o financeiro;
//    a entidade type='financial' existe só quando o tipo é 'other'.
const EditBody = z.object({
  expectedUpdatedAt: z.string().min(1),
  students: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string().optional(),
    birthDate: z.string().optional(),
    atSchoolSince: z.string().nullable().optional(),
  })).optional(),
  legalResponsible: z.object({
    name: z.string().optional(),
    cpf: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    relationship: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional(),
  }).optional(),
  secondResponsible: z.object({
    name: z.string(),
    cpf: z.string().nullable().optional(),
    phone: z.string(),
    relationship: z.string(),
  }).nullable().optional(),
  financialResponsibleType: z.enum(['legal', 'second', 'other']).optional(),
  financialResponsible: z.object({
    name: z.string(),
    cpf: z.string(),
  }).nullable().optional(),
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

  // responsáveis atuais (no máx. 1 de cada tipo)
  const curResps = await db.select().from(responsibles).where(eq(responsibles.enrollmentId, id));
  const legalCur = curResps.find((r) => r.type === 'legal');
  const secondCur = curResps.find((r) => r.type === 'second');
  const financialCur = curResps.find((r) => r.type === 'financial');

  // valida só os campos enviados; acumula tudo num mapa de erros.
  const fields: Record<string, string> = {};
  (body.students ?? []).forEach((s, i) => {
    if (s.name !== undefined && !isFullName(s.name)) fields[`students.${i}.name`] = NAME_MSG;
    if (s.birthDate !== undefined && !isValidStudentISODate(s.birthDate)) fields[`students.${i}.birthDate`] = 'Data inválida (aluno ≤ 20 anos).';
    if (s.atSchoolSince != null && s.atSchoolSince !== '' && !parseISODate(s.atSchoolSince)) fields[`students.${i}.atSchoolSince`] = 'Data inválida.';
  });
  if (body.legalResponsible) {
    const l = body.legalResponsible;
    if (l.name !== undefined && !isFullName(l.name)) fields['legalResponsible.name'] = NAME_MSG;
    if (l.cpf != null && l.cpf !== '' && !isValidCPF(l.cpf)) fields['legalResponsible.cpf'] = CPF_MSG;
    if (l.phone != null && l.phone !== '' && !isValidPhone(l.phone)) fields['legalResponsible.phone'] = PHONE_MSG;
    if (l.email != null && l.email !== '' && !isValidEmail(l.email)) fields['legalResponsible.email'] = 'E-mail inválido.';
    if (l.relationship !== undefined && !(l.relationship ?? '').trim()) fields['legalResponsible.relationship'] = 'Campo obrigatório.';
    if (l.birthDate != null && l.birthDate !== '' && !isValidResponsibleISODate(l.birthDate)) fields['legalResponsible.birthDate'] = 'Responsável deve ter ≥ 18 anos.';
  }
  if (body.secondResponsible) {
    const s = body.secondResponsible;
    if (!isFullName(s.name)) fields['secondResponsible.name'] = NAME_MSG;
    if (!isValidPhone(s.phone)) fields['secondResponsible.phone'] = PHONE_MSG;
    if (!s.relationship.trim()) fields['secondResponsible.relationship'] = 'Campo obrigatório.';
    if (s.cpf != null && s.cpf !== '' && !isValidCPF(s.cpf)) fields['secondResponsible.cpf'] = CPF_MSG;
  }
  // financeiro: tipo final + coerência (precisa existir o papel escolhido).
  const finalType = body.financialResponsibleType ?? found[0].financialResponsibleType;
  const willHaveSecond = body.secondResponsible === null ? false : body.secondResponsible !== undefined ? true : !!secondCur;
  if (body.financialResponsible) {
    if (!isFullName(body.financialResponsible.name)) fields['financialResponsible.name'] = NAME_MSG;
    if (!isValidCPF(body.financialResponsible.cpf)) fields['financialResponsible.cpf'] = CPF_MSG;
  }
  if (finalType === 'other' && !body.financialResponsible && !financialCur)
    fields['financialResponsible'] = 'Informe o nome e o CPF do responsável financeiro.';
  if (finalType === 'second' && !willHaveSecond)
    fields['financialResponsibleType'] = 'Não há segundo responsável para ser o financeiro.';
  if (body.address) {
    const a = body.address;
    if (a.cep !== undefined && !isValidCEP(a.cep)) fields['address.cep'] = 'CEP inválido.';
    if (a.street !== undefined && !a.street.trim()) fields['address.street'] = 'Campo obrigatório.';
    if (a.number !== undefined && !a.number.trim()) fields['address.number'] = 'Campo obrigatório.';
    if (a.neighborhood !== undefined && !a.neighborhood.trim()) fields['address.neighborhood'] = 'Campo obrigatório.';
    if (a.city !== undefined && !a.city.trim()) fields['address.city'] = 'Campo obrigatório.';
  }
  if (Object.keys(fields).length) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', fields);

  // checa que os alunos enviados pertencem mesmo a esta matrícula (não edita alheio).
  const famKids = new Set((await db.select({ id: students.id }).from(students).where(eq(students.enrollmentId, id))).map((s) => s.id));
  for (const s of body.students ?? []) if (!famKids.has(s.id)) return fail(res, 404, 'NOT_FOUND', 'Aluno não pertence a esta matrícula.');

  const now = new Date();
  for (const s of body.students ?? []) {
    const set: Record<string, unknown> = { updatedAt: now };
    if (s.name !== undefined) set.name = s.name.trim();
    if (s.birthDate !== undefined) set.birthDate = s.birthDate;
    if (s.atSchoolSince !== undefined) set.atSchoolSince = s.atSchoolSince || null;
    await db.update(students).set(set).where(eq(students.id, s.id));
  }
  // responsável legal (sempre existe): edita os campos enviados
  if (body.legalResponsible && legalCur) {
    const l = body.legalResponsible;
    const set: Record<string, unknown> = { updatedAt: now };
    if (l.name !== undefined) set.name = l.name.trim();
    if (l.cpf !== undefined) set.cpf = l.cpf ? onlyDigits(l.cpf) : null;
    if (l.phone !== undefined) set.phone = l.phone ? onlyDigits(l.phone) : null;
    if (l.email !== undefined) set.email = l.email?.trim() || null;
    if (l.relationship !== undefined) set.relationship = l.relationship?.trim() || null;
    if (l.birthDate !== undefined) set.birthDate = l.birthDate || null;
    await db.update(responsibles).set(set).where(eq(responsibles.id, legalCur.id));
  }
  // 2º responsável: null = remove; objeto = cria ou atualiza (uq por tipo garante 1 só)
  if (body.secondResponsible === null) {
    if (secondCur) await db.delete(responsibles).where(eq(responsibles.id, secondCur.id));
  } else if (body.secondResponsible) {
    const s = body.secondResponsible;
    const vals = { name: s.name.trim(), cpf: s.cpf ? onlyDigits(s.cpf) : null, phone: onlyDigits(s.phone), relationship: s.relationship.trim(), updatedAt: now };
    if (secondCur) await db.update(responsibles).set(vals).where(eq(responsibles.id, secondCur.id));
    else await db.insert(responsibles).values({ enrollmentId: id, type: 'second', ...vals });
  }
  // financeiro: a entidade type='financial' existe só quando o tipo é 'other'
  if (finalType === 'other') {
    const f = body.financialResponsible;
    if (f) {
      const vals = { name: f.name.trim(), cpf: onlyDigits(f.cpf), updatedAt: now };
      if (financialCur) await db.update(responsibles).set(vals).where(eq(responsibles.id, financialCur.id));
      else await db.insert(responsibles).values({ enrollmentId: id, type: 'financial', ...vals });
    }
    // sem dados novos mas com financeiro já existente → mantém
  } else if (financialCur) {
    await db.delete(responsibles).where(eq(responsibles.id, financialCur.id)); // virou legal/segundo → remove a entidade
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
  if (body.financialResponsibleType !== undefined) enrSet.financialResponsibleType = body.financialResponsibleType;
  if (body.notes !== undefined) enrSet.notes = body.notes || null;
  await db.update(enrollments).set(enrSet).where(eq(enrollments.id, id));

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'enrollment_updated',
    targetType: 'enrollment', targetId: id,
    detail: {
      students: (body.students ?? []).length,
      legal: !!body.legalResponsible,
      second: body.secondResponsible === null ? 'removed' : body.secondResponsible ? 'upserted' : 'untouched',
      financialType: body.financialResponsibleType ?? null,
      address: !!body.address,
    },
    ip: clientIp(req),
  });

  const fresh = await loadFamily(id, true);
  return ok(res, fresh!.dto);
}
