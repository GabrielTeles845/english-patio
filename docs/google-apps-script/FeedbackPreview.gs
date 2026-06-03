/**
 * FEEDBACK DO PREVIEW DA DASHBOARD — English Patio
 * =================================================
 * Recebe os comentários deixados no modo "Comentar" (alfinete roxo) do preview
 * em /dashboard e grava cada um numa aba "Feedbacks" de uma planilha Google.
 *
 * COMO PUBLICAR (mesmo processo do script de matrículas):
 * 1. Crie uma planilha nova no Google Sheets (ex.: "Feedbacks Dashboard EP").
 * 2. Menu Extensões → Apps Script. Apague o conteúdo e cole este arquivo.
 * 3. Implantar → Nova implantação → tipo "App da Web".
 *    - Executar como: você
 *    - Quem pode acessar: "Qualquer pessoa"
 * 4. Copie a URL do App da Web gerada.
 * 5. No arquivo public/dashboard.html, cole a URL na constante FEEDBACK_URL
 *    (procure por "FEEDBACK_URL=''").
 *
 * Pronto: todo comentário feito no preview cai aqui automaticamente,
 * com nome, tela, elemento e texto.
 */

var SHEET_NAME = 'Feedbacks';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Data/Hora', 'Nome', 'Tela', 'Elemento', 'Comentário', 'Caminho técnico', 'Navegador']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#1E3765').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.time || Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss'),
      data.name || 'Anônimo',
      data.view || '',
      data.label || '',
      data.text || '',
      data.path || '',
      data.ua || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
