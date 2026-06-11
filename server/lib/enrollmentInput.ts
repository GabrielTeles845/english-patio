// Validação + mapeamento do payload de criação de matrícula (DASHBOARD_API §4.1/4.2,
// bateria VALIDACOES §1–6). O shape do formulário espelha src/types/enrollment.ts
// (FormData). superRefine acumula TODOS os erros de campo de uma vez.
import { z } from 'zod';
import { START_TIMES } from './agenda';
import {
  isFullName,
  isValidCPF,
  isValidPhone,
  isValidEmail,
  isValidCEP,
  isValidStudentBirthDate,
  isValidResponsibleBirthDate,
} from './validators';

const NAME_MSG = 'Digite o nome completo (nome e sobrenome).';
const CPF_MSG = 'CPF inválido.';
const PHONE_MSG = 'Telefone deve começar com 9: (XX) 9XXXX-XXXX.';
const STARTS = new Set<string>(START_TIMES);

// Envelope da requisição: { source?, period, formData }.
export const EnrollmentEnvelope = z.object({
  source: z.enum(['manual']).optional().default('manual'),
  period: z.string().regex(/^\d{4}\.[12]$/, 'Período inválido (ex.: 2026.2).'),
  formData: z.record(z.string(), z.unknown()),
});

// FormData (campos do formulário). Tipos/enums no Zod; regras de negócio no refine.
export const EnrollmentFormSchema = z
  .object({
    student1Name: z.string(),
    student1BirthDate: z.string(),
    student1Age: z.string().optional(),
    hasStudent2: z.boolean(),
    student2Name: z.string().optional().default(''),
    student2BirthDate: z.string().optional().default(''),
    student2Age: z.string().optional().default(''),

    responsibleName: z.string(),
    responsibleBirthDate: z.string(),
    responsibleCPF: z.string(),
    responsiblePhone: z.string(),
    responsibleRelationship: z.string(),
    responsibleEmail: z.string(),

    hasSecondResponsible: z.boolean(),
    secondResponsibleName: z.string().optional().default(''),
    secondResponsibleCPF: z.string().optional().default(''),
    secondResponsiblePhone: z.string().optional().default(''),
    secondResponsibleRelationship: z.string().optional().default(''),

    financialResponsibleType: z.enum(['legal', 'second', 'other']),
    financialResponsibleName: z.string().optional().default(''),
    financialResponsibleCPF: z.string().optional().default(''),

    cep: z.string(),
    street: z.string(),
    number: z.string(),
    complement: z.string().optional().default(''),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    paymentMethod: z.string().optional().default('boleto-6x'),

    classFormat: z.enum(['sede', 'domicilio']),
    schedule: z.enum(['seg-qua', 'ter-qui']),
    scheduleDay1Start: z.string(),
    scheduleDay1End: z.string(),
    scheduleDay2Start: z.string(),
    scheduleDay2End: z.string(),

    authorizationMedia: z.boolean().optional().default(false),
    authorizationContract: z.boolean(),
    scheduleConfirmed: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const bad = (path: string, message: string) => ctx.addIssue({ code: 'custom', message, path: [path] });

    // Aluno 1
    if (!isFullName(d.student1Name)) bad('student1Name', NAME_MSG);
    if (!isValidStudentBirthDate(d.student1BirthDate)) bad('student1BirthDate', 'Data inválida (aluno ≤ 20 anos).');
    // Aluno 2 (se houver)
    if (d.hasStudent2) {
      if (!isFullName(d.student2Name)) bad('student2Name', NAME_MSG);
      if (!isValidStudentBirthDate(d.student2BirthDate)) bad('student2BirthDate', 'Data inválida (aluno ≤ 20 anos).');
    }

    // Responsável legal
    if (!isFullName(d.responsibleName)) bad('responsibleName', NAME_MSG);
    if (!isValidResponsibleBirthDate(d.responsibleBirthDate)) bad('responsibleBirthDate', 'Responsável deve ter ≥ 18 anos.');
    if (!isValidCPF(d.responsibleCPF)) bad('responsibleCPF', CPF_MSG);
    if (!isValidPhone(d.responsiblePhone)) bad('responsiblePhone', PHONE_MSG);
    if (!isValidEmail(d.responsibleEmail)) bad('responsibleEmail', 'E-mail inválido.');
    if (!d.responsibleRelationship.trim()) bad('responsibleRelationship', 'Campo obrigatório.');

    // Segundo responsável (se houver)
    if (d.hasSecondResponsible) {
      if (!isFullName(d.secondResponsibleName)) bad('secondResponsibleName', NAME_MSG);
      if (!isValidCPF(d.secondResponsibleCPF)) bad('secondResponsibleCPF', CPF_MSG);
      if (!isValidPhone(d.secondResponsiblePhone)) bad('secondResponsiblePhone', PHONE_MSG);
      if (!d.secondResponsibleRelationship.trim()) bad('secondResponsibleRelationship', 'Campo obrigatório.');
    }

    // Responsável financeiro (campos extras só quando "other")
    if (d.financialResponsibleType === 'other') {
      if (!isFullName(d.financialResponsibleName)) bad('financialResponsibleName', NAME_MSG);
      if (!isValidCPF(d.financialResponsibleCPF)) bad('financialResponsibleCPF', CPF_MSG);
    }

    // Endereço (state=GO é tratado no route → 422 OUTSIDE_GO)
    if (!isValidCEP(d.cep)) bad('cep', 'CEP inválido.');
    if (!d.street.trim()) bad('street', 'Campo obrigatório.');
    if (!d.number.trim()) bad('number', 'Campo obrigatório.');
    if (!d.neighborhood.trim()) bad('neighborhood', 'Campo obrigatório.');
    if (!d.city.trim()) bad('city', 'Campo obrigatório.');

    // Horário: os "Start" devem ser slots reais (8:30…17:45)
    if (!STARTS.has(d.scheduleDay1Start)) bad('scheduleDay1Start', 'Horário inválido.');
    if (!STARTS.has(d.scheduleDay2Start)) bad('scheduleDay2Start', 'Horário inválido.');

    // Autorizações obrigatórias
    if (d.authorizationContract !== true) bad('authorizationContract', 'É preciso aceitar o contrato.');
    if (d.scheduleConfirmed !== true) bad('scheduleConfirmed', 'Confirme o horário.');
  });

export type EnrollmentForm = z.infer<typeof EnrollmentFormSchema>;
