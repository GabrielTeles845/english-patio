/**
 * ENGLISH PATIO - Sistema de Matrícula
 * Google Apps Script - Backend Seguro
 *
 * IMPORTANTE: Este código deve ser colado no Google Apps Script
 * Link: https://script.google.com
 */

// ==========================================
// CONFIGURAÇÕES - AJUSTE AQUI
// ==========================================

const CONFIG = {
  // Email que receberá as matrículas
  EMAIL_ESCOLA: 'gabriel_teles2010@hotmail.com',

  // ID da planilha do Google Sheets (pegar da URL)
  // URL exemplo: https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
  // O ID é: ABC123XYZ
  SPREADSHEET_ID: '1V-PmqvH1kp44F-kVR6b4ZXTZbugLlGWqMi6IaJDy5Ls',

  // Nome da aba/sheet onde serão salvos os dados
  SHEET_NAME: 'Matrículas',

  // ID da pasta do Google Drive onde salvar os PDFs
  // URL exemplo: https://drive.google.com/drive/folders/ABC123XYZ
  // O ID é: ABC123XYZ
  DRIVE_FOLDER_ID: '1LuKqxWENVgUVRv1jKsPBsNI5aLwgrw5L',

  // Domínios permitidos (segurança CORS)
  ALLOWED_ORIGINS: [
    'https://gabrielteles845.github.io',
    'http://localhost:5173',
    'http://localhost:4173'
  ]
};

// ==========================================
// FUNÇÃO PRINCIPAL - Recebe requisições POST
// ==========================================

function doPost(e) {
  try {
    // Verificar origem (segurança CORS)
    const origin = e.parameter.origin || '';

    // Log de segurança
    Logger.log('Nova requisição recebida de: ' + origin);

    // Parse dos dados enviados
    const data = JSON.parse(e.postData.contents);

    // Validar dados obrigatórios
    if (!data.formData || !data.pdfBase64) {
      return createResponse(false, 'Dados incompletos', 400);
    }

    // 1. Salvar PDF no Google Drive
    const pdfUrl = savePDFToDrive(data.pdfBase64, data.formData);

    // 2. Salvar dados na planilha
    saveToSheet(data.formData, pdfUrl);

    // 3. Enviar email para a escola
    sendEmailToSchool(data.formData, data.pdfBase64);

    // Retornar sucesso
    return createResponse(true, 'Matrícula processada com sucesso!', 200, {
      pdfUrl: pdfUrl
    });

  } catch (error) {
    Logger.log('ERRO: ' + error.toString());
    return createResponse(false, 'Erro ao processar matrícula: ' + error.message, 500);
  }
}

// ==========================================
// SALVAR PDF NO GOOGLE DRIVE
// ==========================================

function savePDFToDrive(pdfBase64, formData) {
  try {
    // Decodificar Base64
    const pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(pdfBase64),
      'application/pdf',
      generatePDFFilename(formData)
    );

    // Obter pasta do Drive
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);

    // Salvar arquivo
    const file = folder.createFile(pdfBlob);

    // Tornar o arquivo acessível via link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Retornar URL do arquivo
    return file.getUrl();

  } catch (error) {
    Logger.log('Erro ao salvar PDF: ' + error.toString());
    throw new Error('Falha ao salvar PDF no Drive');
  }
}

// ==========================================
// SALVAR DADOS NA PLANILHA
// ==========================================

