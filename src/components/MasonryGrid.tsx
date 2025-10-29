import OptimizedImage from './OptimizedImage';
import img from '../config/cloudinary';

interface MasonryImage {
  src: string;
  alt: string;
  aspectRatio: number;
}

interface MasonryGridProps {
  images: MasonryImage[];
}

const MasonryGrid = ({ images }: MasonryGridProps) => {
  // Layout otimizado para 4 imagens:
  // Mobile: 2 colunas
  // Desktop: 4 colunas (todas na mesma linha)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {images.map((image, index) => (
        <div
          key={index}
          className="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
          onClick={() => {
            const event = new CustomEvent('openImageZoom', {
              detail: { src: img(image.src), alt: image.alt }
            });
            window.dispatchEvent(event);
          }}
        >
          <div style={{ aspectRatio: image.aspectRatio }}>
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              className="w-full h-full transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
