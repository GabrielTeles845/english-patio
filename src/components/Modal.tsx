import { Fragment, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, message, icon }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora do modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop com blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal */}
        <div 
          ref={modalRef}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto overflow-hidden transform transition-all animate-fade-in"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-primary text-white flex justify-between items-center">
            <h3 className="text-lg font-medium">{title}</h3>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="px-6 py-8 text-center">
            {icon && (
              <div className="flex justify-center mb-4">
                {icon}
              </div>
            )}
            <p className="text-gray-700">{message}</p>
          </div>

          {/* Botão */}
          <div className="px-6 py-4 bg-gray-50 flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Modal; 