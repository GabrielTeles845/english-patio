import { useState, useEffect, useCallback } from 'react';

// Importando todas as imagens de feedbacks
import testimonial1 from '../assets/testimonials/1.png';
import testimonial2 from '../assets/testimonials/2.png';
import testimonial3 from '../assets/testimonials/3.png';
import testimonial4 from '../assets/testimonials/4.png';
import testimonial5 from '../assets/testimonials/5.png';
import testimonial6 from '../assets/testimonials/6.png';
import testimonial7 from '../assets/testimonials/7.png';
import testimonial8 from '../assets/testimonials/8.png';
import testimonial9 from '../assets/testimonials/9.png';

const testimonialImages = [
  testimonial1,
  testimonial2,
  testimonial3,
  testimonial4,
  testimonial5,
  testimonial6,
  testimonial7,
  testimonial8,
  testimonial9,
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === testimonialImages.length - 1 ? 0 : prevIndex + 1));
  }, []);

  const goToPrevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonialImages.length - 1 : prevIndex - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(true);
  };

  // Configura a rotação automática
  useEffect(() => {
    let intervalId: number | undefined;

    if (isAutoPlaying) {
      intervalId = window.setInterval(goToNextSlide, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoPlaying, goToNextSlide]);

  // Pausa a reprodução automática quando o usuário interage
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título simplificado */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary">
            Feedbacks
          </h2>
        </div>

        <div
          className="mt-10 relative mx-auto max-w-4xl"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Container do carrossel */}
          <div className="overflow-hidden rounded-lg shadow-xl bg-white">
            <div
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonialImages.map((image, index) => (
                <div
                  key={index}
                  className="min-w-full flex justify-center items-center p-4"
                >
                  <img
                    src={image}
                    alt={`Feedback ${index + 1}`}
                    className="max-h-[500px] w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Botões de navegação */}
          <button
            className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all z-10 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:left-4"
            onClick={goToPrevSlide}
            aria-label="Feedback anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all z-10 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:right-4"
            onClick={goToNextSlide}
            aria-label="Próximo feedback"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicadores */}
          <div className="flex justify-center mt-4 space-x-2">
            {testimonialImages.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex ? 'bg-primary scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir para feedback ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
