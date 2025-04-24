import { useState, useEffect, useCallback } from 'react';

// Importando todas as imagens de depoimentos
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
    // Reinicia o timer ao clicar manualmente
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
    <div className="bg-gradient-to-b from-background to-background-light py-12" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Depoimentos</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-primary sm:text-4xl">
            Veja o que os pais estão dizendo
          </p>
          <p className="mt-4 max-w-2xl text-xl text-primary lg:mx-auto">
            Depoimentos reais de pais e alunos sobre a experiência no English Patio
          </p>
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
                    alt={`Depoimento ${index + 1}`} 
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
            aria-label="Depoimento anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all z-10 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:right-4"
            onClick={goToNextSlide}
            aria-label="Próximo depoimento"
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
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection; 