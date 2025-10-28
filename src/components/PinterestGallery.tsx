import OptimizedImage from './OptimizedImage';
import img from '../config/cloudinary';

interface Image {
  src: string;
  alt: string;
  orientation?: '16x9' | '9x16';
}

interface PinterestGalleryProps {
  images: Image[];
  className?: string;
  showNumbers?: boolean;
}

const PinterestGallery = ({ images, className = '', showNumbers = false }: PinterestGalleryProps) => {
  const openZoom = (image: Image) => {
    const event = new CustomEvent('openImageZoom', {
      detail: { src: img(image.src), alt: image.alt }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={`${className}`}>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {images.map((image, index) => {
          const isVertical = image.orientation === '9x16';

          return (
            <div
              key={index}
              className="break-inside-avoid"
            >
              <div
                className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-zoom-in group ${
                  isVertical ? 'aspect-[9/16]' : 'aspect-[16/9]'
                }`}
                onClick={() => openZoom(image)}
              >
                <OptimizedImage
                  src={image.src}
                  alt={image.alt}
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {showNumbers && (
                  <div className="absolute top-2 left-2 bg-primary text-white font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10">
                    {index + 1}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PinterestGallery;
