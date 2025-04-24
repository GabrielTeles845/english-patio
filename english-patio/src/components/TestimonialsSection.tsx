import { useState, useEffect, useCallback } from 'react';
import './TestimonialsSection.css';

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
import testimonial10 from '../assets/testimonials/10.png';

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
  testimonial10,
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
    <section className="testimonials-section">
      <h2 className="testimonials-title">Veja o que os pais estão dizendo</h2>

      <div 
        className="testimonials-carousel" 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button 
          className="testimonials-nav-button prev-button" 
          onClick={goToPrevSlide}
          aria-label="Depoimento anterior"
        >
          &#8592;
        </button>

        <div className="testimonials-slide-container">
          {testimonialImages.map((image, index) => (
            <div 
              key={index} 
              className={`testimonial-slide ${index === currentIndex ? 'active' : ''}`}
              style={{ transform: `translateX(${100 * (index - currentIndex)}%)` }}
            >
              <img 
                src={image} 
                alt={`Depoimento ${index + 1}`} 
                className="testimonial-image" 
              />
            </div>
          ))}
        </div>

        <button 
          className="testimonials-nav-button next-button" 
          onClick={goToNextSlide}
          aria-label="Próximo depoimento"
        >
          &#8594;
        </button>
      </div>

      <div className="testimonials-indicators">
        {testimonialImages.map((_, index) => (
          <button
            key={index}
            className={`testimonial-indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir para depoimento ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection; 