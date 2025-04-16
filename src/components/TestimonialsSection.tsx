import { StarIcon } from '@heroicons/react/24/solid';
import type { Testimonial } from '../types';

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Maria Silva',
    role: 'Mãe do Pedro (6 anos)',
    content: 'O Pedro adora as aulas! Ele chega em casa cantando as músicas em inglês e sempre conta as histórias que aprendeu. A metodologia lúdica realmente funciona!',
    rating: 5,
  },
  {
    id: 2,
    name: 'João Santos',
    role: 'Pai da Ana (10 anos)',
    content: 'A Ana evoluiu muito desde que começou no English Patio. Ela já consegue manter conversas básicas em inglês e adora os projetos em grupo.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Carla Oliveira',
    role: 'Mãe do Lucas (15 anos)',
    content: 'O Lucas está se preparando para o futuro com o curso Teens. Ele desenvolveu muita confiança para falar inglês e adora as simulações de situações reais.',
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <div className="bg-gradient-to-b from-background to-background-light py-12" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Depoimentos</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-primary sm:text-4xl">
            O Que Dizem Nossos Alunos
          </p>
          <p className="mt-4 max-w-2xl text-xl text-primary lg:mx-auto">
            Veja o que os pais e alunos têm a dizer sobre a experiência no English Patio
          </p>
        </div>

        <div className="mt-10 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="card bg-background-light hover:shadow-2xl"
            >
              <div className="px-6 py-8">
                <div className="flex items-center">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-secondary" />
                  ))}
                </div>
                <blockquote className="mt-4">
                  <p className="text-primary">{testimonial.content}</p>
                </blockquote>
                <div className="mt-6">
                  <p className="text-base font-semibold text-primary">{testimonial.name}</p>
                  <p className="text-sm text-primary">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection; 