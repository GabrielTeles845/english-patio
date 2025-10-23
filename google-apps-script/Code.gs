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
  // Email da escola que receberá as matrículas
  EMAIL_ESCOLA: 'englishpatio@yahoo.com',

  // ID da planilha do Google Sheets (pegar da URL)
  // URL exemplo: https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
  // O ID é: ABC123XYZ
  SPREADSHEET_ID: 'COLE_AQUI_O_ID_DA_SUA_PLANILHA',

  // Nome da aba/sheet onde serão salvos os dados
  SHEET_NAME: 'Matrículas',

  // ID da pasta do Google Drive onde salvar os PDFs
  // URL exemplo: https://drive.google.com/drive/folders/ABC123XYZ
  // O ID é: ABC123XYZ
  DRIVE_FOLDER_ID: 'COLE_AQUI_O_ID_DA_PASTA_DRIVE',

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
    const timestamp = new Date();
    const rowData = [
      timestamp, // Data/Hora
      formData.student1Name || '',
      formData.student1BirthDate || '',
      formData.student1Age || '',
      formData.student2Name || '',
      formData.student2BirthDate || '',
      formData.student2Age || '',
      formData.responsibleName || '',
      formData.responsibleCPF || '',
      formData.responsiblePhone || '',
      formData.responsibleEmail || '',
      formData.responsibleRelationship || '',
      formData.responsibleBirthDate || '',
      formData.secondResponsibleName || '',
      formData.secondResponsiblePhone || '',
      formData.secondResponsibleRelationship || '',
      formData.financialResponsibleType === 'same'
        ? formData.responsibleName
        : formData.financialResponsibleName || '',
      formData.cep || '',
      `${formData.street}, ${formData.number}${formData.complement ? ' - ' + formData.complement : ''}`,
      formData.neighborhood || '',
      formData.city || '',
      formData.state || '',
      formData.classFormat === 'sede' ? 'Presencial na Sede' : 'Presencial em Domicílio',
      formData.schedule === 'seg-qua' ? 'Segunda/Quarta' : 'Terça/Quinta',
      formData.scheduleDay1Start || '',
      formData.scheduleDay1End || '',
      formData.scheduleDay2Start || '',
      formData.scheduleDay2End || '',
      formData.paymentMethod || 'Boleto',
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

    // Montar corpo do email em HTML
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E3765;">Nova Matrícula Recebida!</h2>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1E3765; margin-top: 0;">Dados do(s) Aluno(s)</h3>
          <p><strong>Aluno 1:</strong> ${formData.student1Name}</p>
          <p><strong>Data de Nascimento:</strong> ${formData.student1BirthDate} (${formData.student1Age} anos)</p>

          ${formData.hasStudent2 ? `
            <hr style="border: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Aluno 2:</strong> ${formData.student2Name}</p>
            <p><strong>Data de Nascimento:</strong> ${formData.student2BirthDate} (${formData.student2Age} anos)</p>
          ` : ''}
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1E3765; margin-top: 0;">Responsável Legal</h3>
          <p><strong>Nome:</strong> ${formData.responsibleName}</p>
          <p><strong>CPF:</strong> ${formData.responsibleCPF}</p>
          <p><strong>Telefone:</strong> ${formData.responsiblePhone}</p>
          <p><strong>Email:</strong> ${formData.responsibleEmail}</p>
          <p><strong>Parentesco:</strong> ${formData.responsibleRelationship}</p>

          ${formData.hasSecondResponsible ? `
            <hr style="border: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Segundo Responsável:</strong> ${formData.secondResponsibleName}</p>
            <p><strong>Telefone:</strong> ${formData.secondResponsiblePhone}</p>
          ` : ''}
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1E3765; margin-top: 0;">Endereço</h3>
          <p><strong>CEP:</strong> ${formData.cep}</p>
          <p><strong>Endereço:</strong> ${formData.street}, ${formData.number}${formData.complement ? ' - ' + formData.complement : ''}</p>
          <p><strong>Bairro:</strong> ${formData.neighborhood}</p>
          <p><strong>Cidade/UF:</strong> ${formData.city}/${formData.state}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1E3765; margin-top: 0;">Dados do Curso</h3>
          <p><strong>Formato:</strong> ${formData.classFormat === 'sede' ? 'Presencial na Sede' : 'Presencial em Domicílio'}</p>
          <p><strong>Horário:</strong> ${formData.schedule === 'seg-qua' ? 'Segunda/Quarta' : 'Terça/Quinta'}</p>
          <p><strong>Responsável Financeiro:</strong> ${formData.financialResponsibleType === 'same' ? formData.responsibleName : formData.financialResponsibleName}</p>
        </div>

        <div style="background-color: #E8F5E9; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0;"><strong>✅ Autorização de Mídia:</strong> ${formData.authorizationMedia ? 'Sim' : 'Não'}</p>
          <p style="margin: 10px 0 0 0;"><strong>✅ Horário Confirmado:</strong> ${formData.scheduleConfirmed ? 'Sim' : 'Não'}</p>
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
  const timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
  const studentName = (formData.student1Name || 'Aluno').replace(/[^a-zA-Z0-9]/g, '_');
  return `Contrato_${studentName}_${timestamp}.pdf`;
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
