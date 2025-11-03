/**
 * Tipos e Interfaces para o Sistema de Matrícula
 */

export interface FormData {
  // Aluno 1
  student1Name: string;
  student1BirthDate: string;
  student1Age: string;

  // Aluno 2 (opcional)
  hasStudent2: boolean;
  student2Name: string;
  student2BirthDate: string;
  student2Age: string;

  // Responsável Legal Principal
  responsibleName: string;
  responsibleBirthDate: string;
  responsibleCPF: string;
  responsiblePhone: string;
  responsibleRelationship: string; // Grau de parentesco
  responsibleEmail: string;

  // Segundo Responsável (opcional - apenas contato)
  hasSecondResponsible: boolean;
  secondResponsibleName: string;
  secondResponsibleCPF: string;
  secondResponsiblePhone: string;
  secondResponsibleRelationship: string;

  // Responsável Financeiro (pode ser diferente)
  financialResponsibleType: 'legal' | 'second' | 'other'; // Responsável Legal, Segundo Responsável ou outro
  financialResponsibleName: string; // Usado se 'other'
  financialResponsibleCPF: string; // Usado se 'other'

  // Endereço
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  paymentMethod: string;

  // Campos do Contrato
  classFormat: 'sede' | 'domicilio';
  schedule: 'seg-qua' | 'ter-qui';
  scheduleDay1Start: string;
  scheduleDay1End: string;
  scheduleDay2Start: string;
  scheduleDay2End: string;

  // Autorizações
  authorizationMedia: boolean;
  authorizationContract: boolean;
  scheduleConfirmed: boolean;
}
