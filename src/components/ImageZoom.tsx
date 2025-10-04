import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import OptimizedImage from './OptimizedImage';
import img from '../config/cloudinary';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageZoom = ({ src, alt, className = '' }: ImageZoomProps) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleImageClick = () => {
    setIsZoomed(true);
  };

  const handleClose = () => {
    setIsZoomed(false);
  };

  return (
    <>
      <OptimizedImage
        src={src}
        alt={alt}
        className={`${className} cursor-zoom-in`}
        onClick={handleImageClick}
      />

      {isZoomed && (
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
            src={img(src)}
            alt={alt}
            className="max-w-full max-h-full object-contain cursor-zoom-out"
            onClick={handleClose}
          />
        </div>
      )}
    </>
  );
};

export default ImageZoom;