function saveToSheet(formData, pdfUrl) {
  try {
    // Abrir planilha
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      throw new Error('Planilha não encontrada: ' + CONFIG.SHEET_NAME);
    }

    // Preparar dados para a linha
    const timestamp = getBrasiliaTimestamp();

    // Determinar CPF do responsável financeiro baseado na escolha
    let financialResponsibleCPF = '';
    let financialResponsibleName = '';

    if (formData.financialResponsibleType === 'legal') {
      financialResponsibleName = formData.responsibleName;
      financialResponsibleCPF = formData.responsibleCPF;
    } else if (formData.financialResponsibleType === 'second') {
      financialResponsibleName = formData.secondResponsibleName;
      financialResponsibleCPF = formData.secondResponsibleCPF || '-';
    } else {
      financialResponsibleName = formData.financialResponsibleName;
      financialResponsibleCPF = formData.financialResponsibleCPF || '-';
    }

    const rowData = [
      timestamp, // Data/Hora (Brasília)
      formatOptionalField(formData.student1Name),
      formatBirthDate(formData.student1BirthDate), // DD/MM/YYYY
      formatOptionalField(formData.student1Age),
      formatOptionalField(formData.student2Name),
      formData.student2BirthDate ? formatBirthDate(formData.student2BirthDate) : '-', // DD/MM/YYYY
      formatOptionalField(formData.student2Age),
      formatOptionalField(formData.responsibleName),
      formatOptionalField(formData.responsibleCPF),
      formatOptionalField(formData.responsiblePhone),
      formatOptionalField(formData.responsibleEmail),
      capitalizeField(formData.responsibleRelationship), // Mãe, Pai, etc
      formatBirthDate(formData.responsibleBirthDate), // DD/MM/YYYY
      formatOptionalField(formData.secondResponsibleName),
      formatOptionalField(formData.secondResponsiblePhone),
      formatOptionalField(formData.secondResponsibleRelationship),
      formatOptionalField(formData.secondResponsibleCPF), // NOVA COLUNA: CPF Segundo Responsável
      financialResponsibleName, // Nome do Responsável Financeiro
      financialResponsibleCPF, // NOVA COLUNA: CPF Responsável Financeiro
      formatOptionalField(formData.cep),
      `${formData.street || ''}, ${formData.number || ''}${formData.complement ? ' - ' + formData.complement : ''}`,
      formatOptionalField(formData.neighborhood),
      formatOptionalField(formData.city),
      formatOptionalField(formData.state),
      'Presencial na Sede', // Formato fixo - apenas presencial na sede
      capitalizeField(formData.paymentMethod || 'Boleto'), // Boleto, PIX, etc
      formData.authorizationMedia ? 'Sim' : 'Não',
      formData.authorizationContract ? 'Sim' : 'Não',
      formData.scheduleConfirmed ? 'Sim' : 'Não',
      pdfUrl // Link do PDF no Drive
    ];

    // Adicionar linha na planilha
    sheet.appendRow(rowData);

    Logger.log('Dados salvos na planilha com sucesso');

  } catch (error) {
    Logger.log('Erro ao salvar na planilha: ' + error.toString());
    throw new Error('Falha ao salvar dados na planilha');
  }
}

// ==========================================
// ENVIAR EMAIL PARA A ESCOLA
// ==========================================

