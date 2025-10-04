import { useEffect, useState } from 'react';
import OptimizedImage from './OptimizedImage';
import img from '../config/cloudinary';

interface FlippingCardsProps {
  images: { src: string; alt: string }[];
  className?: string;
}

const FlippingCards = ({ images, className = '' }: FlippingCardsProps) => {
  const [frontIndex, setFrontIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrontIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const openZoom = (src: string, alt: string) => {
    const event = new CustomEvent('openImageZoom', {
      detail: { src: img(src), alt }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={`relative h-80 md:h-96 ${className}`}>
      {images.map((image, index) => {
        const isFront = index === frontIndex;
        const isBack = index === (frontIndex + 1) % images.length;

        return (
          <div
            key={index}
            className={`absolute rounded-xl overflow-hidden shadow-2xl cursor-zoom-in transition-all duration-1000 ease-in-out ${
              isFront
                ? 'w-[75%] h-[90%] top-[5%] left-[12.5%] z-20 scale-100 opacity-100'
                : isBack
                ? 'w-[70%] h-[85%] top-[7.5%] left-[15%] z-10 scale-95 opacity-60'
                : 'w-[70%] h-[85%] top-[7.5%] left-[15%] z-0 scale-90 opacity-0'
            }`}
            style={{
              transform: isFront
                ? 'rotate(2deg)'
                : isBack
                ? 'rotate(-2deg)'
                : 'rotate(0deg)',
            }}
            onClick={() => openZoom(image.src, image.alt)}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              className="h-full"
            />
            {/* Overlay para a imagem de trás */}
            {isBack && (
              <div className="absolute inset-0 bg-black/20"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FlippingCards;
