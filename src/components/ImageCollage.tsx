import OptimizedImage from './OptimizedImage';
import img from '../config/cloudinary';

interface Image {
  src: string;
  alt: string;
}

interface ImageCollageProps {
  images: Image[];
  className?: string;
}

const ImageCollage = ({ images, className = '' }: ImageCollageProps) => {
  const openZoom = (src: string, alt: string) => {
    const event = new CustomEvent('openImageZoom', {
      detail: { src: img(src), alt }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 ${className}`}>
      {images.map((image, index) => {
        // Varia os tamanhos das imagens para criar o efeito de colagem
        const isLarge = index === 0 || index === 3;
        const isSquare = index % 2 === 0;

        return (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-zoom-in group ${
              isLarge ? 'col-span-2 row-span-2' : ''
            } ${isSquare ? 'aspect-square' : 'aspect-[4/3]'}`}
            onClick={() => openZoom(image.src, image.alt)}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              className="transition-transform duration-500 group-hover:scale-110 h-full"
            />
          </div>
        );
      })}
    </div>
  );
};

export default ImageCollage;
