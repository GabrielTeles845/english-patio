import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageZoomEvent extends CustomEvent {
  detail: {
    src: string;
    alt: string;
  };
}

const GlobalImageZoom = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  useEffect(() => {
    const handleOpenZoom = (event: Event) => {
      const customEvent = event as ImageZoomEvent;
      setImageSrc(customEvent.detail.src);
      setImageAlt(customEvent.detail.alt);
      setIsOpen(true);
    };

    window.addEventListener('openImageZoom', handleOpenZoom);

    return () => {
      window.removeEventListener('openImageZoom', handleOpenZoom);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
        aria-label="Fechar"
      >
        <XMarkIcon className="h-6 w-6 text-white" />
      </button>

      <img
        src={imageSrc}
        alt={imageAlt}
        className="max-w-full max-h-full object-contain cursor-zoom-out"
        onClick={handleClose}
      />
    </div>
  );
};

export default GlobalImageZoom;
