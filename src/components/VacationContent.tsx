import { SparklesIcon } from '@heroicons/react/24/outline';
import FadeCarousel from './FadeCarousel';
import FlippingCards from './FlippingCards';
import MasonryGrid from './MasonryGrid';
import img from '../config/cloudinary';
import OptimizedImage from './OptimizedImage';

// Imagens para carrossel "Imersão e Aprendizado"
const immersionImages = [
  { src: 'IMG_8057.jpg', alt: 'Atividade de imersão e aprendizado' },
];

// Imagens para grid estilo Pinterest "Momentos das Nossas Atividades"
// Primeiras 2 imagens serão destaques (maiores), as 2 seguintes serão menores
const activityImages = [
  { src: 'IMG_1250.jpg', alt: 'Alunos em ação', aspectRatio: 768 / 1024 }, // Destaque 1
  { src: 'IMG_4327.jpg', alt: 'Momento de aprendizado', aspectRatio: 3024 / 4032 }, // Destaque 2
  { src: 'IMG_2517.jpg', alt: 'Atividade criativa', aspectRatio: 3024 / 4032 }, // Menor 1
  { src: 'IMG_3094.jpg', alt: 'Trabalho em grupo', aspectRatio: 3024 / 4032 }, // Menor 2
];

const VacationContent = () => {
  return (
    <div>
      {/* Seção 1: Introdução com carrossel */}
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
            <FadeCarousel
              images={immersionImages}
              autoPlayInterval={0}
              showIndicators={false}
              showControls={false}
              aspectRatio="aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* Seção 2: Onde acontecem (invertido) */}
      <section className="py-16 md:py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg cursor-zoom-in group">
              <OptimizedImage
                src="DSC02760.jpg"
                alt="Vivências em locais reais"
                className="transition-transform duration-500 group-hover:scale-110 h-full"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('DSC02760.jpg'), alt: 'Vivências em locais reais' }
                  });
                  window.dispatchEvent(event);
                }}
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-primary">Vivências</span>{' '}
                <span className="text-secondary">Práticas</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Levamos as turmas para vivências práticas em locais como <strong>parques, supermercados, floriculturas, shoppings,
                clubes</strong> e outros espaços públicos, sempre com atividades conduzidas <strong>100% em inglês</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 3: Atividades Criativas - Cards Empilhados */}
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
            <FlippingCards
              images={[
                { src: 'DSC07276.jpg', alt: 'Atividade criativa 1' },
                { src: 'DSC07463.jpg', alt: 'Atividade criativa 2' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Seção 4: Compromisso com investimento (invertido) */}
      <section className="py-16 md:py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg cursor-zoom-in group">
              <OptimizedImage
                src="IMG_3921.jpg"
                alt="Valorização do investimento"
                className="transition-transform duration-500 group-hover:scale-110 h-full"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('IMG_3921.jpg'), alt: 'Valorização do investimento' }
                  });
                  window.dispatchEvent(event);
                }}
              />
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

      {/* Galeria de Atividades - Grid Estilo Pinterest */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-primary">Momentos das</span>{' '}
              <span className="text-secondary">Nossas Atividades</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Veja algumas das experiências que nossos alunos vivenciam nas Vacation Classes
            </p>
          </div>

          <MasonryGrid images={activityImages} />
        </div>
      </section>

      {/* Compromisso Final - Quote destacado */}
      <section className="py-16 md:py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl p-10 md:p-12 shadow-xl">
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
