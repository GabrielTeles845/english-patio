import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ContractData {
  // Dados do Contratante
  contractorName: string;
  contractorAddress: string;
  contractorCEP: string;
  contractorCPF: string;
  contractorPhone: string;

  // Formato das Aulas
  classFormat: 'sede' | 'domicilio';

  // Dias e Horários
  schedule: 'seg-qua' | 'ter-qui';
  scheduleDay1Start: string; // HH:MM
  scheduleDay1End: string;   // HH:MM
  scheduleDay2Start: string; // HH:MM
  scheduleDay2End: string;   // HH:MM

  // Autorização de Uso de Imagem
  imageAuthorization: boolean;

  // Data de Assinatura
  signatureDate: string; // DD/MM/YYYY
}

export async function fillContractPDF(formData: ContractData): Promise<Uint8Array> {
  try {
    // Carregar o PDF original
    const existingPdfBytes = await fetch('/contrato.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Carregar fonte
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const textColor = rgb(0, 0, 0);

    // Obter as páginas
    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages[1];
    const page4 = pages[3];

    // PÁGINA 1: Dados do Contratante
    // Nome do Contratante (linha após "CONTRATANTE:")
    page1.drawText(formData.contractorName, {
      x: 120,
      y: 540,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Endereço (linha após "residente e domiciliado à")
    page1.drawText(formData.contractorAddress, {
      x: 50,
      y: 520,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // CEP
    page1.drawText(formData.contractorCEP, {
      x: 485,
      y: 500,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // CPF
    page1.drawText(formData.contractorCPF, {
      x: 155,
      y: 480,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Telefone
    page1.drawText(formData.contractorPhone, {
      x: 390,
      y: 480,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // PÁGINA 2: Formato das Aulas e Horários
    // Checkbox do formato (X no checkbox correto)
    if (formData.classFormat === 'sede') {
      page2.drawText('X', {
        x: 67,
        y: 465,
        size: 12,
        font: font,
        color: textColor,
      });
    } else {
      page2.drawText('X', {
        x: 67,
        y: 445,
        size: 12,
        font: font,
        color: textColor,
      });
    }

    // Horários - Segunda/Quarta OU Terça/Quinta
    if (formData.schedule === 'seg-qua') {
      // Checkbox Segunda-feira
      page2.drawText('X', {
        x: 67,
        y: 385,
        size: 12,
        font: font,
        color: textColor,
      });
      // Checkbox Quarta-feira
      page2.drawText('X', {
        x: 67,
        y: 370,
        size: 12,
        font: font,
        color: textColor,
      });

      // Horários Segunda
      page2.drawText(formData.scheduleDay1Start, {
        x: 220,
        y: 385,
        size: fontSize,
        font: font,
        color: textColor,
      });
      page2.drawText(formData.scheduleDay1End, {
        x: 270,
        y: 385,
        size: fontSize,
        font: font,
        color: textColor,
      });

      // Horários Quarta
      page2.drawText(formData.scheduleDay2Start, {
        x: 220,
        y: 370,
        size: fontSize,
        font: font,
        color: textColor,
      });
      page2.drawText(formData.scheduleDay2End, {
        x: 270,
        y: 370,
        size: fontSize,
        font: font,
        color: textColor,
      });
    } else {
      // Checkbox Terça-feira
      page2.drawText('X', {
        x: 67,
        y: 330,
        size: 12,
        font: font,
        color: textColor,
      });
      // Checkbox Quinta-feira
      page2.drawText('X', {
        x: 67,
        y: 315,
        size: 12,
        font: font,
        color: textColor,
      });

      // Horários Terça
      page2.drawText(formData.scheduleDay1Start, {
        x: 220,
        y: 330,
        size: fontSize,
        font: font,
        color: textColor,
      });
      page2.drawText(formData.scheduleDay1End, {
        x: 270,
        y: 330,
        size: fontSize,
        font: font,
        color: textColor,
      });

      // Horários Quinta
      page2.drawText(formData.scheduleDay2Start, {
        x: 220,
        y: 315,
        size: fontSize,
        font: font,
        color: textColor,
      });
      page2.drawText(formData.scheduleDay2End, {
        x: 270,
        y: 315,
        size: fontSize,
        font: font,
        color: textColor,
      });
    }

    // PÁGINA 4: Autorização de Imagem e Data
    // Checkbox autorização de imagem
    if (formData.imageAuthorization) {
      page4.drawText('X', {
        x: 67,
        y: 385,
        size: 12,
        font: font,
        color: textColor,
      });
    } else {
      page4.drawText('X', {
        x: 67,
        y: 370,
        size: 12,
        font: font,
        color: textColor,
      });
    }

    // Data de Assinatura (Goiânia, DD/MM/YYYY)
    const [day, month, year] = formData.signatureDate.split('/');
    page4.drawText(day, {
      x: 165,
      y: 210,
      size: fontSize,
      font: font,
      color: textColor,
    });
    page4.drawText(month, {
      x: 215,
      y: 210,
      size: fontSize,
      font: font,
      color: textColor,
    });
    page4.drawText(year, {
      x: 260,
      y: 210,
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
