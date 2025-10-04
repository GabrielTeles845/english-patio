import { useEffect, useState } from 'react';
import OptimizedImage from './OptimizedImage';

interface Image {
  src: string;
  alt: string;
}

interface ScrollingBackgroundProps {
  images: Image[];
  children: React.ReactNode;
}

const ScrollingBackground = ({ images, children }: ScrollingBackgroundProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative overflow-hidden py-20">
      {/* Fundo com imagens deslizantes */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              className="h-full"
            />
          </div>
        ))}
        {/* Overlay escurecido nas bordas laterais */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/80"></div>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default ScrollingBackground;
