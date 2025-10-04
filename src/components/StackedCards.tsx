interface StackedCardsProps {
  images: { src: string; alt: string }[];
  className?: string;
}

const StackedCards = ({ images, className = '' }: StackedCardsProps) => {
  const openZoom = (src: string, alt: string) => {
    const event = new CustomEvent('openImageZoom', {
      detail: { src, alt }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={`relative h-80 md:h-96 ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className="absolute rounded-xl overflow-hidden shadow-xl cursor-zoom-in transition-all duration-300 hover:scale-105 hover:z-30"
          style={{
            width: '70%',
            height: '85%',
            top: `${index * 8}%`,
            left: `${index * 10}%`,
            zIndex: images.length - index,
            transform: `rotate(${index * 3}deg)`,
          }}
          onClick={() => openZoom(image.src, image.alt)}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default StackedCards;
