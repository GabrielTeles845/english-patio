// GET  /api/enrollments — lista paginada de matrículas/famílias (tela Alunos).
//        RBAC: os 3 papéis leem (supervisor só leitura). CPF mascarado (LGPD §3).
// POST /api/enrollments — cria matrícula manual (director/secretary). Mapeia o
//        FormData → enrollments + students + responsibles + addresses + contract
//        (pending). DASHBOARD_API §3 e §4.1/4.2, VALIDACOES §1–6.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../server/db/client';
import {
  enrollments,
  students,
  responsibles,
  addresses,
  contracts,
  contractTemplates,
  activityLog,
} from '../../server/db/schema';
import { ok, fail, zodFields, clientIp } from '../../server/lib/http';
import { getSession, csrfValid } from '../../server/lib/auth';
import { hasRole, ALL_ROLES } from '../../server/lib/rbac';
import { enrollmentDTO, studentDTO, responsibleDTO, addressDTO } from '../../server/lib/serializers';
import { EnrollmentEnvelope, EnrollmentFormSchema } from '../../server/lib/enrollmentInput';
import { buildEnrollmentConds } from '../../server/lib/enrollmentFilters';
import { onlyDigits, brDateToISO } from '../../server/lib/validators';
import { sendPushToRoles } from '../../server/lib/webpush';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const session = await getSession(req);
  if (!session) return fail(res, 401, 'UNAUTHENTICATED', 'Sessão expirada ou inválida.');
  if (!hasRole(session, ALL_ROLES)) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');

  if (req.method === 'POST') return createEnrollment(req, res, session);
  if (req.method !== 'GET') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const conds = buildEnrollmentConds(req.query as Record<string, unknown>);
  const where = conds.length ? and(...conds) : undefined;

  // ── página de matrículas (grão = família) + total ────────────────────────────
  const pageRows = await db
    .select()
    .from(enrollments)
    .where(where)
    .orderBy(desc(enrollments.submittedAt), desc(enrollments.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(where);
  const total = totalRows[0]?.c ?? 0;

  const ids = pageRows.map((e) => e.id);
  if (!ids.length) return ok(res, { items: [], page, pageSize, total });

  // ── carrega os filhos só das famílias da página ──────────────────────────────
  const kids = await db.select().from(students).where(inArray(students.enrollmentId, ids));
  const resps = await db.select().from(responsibles).where(inArray(responsibles.enrollmentId, ids));
  const addrs = await db.select().from(addresses).where(inArray(addresses.enrollmentId, ids));
  const ctrs = await db
    .select()
    .from(contracts)
    .where(inArray(contracts.enrollmentId, ids))
    .orderBy(desc(contracts.createdAt));

  const kidsBy = new Map<number, typeof kids>();
  for (const k of kids) (kidsBy.get(k.enrollmentId) ?? kidsBy.set(k.enrollmentId, []).get(k.enrollmentId)!).push(k);
  const respsBy = new Map<number, typeof resps>();
  for (const r of resps) (respsBy.get(r.enrollmentId) ?? respsBy.set(r.enrollmentId, []).get(r.enrollmentId)!).push(r);
  const legalBy = new Map<number, (typeof resps)[number]>();
  for (const r of resps) if (r.type === 'legal' && !legalBy.has(r.enrollmentId)) legalBy.set(r.enrollmentId, r);
  const addrBy = new Map<number, (typeof addrs)[number]>();
  for (const a of addrs) if (!addrBy.has(a.enrollmentId)) addrBy.set(a.enrollmentId, a);
  const contractBy = new Map<number, (typeof ctrs)[number]>(); // o mais recente (já ordenado desc)
  for (const c of ctrs) if (!contractBy.has(c.enrollmentId)) contractBy.set(c.enrollmentId, c);

  const items = pageRows.map((e) => {
    const ks = kidsBy.get(e.id) ?? [];
    const legal = legalBy.get(e.id);
    const addr = addrBy.get(e.id);
    const contract = contractBy.get(e.id);
    return {
      ...enrollmentDTO(e),
      kids: ks.map(studentDTO),
      kidCount: ks.length,
      responsible: legal ? responsibleDTO(legal) : null, // legal (CPF mascarado) — atalho p/ a UI
      responsibles: (respsBy.get(e.id) ?? []).map((r) => responsibleDTO(r)), // todos (CPF mascarado)
      address: addr ? addressDTO(addr) : null,
      neighborhood: addr?.neighborhood ?? null,
      contractStatus: contract?.status ?? null,
      contractId: contract?.id ?? null,
    };
  });

  return ok(res, { items, page, pageSize, total });
}

// ── POST: criação manual de matrícula ─────────────────────────────────────────
// Driver HTTP do Neon = sem transação interativa; validamos TUDO antes e
// inserimos em sequência (mesmo padrão das outras rotas).
async function createEnrollment(
  req: VercelRequest,
  res: VercelResponse,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
): Promise<void> {
  if (!hasRole(session, ['director', 'secretary'])) return fail(res, 403, 'FORBIDDEN', 'Sem permissão.');
  if (!csrfValid(req)) return fail(res, 403, 'CSRF', 'Requisição não autorizada (CSRF).');

  const env = EnrollmentEnvelope.safeParse(req.body ?? {});
  if (!env.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(env.error));
  const form = EnrollmentFormSchema.safeParse(env.data.formData);
  if (!form.success) return fail(res, 400, 'VALIDATION', 'Dados inválidos.', zodFields(form.error));
  const f = form.data;

  if (f.state.trim().toUpperCase() !== 'GO') {
    return fail(res, 422, 'OUTSIDE_GO', 'Atendemos apenas o estado de Goiás.', { state: 'Atendemos apenas Goiás.' });
  }

  // modelo de contrato ativo (se houver) carimba o contract.template_id.
  const tpl = await db.select({ id: contractTemplates.id }).from(contractTemplates).where(eq(contractTemplates.isActive, true)).limit(1);
  const templateId = tpl.length ? tpl[0].id : null;

  const ins = await db
    .insert(enrollments)
    .values({
      source: env.data.source, // 'manual'
      submissionId: `manual-${randomUUID()}`,
      classFormat: f.classFormat,
      paymentMethod: 'boleto-6x',
      financialResponsibleType: f.financialResponsibleType,
      requestedDayPair: f.schedule,
      requestedTimes: {
        day1Start: f.scheduleDay1Start, day1End: f.scheduleDay1End,
        day2Start: f.scheduleDay2Start, day2End: f.scheduleDay2End,
      },
      authorizationMedia: f.authorizationMedia,
      authorizationContract: f.authorizationContract,
      scheduleConfirmed: f.scheduleConfirmed,
      period: env.data.period,
    })
    .returning();
  const enrollmentId = ins[0].id;

  // alunos (kids) — sem turma de início (entram na fila).
  const studentRows = [
    { enrollmentId, name: f.student1Name.trim(), birthDate: brDateToISO(f.student1BirthDate)! },
    ...(f.hasStudent2
      ? [{ enrollmentId, name: f.student2Name.trim(), birthDate: brDateToISO(f.student2BirthDate)! }]
      : []),
  ];
  const insertedStudents = await db.insert(students).values(studentRows).returning();

  // responsáveis: legal sempre; second se houver; financial só quando type='other'.
  const respRows: (typeof responsibles.$inferInsert)[] = [
    {
      enrollmentId, type: 'legal', name: f.responsibleName.trim(), cpf: onlyDigits(f.responsibleCPF),
      phone: onlyDigits(f.responsiblePhone), email: f.responsibleEmail.trim(),
      relationship: f.responsibleRelationship.trim(), birthDate: brDateToISO(f.responsibleBirthDate),
    },
  ];
  if (f.hasSecondResponsible) {
    respRows.push({
      enrollmentId, type: 'second', name: f.secondResponsibleName.trim(),
      cpf: f.secondResponsibleCPF ? onlyDigits(f.secondResponsibleCPF) : null,
      phone: onlyDigits(f.secondResponsiblePhone), relationship: f.secondResponsibleRelationship.trim(),
    });
  }
  if (f.financialResponsibleType === 'other') {
    respRows.push({
      enrollmentId, type: 'financial', name: f.financialResponsibleName.trim(),
      cpf: onlyDigits(f.financialResponsibleCPF),
    });
  }
  await db.insert(responsibles).values(respRows);

  await db.insert(addresses).values({
    enrollmentId, cep: onlyDigits(f.cep), street: f.street.trim(), number: f.number.trim(),
    complement: f.complement?.trim() || null, neighborhood: f.neighborhood.trim(),
    city: f.city.trim(), state: 'GO',
  });

  const ctr = await db.insert(contracts).values({ enrollmentId, status: 'pending', templateId }).returning();

  await db.insert(activityLog).values({
    actorType: 'user', actorId: session.user.id, action: 'enrollment_created',
    targetType: 'enrollment', targetId: enrollmentId,
    detail: { student: f.student1Name.trim(), source: env.data.source }, ip: clientIp(req),
  });

  // notifica diretores + secretaria ativos (sino — §12). INSERT...SELECT atômico:
  // seleciona e grava numa única instrução (sem janela entre ler destinatários e
  // inserir). Best-effort: a matrícula já está criada (driver HTTP não tem
  // transação), então uma falha aqui não deve derrubar o request.
  try {
    await db.execute(sql`
      INSERT INTO notifications (user_id, type, title, body, student_id)
      SELECT u.id, 'enroll', 'Nova matrícula', ${f.student1Name.trim()}, ${insertedStudents[0].id}
      FROM users u
      WHERE u.is_active = true AND u.role IN ('director', 'secretary')
    `);
  } catch (err) {
    console.error('enrollment_created: falha ao gerar notificações', err);
  }

  // Web Push (notificação no computador) — mesmo público do sino, best-effort.
  await sendPushToRoles(['director', 'secretary'], {
    title: 'Nova matrícula',
    body: f.student1Name.trim(),
    url: '/dashboard/alunos',
    tag: 'enroll',
  });

  return ok(res, { enrollmentId, students: insertedStudents.map(studentDTO), contractId: ctr[0].id }, 201);
}
