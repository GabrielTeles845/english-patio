import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, SparklesIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
// Separando os ícones das fotos para melhor organização
import iconVacation from '../assets/vacation-classes/3.webp'; // Ícone de férias
import iconBook from '../assets/vacation-classes/4.webp'; // Ícone de livro com coisas saindo
import iconHeart from '../assets/vacation-classes/5.webp'; // Ícone de coração com "we love it"
import image6 from '../assets/vacation-classes/6.webp';
import image7 from '../assets/vacation-classes/7.webp';
import image8 from '../assets/vacation-classes/8.webp';
import imagePark from '../assets/vacation-classes/88dd5f0a-e2ee-4129-9a0a-ffc6523a5a9b.jpg';
import imageCooking from '../assets/vacation-classes/227c9b0a-e790-46d4-be80-b7a85ca6cd8f.jpg';
import imageActivity from '../assets/vacation-classes/3341bfed-e291-4ef7-b431-8070c4967f2d.jpg';
import imageNature from '../assets/vacation-classes/0582aaf3-1fa8-4555-a88f-b7ea60d75385.jpg';
import imageExperience from '../assets/vacation-classes/733d1dd1-7481-4550-ab67-81374e2263ec.jpg';
import imageWhatsapp from '../assets/vacation-classes/WhatsApp Image 2025-05-01 at 21.47.12.jpeg';

// Imagens para o carrossel - usando apenas fotos reais para o carrossel
const carouselImages = [
  { src: image8, alt: 'Alunos se divertindo nas Vacation Classes' },
  { src: imageNature, alt: 'Experiência com a natureza' },
  { src: imagePark, alt: 'Atividades em grupo' },
  { src: imageCooking, alt: 'Atividades culinárias' },
  { src: imageWhatsapp, alt: 'Brincadeiras educativas' },
];

const VacationContent = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  };

  return (
    <div>
      {/* Seção 1: Introdução com imagem */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-primary">Imersão e Aprendizado</span>{' '}
                <span className="text-secondary">Além da Sala de Aula</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Ao longo do ano, a English Patio realiza as <strong>Vacation Classes</strong>: experiências externas que
                proporcionam aos alunos o uso real e prático do inglês em ambientes do cotidiano.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                São <strong>8 encontros anuais</strong>, com duas horas de duração cada, distribuídos ao longo do semestre letivo,
                aproximadamente um por mês.
              </p>
            </div>
            <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <MapPinIcon className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium text-sm">📸 TODO: Alunos em atividade externa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 2: Onde acontecem (invertido) */}
      <section className="py-16 md:py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <MapPinIcon className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium text-sm">📸 TODO: Visita ao parque ou local público</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-primary">Vivências</span>{' '}
                <span className="text-secondary">em Locais Reais</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Levamos as turmas para vivências reais em locais como <strong>parques, supermercados, floriculturas, shoppings,
                clubes</strong> e outros espaços públicos, sempre com atividades conduzidas <strong>100% em inglês</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 3: Atividades */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-primary">Atividades</span>{' '}
                <span className="text-secondary">Criativas</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                A proposta é criar oportunidades significativas de uso do idioma por meio de atividades como <strong>culinária,
                teatro, artesanato, pintura, oficinas, passeios de bicicleta, piqueniques e gincanas</strong>, entre outras
                possibilidades criativas.
              </p>
            </div>
            <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <SparklesIcon className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium text-sm">📸 TODO: Crianças em atividade de culinária ou arte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 4: Compromisso com investimento (invertido) */}
      <section className="py-16 md:py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <CalendarIcon className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium text-sm">📸 TODO: Grupo de alunos em atividade</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-primary">Valorização do</span>{' '}
                <span className="text-secondary">Investimento</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Além de ampliar a exposição ao inglês e fortalecer a imersão linguística, as Vacation Classes também refletem o
                compromisso da escola com a valorização do investimento das famílias.
              </p>
              <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-secondary mb-6">
                <p className="text-lg text-gray-700 font-semibold">
                  As mensalidades dos meses de <strong>janeiro e julho</strong> são convertidas integralmente nessas vivências
                  pedagógicas realizadas ao longo do ano.
                </p>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Dessa forma, os alunos permanecem ativos e engajados, mesmo nos períodos sem aulas regulares, garantindo
                continuidade no aprendizado com propósito e significado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compromisso Final - Quote destacado */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-10 md:p-12 shadow-xl">
              <SparklesIcon className="h-16 w-16 text-secondary mx-auto mb-6" />
              <p className="text-2xl md:text-3xl text-primary font-bold leading-relaxed">
                "Na English Patio, formar crianças fluentes em inglês vai muito além da sala de aula — é um compromisso que
                levamos para cada detalhe da jornada do aluno."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-primary">Faça Parte das</span>{' '}
            <span className="text-secondary">Vacation Classes!</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            As Vacation Classes são exclusivas para alunos matriculados. Entre em contato para conhecer nossa escola!
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-white bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
          >
            Fale Conosco
          </a>
        </div>
      </section>
    </div>
  );
};

export default VacationContent;
