/**
 * Serviço de Matrícula - Envio Seguro para Google Apps Script
 *
 * Este serviço substitui o EmailJS e envia os dados diretamente
 * para o backend (Google Apps Script) de forma segura.
 */

import { FormData } from '../types/enrollment';

interface EnrollmentResponse {
  success: boolean;
  message: string;
  data?: {
    pdfUrl?: string;
  };
}

/**
 * Envia os dados da matrícula para o backend (Google Apps Script)
 * @param formData - Dados do formulário
 * @param pdfBytes - PDF preenchido em formato Uint8Array
 * @returns Promise com a resposta do servidor
 */
export async function submitEnrollment(
  formData: FormData,
  pdfBytes: Uint8Array
): Promise<EnrollmentResponse> {
  try {
    // Obter URL do Google Apps Script (variável de ambiente)
    const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

    if (!scriptUrl) {
      throw new Error(
        'URL do Google Apps Script não configurada. Adicione VITE_GOOGLE_APPS_SCRIPT_URL no arquivo .env'
      );
    }

    // Converter PDF para Base64
    const pdfBase64 = arrayBufferToBase64(pdfBytes);

    // Preparar dados para envio
    const payload = {
      formData: formData,
      pdfBase64: pdfBase64,
      timestamp: new Date().toISOString(),
    };

    // Log para debug (remover em produção se necessário)
    console.log('Enviando matrícula para o servidor...');

    // Enviar requisição POST para o Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Necessário para Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // IMPORTANTE: Com mode: 'no-cors', não conseguimos ler a resposta
    // Por isso, assumimos sucesso se não houver erro de rede
    console.log('✅ Matrícula enviada com sucesso!');

    return {
      success: true,
      message: 'Matrícula enviada com sucesso!',
      data: {},
    };

  } catch (error) {
    console.error('❌ Erro ao enviar matrícula:', error);

    // Retornar erro amigável
    return {
      success: false,
      message: error instanceof Error
        ? error.message
        : 'Erro ao enviar matrícula. Por favor, tente novamente.',
    };
  }
}

/**
 * Converte Uint8Array para Base64
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

/**
 * Valida se o formulário está completo antes de enviar
 */
export function validateFormData(formData: FormData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar campos obrigatórios do Aluno 1
  if (!formData.student1Name?.trim()) {
    errors.push('Nome do Aluno 1 é obrigatório');
  }
  if (!formData.student1BirthDate) {
    errors.push('Data de nascimento do Aluno 1 é obrigatória');
  }

  // Validar campos obrigatórios do Responsável Legal
  if (!formData.responsibleName?.trim()) {
    errors.push('Nome do Responsável Legal é obrigatório');
  }
  if (!formData.responsibleCPF) {
    errors.push('CPF do Responsável Legal é obrigatório');
  }
  if (!formData.responsiblePhone) {
    errors.push('Telefone do Responsável Legal é obrigatório');
  }
  if (!formData.responsibleEmail) {
    errors.push('Email do Responsável Legal é obrigatório');
  }

  // Validar endereço
  if (!formData.cep) {
    errors.push('CEP é obrigatório');
  }

  // Validar autorizações
  if (!formData.authorizationContract) {
    errors.push('Você precisa aceitar os termos do contrato');
  }
  if (!formData.scheduleConfirmed) {
    errors.push('Você precisa confirmar o horário das aulas');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}
