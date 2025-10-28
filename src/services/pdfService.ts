import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ContractData {
  // Dados do Contratante
  contractorName: string;
  contractorAddress: string;
  contractorNeighborhood: string; // Bairro
  contractorCity: string; // Cidade/Estado (ex: "Goiânia/GO")
  contractorCEP: string;
  contractorCPF: string;
  contractorPhone: string;

  // Formato das Aulas (sempre 'sede' no contrato 2026)
  classFormat: 'sede' | 'domicilio';

  // Autorização de Uso de Imagem
  imageAuthorization: boolean;

  // Data de Assinatura
  signatureDate: string; // DD/MM/YYYY
}

export async function fillContractPDF(formData: ContractData): Promise<Uint8Array> {
  try {
    // Carregar o PDF original
    const pdfPath = import.meta.env.BASE_URL + 'contrato.pdf';
    const existingPdfBytes = await fetch(pdfPath).then(res => {
      if (!res.ok) throw new Error(`Erro ao carregar PDF original: ${res.status} ${res.statusText}`);
      return res.arrayBuffer();
    });
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Carregar fonte
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 10;
    const textColor = rgb(0, 0, 0);

    // Obter as páginas
    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages[1];
    const page4 = pages[3];

    // Obter dimensões da página para cálculos
    const { height } = page1.getSize();

    // PÁGINA 1: Dados do Contratante
    // Nome do Contratante (linha após "CONTRATANTE:")
    page1.drawText(formData.contractorName.toUpperCase(), {
      x: 213,
      y: height - 232,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Endereço - Linha 1: Rua, número, complemento
    page1.drawText(formData.contractorAddress, {
      x: 118,
      y: height - 271,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // CEP (ao lado do endereço, na mesma linha do segundo endereço)
    page1.drawText(formData.contractorCEP, {
      x: 450,
      y: height - 289,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Endereço - Linha 2: Bairro, Cidade/Estado
    const neighborhood = formData.contractorNeighborhood ? `${formData.contractorNeighborhood}, ` : '';
    const cityState = formData.contractorCity || '';
    const fullSecondLine = `${neighborhood}${cityState}`;

    page1.drawText(fullSecondLine, {
      x: 118,
      y: height - 289,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // CPF
    page1.drawText(formData.contractorCPF, {
      x: 143,
      y: height - 327,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Telefone
    page1.drawText(formData.contractorPhone, {
      x: 353,
      y: height - 327,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // PÁGINA 2: Formato das Aulas
    const page2Height = page2.getSize().height;

    // Checkbox do formato - Apenas "Presencial na sede" (contrato 2026)
    // Sempre marca a opção "sede" pois não há mais opção de domicílio
    page2.drawText('X', {
      x: 90.5,
      y: page2Height - 368,
      size: 14,
      font: fontBold,
      color: textColor,
    });

    // PÁGINA 4: Autorização de Imagem e Data
    const page4Height = page4.getSize().height;

    // Checkbox autorização de imagem
    if (formData.imageAuthorization) {
      page4.drawText('X', {
        x: 98,
        y: page4Height - 367,
        size: 14,
        font: fontBold,
        color: textColor,
      });
    } else {
      page4.drawText('X', {
        x: 98,
        y: page4Height - 381,
        size: 14,
        font: fontBold,
        color: textColor,
      });
    }

    // Data de Assinatura (Goiânia, DD/MM/YYYY)
    const [day, month, year] = formData.signatureDate.split('/');
    page4.drawText(day, {
      x: 176,
      y: page4Height - 594,
      size: fontSize,
      font: font,
      color: textColor,
    });
    page4.drawText(month, {
      x: 232,
      y: page4Height - 594,
      size: fontSize,
      font: font,
      color: textColor,
    });
    page4.drawText(year, {
      x: 288,
      y: page4Height - 594,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Nome do Contratante (linha de assinatura "CONTRATANTE")
    page4.drawText(formData.contractorName.toUpperCase(), {
      x: 170,
      y: page4Height - 630,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Nome do Contratado (linha de assinatura "CONTRATADO")
    // Este campo é fixo e sempre será "English Patio Ltda"
    page4.drawText('ENGLISH PATIO LTDA', {
      x: 170,
      y: page4Height - 667,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Salvar o PDF modificado
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Erro ao preencher PDF:', error);
    throw new Error('Falha ao preencher o contrato PDF');
  }
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'contrato-preenchido.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function openPDFInNewTab(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Não revogamos o URL imediatamente para permitir que a janela carregue
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