function sendEmailToSchool(formData, pdfBase64) {
  try {
    // Decodificar PDF
    const pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(pdfBase64),
      'application/pdf',
      generatePDFFilename(formData)
    );

    // Montar assunto do email
    const subject = `Nova Matrícula: ${formData.student1Name}`;
    const timestamp = getBrasiliaTimestamp();

    // Montar corpo do email em HTML
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E3765;">Nova Matrícula Recebida!</h2>
        <p style="color: #666; font-size: 14px;"><strong>Data/Hora:</strong> ${timestamp}</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1E3765; margin-top: 0;">Dados do(s) Aluno(s)</h3>
          <p><strong>Aluno 1:</strong> ${formatOptionalField(formData.student1Name)}</p>
          <p><strong>Data de Nascimento:</strong> ${formatBirthDate(formData.student1BirthDate)} (${formatOptionalField(formData.student1Age)} anos)</p>

          ${formData.hasStudent2 ? `
            <hr style="border: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Aluno 2:</strong> ${formatOptionalField(formData.student2Name)}</p>
            <p><strong>Data de Nascimento:</strong> ${formData.student2BirthDate ? formatBirthDate(formData.student2BirthDate) : '-'} (${formatOptionalField(formData.student2Age)} anos)</p>
          ` : ''}
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1E3765; margin-top: 0;">Responsáveis</h3>

          <p style="margin-top: 15px;"><strong>Responsável Legal:</strong></p>
          <p><strong>Nome:</strong> ${formatOptionalField(formData.responsibleName)}</p>
          <p><strong>CPF:</strong> ${formatOptionalField(formData.responsibleCPF)}</p>
          <p><strong>Data de Nascimento:</strong> ${formatBirthDate(formData.responsibleBirthDate)}</p>
          <p><strong>Telefone:</strong> ${formatOptionalField(formData.responsiblePhone)}</p>
          <p><strong>Parentesco:</strong> ${capitalizeField(formData.responsibleRelationship)}</p>

          ${formData.hasSecondResponsible ? `
            <hr style="border: 1px solid #ddd; margin: 15px 0;">
            <p style="margin-top: 15px;"><strong>Segundo Responsável:</strong></p>
            <p><strong>Nome:</strong> ${formatOptionalField(formData.secondResponsibleName)}</p>
            <p><strong>CPF:</strong> ${formatOptionalField(formData.secondResponsibleCPF)}</p>
            <p><strong>Telefone:</strong> ${formatOptionalField(formData.secondResponsiblePhone)}</p>
            <p><strong>Parentesco:</strong> ${formatOptionalField(formData.secondResponsibleRelationship)}</p>
          ` : ''}

          <hr style="border: 1px solid #ddd; margin: 15px 0;">
          <p style="margin-top: 15px;"><strong>Responsável Financeiro:</strong></p>
          <p><strong>Nome:</strong> ${
            formData.financialResponsibleType === 'legal'
              ? formData.responsibleName
              : formData.financialResponsibleType === 'second'
                ? formatOptionalField(formData.secondResponsibleName)
                : formatOptionalField(formData.financialResponsibleName)
          }</p>
          <p><strong>CPF:</strong> ${
            formData.financialResponsibleType === 'legal'
              ? formData.responsibleCPF
              : formData.financialResponsibleType === 'second'
                ? formatOptionalField(formData.secondResponsibleCPF)
                : formatOptionalField(formData.financialResponsibleCPF)
          }</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1E3765; margin-top: 0;">Endereço</h3>
          <p><strong>CEP:</strong> ${formatOptionalField(formData.cep)}</p>
          <p><strong>Endereço:</strong> ${formatOptionalField(formData.street)}, ${formatOptionalField(formData.number)}${formData.complement ? ' - ' + formData.complement : ''}</p>
          <p><strong>Bairro:</strong> ${formatOptionalField(formData.neighborhood)}</p>
          <p><strong>Cidade/UF:</strong> ${formatOptionalField(formData.city)}/${formatOptionalField(formData.state)}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1E3765; margin-top: 0;">Pagamento, Curso e Contato</h3>
          <p><strong>Email para Contato:</strong> ${formatOptionalField(formData.responsibleEmail)}</p>
          <p><strong>Forma de Pagamento:</strong> ${capitalizeField(formData.paymentMethod || 'Boleto')}</p>
          <p><strong>Formato das Aulas:</strong> Presencial na Sede</p>
          <p><strong>Autorização de Mídia:</strong> ${formData.authorizationMedia ? 'Sim' : 'Não'}</p>
          <p><strong>Horário Confirmado:</strong> ${formData.scheduleConfirmed ? 'Sim' : 'Não'}</p>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          O contrato preenchido está anexado a este email.
        </p>
      </div>
    `;

    // Enviar email
    MailApp.sendEmail({
      to: CONFIG.EMAIL_ESCOLA,
      subject: subject,
      htmlBody: htmlBody,
      attachments: [pdfBlob]
    });

    Logger.log('Email enviado para: ' + CONFIG.EMAIL_ESCOLA);

  } catch (error) {
    Logger.log('Erro ao enviar email: ' + error.toString());
    // Não lançar erro aqui - mesmo que o email falhe, queremos salvar os dados
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function generatePDFFilename(formData) {
  const timestamp = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyyMMdd_HHmmss');
  const studentName = (formData.student1Name || 'Aluno').replace(/[^a-zA-Z0-9]/g, '_');
  return `Contrato_${studentName}_${timestamp}.pdf`;
}

// Função para formatar data (já vem no formato DD/MM/YYYY do frontend)
function formatBirthDate(dateString) {
  if (!dateString) return '';
  // Se já estiver no formato DD/MM/YYYY, retorna como está
  if (dateString.includes('/')) {
    return dateString;
  }
  // Se estiver no formato antigo YYYY-MM-DD, converte
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

// Função para formatar timestamp de Brasília
function getBrasiliaTimestamp() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
}

// Função para capitalizar corretamente
function capitalizeField(value) {
  if (!value || value.trim() === '') return '-';

  // Capitalizar palavras específicas
  const lowercaseValue = value.toLowerCase();
  if (lowercaseValue === 'mae' || lowercaseValue === 'mãe') return 'Mãe';
  if (lowercaseValue === 'pai') return 'Pai';
  if (lowercaseValue === 'boleto') return 'Boleto';
  if (lowercaseValue === 'pix') return 'PIX';
  if (lowercaseValue === 'cartão' || lowercaseValue === 'cartao') return 'Cartão';
  if (lowercaseValue === 'dinheiro') return 'Dinheiro';

  return value;
}

// Função para tratar campos opcionais vazios
function formatOptionalField(value) {
  if (!value || value.trim() === '') return '-';
  return value;
}

function createResponse(success, message, statusCode, data = {}) {
  const response = {
    success: success,
    message: message,
    data: data
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// TESTE - Função para testar configurações
// ==========================================

function testarConfiguracao() {
  try {
    Logger.log('=== TESTANDO CONFIGURAÇÕES ===');

    // Testar acesso à planilha
    Logger.log('Testando planilha...');
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    Logger.log('✅ Planilha acessada: ' + sheet.getName());

    // Testar acesso ao Drive
    Logger.log('Testando pasta do Drive...');
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    Logger.log('✅ Pasta do Drive acessada: ' + folder.getName());

    // Testar envio de email
    Logger.log('Testando envio de email...');
    MailApp.sendEmail({
      to: CONFIG.EMAIL_ESCOLA,
      subject: 'Teste - Sistema de Matrícula English Patio',
      body: 'Este é um email de teste. O sistema está configurado corretamente!'
    });
    Logger.log('✅ Email de teste enviado para: ' + CONFIG.EMAIL_ESCOLA);

    Logger.log('=== TODAS AS CONFIGURAÇÕES ESTÃO OK! ===');

  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
  }
}
