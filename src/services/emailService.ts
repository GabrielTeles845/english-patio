import emailjs from '@emailjs/browser';

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface EnrollmentEmailData {
  studentName: string;
  contractorName: string;
  contractorEmail: string;
  contractorPhone: string;
  pdfBase64: string;
}

/**
 * Envia o contrato preenchido por email para dois destinatários
 * @param pdfBytes - PDF preenchido em formato Uint8Array
 * @param emailData - Dados do formulário para o email
 * @param config - Configuração do EmailJS (serviceId, templateId, publicKey)
 */
export async function sendContractEmails(
  pdfBytes: Uint8Array,
  emailData: EnrollmentEmailData,
  config: EmailConfig
): Promise<void> {
  try {
    // Converter PDF para Base64
    const base64PDF = arrayBufferToBase64(pdfBytes);

    // Preparar dados para o template do EmailJS
    const templateParams = {
      student_name: emailData.studentName,
      contractor_name: emailData.contractorName,
      contractor_email: emailData.contractorEmail,
      contractor_phone: emailData.contractorPhone,
      pdf_attachment: base64PDF,
      pdf_filename: `contrato_${emailData.studentName.replace(/\s+/g, '_')}.pdf`,
    };

    // Email 1: Para gabriel_teles2010@hotmail.com
    await emailjs.send(
      config.serviceId,
      config.templateId,
      {
        ...templateParams,
        to_email: 'gabriel_teles2010@hotmail.com',
      },
      config.publicKey
    );

    console.log('Email enviado com sucesso para gabriel_teles2010@hotmail.com');

    // Email 2: Para o email do usuário
    await emailjs.send(
      config.serviceId,
      config.templateId,
      {
        ...templateParams,
        to_email: emailData.contractorEmail,
      },
      config.publicKey
    );

    console.log(`Email enviado com sucesso para ${emailData.contractorEmail}`);
  } catch (error) {
    console.error('Erro ao enviar emails:', error);
    throw new Error('Falha ao enviar emails com o contrato');
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
 * Inicializa o EmailJS (deve ser chamado uma vez no início da aplicação)
 */
export function initEmailJS(publicKey: string): void {
  emailjs.init(publicKey);
}
