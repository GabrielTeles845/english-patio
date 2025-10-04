import { useState } from 'react';
import img from '../config/cloudinary';

interface OptimizedImageProps {
  src: string; // Nome do arquivo (ex: 'DSC06842.jpg')
  alt: string;
  className?: string;
  width?: number;
  onClick?: () => void;
}

const OptimizedImage = ({ src, alt, className = '', onClick }: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Gera URL otimizada
  const imageUrl = img(src);

  // Gera thumbnail blur (10px width) para placeholder
  const placeholderUrl = `https://res.cloudinary.com/dfvihcel2/image/upload/w_10,q_auto,f_auto,e_blur:1000/${src}`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder blur */}
      {!isLoaded && (
        <img
          src={placeholderUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
          aria-hidden="true"
        />
      )}

      {/* Imagem real */}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onClick={onClick}
      />
    </div>
  );
};

export default OptimizedImage;
