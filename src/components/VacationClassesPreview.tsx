import { SparklesIcon, MapPinIcon, PaintBrushIcon, CurrencyDollarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import FadeCarousel from './FadeCarousel';

const highlights = [
  {
    icon: MapPinIcon,
    title: 'Vivências Práticas',
    description: 'Parques, supermercados, floriculturas e outros espaços reais',
  },
  {
    icon: PaintBrushIcon,
    title: 'Atividades Criativas',
    description: 'Culinária, teatro, artesanato, pintura e muito mais',
  },
  {
    icon: SparklesIcon,
    title: '100% em Inglês',
    description: 'Imersão total no idioma em contextos práticos',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Valorização do Investimento',
    description: 'Mensalidades de Janeiro e Julho convertidas em vivências',
  },
];

// Imagens do carrossel
const carouselImages = [
  { src: 'IMG_1250.jpg', alt: 'Vacation Classes - Atividade 1' },
  { src: 'IMG_2517.jpg', alt: 'Vacation Classes - Atividade 2' },
  { src: 'IMG_3094.jpg', alt: 'Vacation Classes - Atividade 3' },
  { src: 'IMG_4327.jpg', alt: 'Vacation Classes - Atividade 4' },
];

const VacationClassesPreview = () => {
  return (
    <section className="relative py-16 md:py-20 bg-gradient-to-b from-white via-blue-50 to-white overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-10 w-80 h-80 bg-blue-200 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-10 w-96 h-96 bg-yellow-200 rounded-full opacity-15 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header centralizado */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Vacation Classes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Experiências externas que proporcionam aos alunos o uso real e prático do inglês em ambientes do cotidiano
          </p>

          {/* Badge destacado */}
          <div className="inline-flex items-center gap-3 bg-secondary/10 border-2 border-secondary/30 rounded-full px-6 py-3">
            <div className="flex items-center justify-center w-12 h-12 bg-secondary rounded-full">
              <span className="text-2xl font-bold text-white">8</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-primary">Encontros por Ano</p>
              <p className="text-xs text-gray-600">2 horas cada</p>
            </div>
          </div>
        </div>

        {/* Layout: Carrossel à esquerda, Cards à direita */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 mb-12">
          {/* Carrossel de imagens */}
          <div className="w-full max-w-[320px] lg:max-w-[370px] flex-shrink-0">
            <FadeCarousel
              images={carouselImages}
              autoPlayInterval={3500}
              showIndicators={false}
              showControls={false}
              aspectRatio="aspect-[3/4]"
            />
          </div>

          {/* Grid de 4 cards */}
          <div className="w-full max-w-[600px] space-y-4">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                  <div className="flex items-start gap-4">
                    {/* Ícone */}
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center justify-center w-11 h-11 bg-secondary/10 rounded-xl">
                        <highlight.icon className="h-5 w-5 text-secondary" />
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div>
                      <h3 className="text-base font-bold text-primary mb-1">{highlight.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{highlight.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* CTA */}
            <div className="pt-2">
              <Link
                to="/vacation-classes"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group"
              >
                Conheça as Vacation Classes
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VacationClassesPreview;
