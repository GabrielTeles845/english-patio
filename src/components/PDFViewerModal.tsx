import { XMarkIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { downloadPDF, openPDFInNewTab } from '../services/pdfService';
import { useEffect, useState } from 'react';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  studentName: string;
}

const PDFViewerModal = ({ isOpen, onClose, pdfBytes, studentName }: PDFViewerModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pdfBytes) {
      // Criar URL do blob para visualização
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      // Cleanup ao desmontar ou fechar
      return () => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      };
    }
  }, [isOpen, pdfBytes]);

  const handleDownload = () => {
    if (pdfBytes) {
      const fileName = `contrato-${studentName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      downloadPDF(pdfBytes, fileName);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBytes) {
      openPDFInNewTab(pdfBytes);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <DocumentTextIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Contrato Preenchido</h2>
                <p className="text-xs sm:text-sm text-green-100">Matrícula finalizada com sucesso!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 m-3 sm:m-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm sm:text-base text-green-800 font-medium">
                  Matrícula realizada com sucesso!
                </p>
                <p className="text-xs sm:text-sm text-green-700 mt-1">
                  A escola receberá os dados da matrícula por e-mail. Em breve você receberá um link para assinatura digital do contrato.
                </p>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs sm:text-sm text-green-800 font-semibold">
                    ⚠️ Importante: A efetivação da matrícula acontecerá mediante a quitação de parcelas em aberto e a compra dos materiais de 2026.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-3 sm:px-6 pb-3 sm:pb-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md text-sm sm:text-base"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Baixar Contrato
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-secondary text-gray-900 font-bold rounded-lg hover:bg-secondary/90 transition-colors shadow-md text-sm sm:text-base"
            >
              <DocumentTextIcon className="h-5 w-5" />
              Abrir em Nova Aba
            </button>
          </div>

          {/* PDF Preview */}
          <div className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="bg-gray-100 rounded-lg overflow-hidden shadow-inner" style={{ height: 'calc(95vh - 280px)', minHeight: '400px' }}>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Visualização do Contrato"
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm sm:text-base text-gray-600">Carregando contrato...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                <strong>Próximos passos:</strong> Aguarde o contato da escola com o link para assinatura digital do contrato e informações sobre o carnê de pagamento.
              </p>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewerModal;
