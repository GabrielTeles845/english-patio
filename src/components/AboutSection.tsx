import { BuildingOffice2Icon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import img from '../config/cloudinary';
import OptimizedImage from './OptimizedImage';

const highlights = [
  {
    name: 'Salas Interativas',
    description: 'Layout com mesas redondas, livros literários, decoração lúdica e climatização',
    icon: BuildingOffice2Icon,
  },
  {
    name: 'Ambiente Imersivo',
    description: 'Murais artísticos e decoração temática que remetem à cultura de língua inglesa',
    icon: SparklesIcon,
  },
  {
    name: 'Fun Space',
    description: 'Sala multiuso com karaokê, cozinha e palco para apresentações em inglês',
    icon: SparklesIcon,
  },
  {
    name: 'Pátio Amplo',
    description: 'Espaço acolhedor com bancos, música ambiente, cesta de basquete e pergolado',
    icon: UserGroupIcon,
  },
];

// Carrossel de infraestrutura - Imagens da pasta Home - Carrossel Estrutura
const carouselImages = [
  { src: 'DSC06844.jpg', alt: 'Infraestrutura da English Patio' },
  { src: 'DSC07612.jpg', alt: 'Espaço educativo da escola' },
  { src: 'DSC07678.jpg', alt: 'Ambiente acolhedor English Patio' },
  { src: 'DSC07681.jpg', alt: 'Estrutura moderna da escola' },
  { src: 'DSC07728.jpg', alt: 'Espaço de convivência' },
  { src: 'DSC07744.jpg', alt: 'Sala preparada para o aprendizado' },
  { src: 'DSC07794.jpg', alt: 'Ambiente de ensino moderno' },
  { src: 'DSC07797.jpg', alt: 'Sala com recursos tecnológicos' },
  { src: 'DSC07801.jpg', alt: 'Espaço educacional completo' },
  { src: 'DSC07807.jpg', alt: 'Estrutura acolhedora e funcional' },
];

const AboutSection = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-avançar o carrossel a cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="about" className="py-16 md:py-20 bg-gradient-to-b from-blue-50 via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Infraestrutura que Estimula o Aprendizado
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-gray-600 mx-auto">
            A English Patio oferece um ambiente cuidadosamente planejado para promover o aprendizado com conforto, criatividade e acolhimento.
          </p>
        </div>

        {/* Grid de 2 colunas: Texto à esquerda, Carrossel à direita */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Coluna de Texto */}
          <div className="space-y-6">
            {/* 4 Cards de Destaques */}
            <div className="grid gap-4">
              {highlights.map((highlight) => (
                <div
                  key={highlight.name}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0">
                    <div className="bg-secondary/10 rounded-lg p-3">
                      <highlight.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary text-lg">{highlight.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{highlight.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão para página completa */}
            {/* <div className="pt-4">
              <Link
                to="/infraestrutura"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg group"
              >
                Conheça Nossa Infraestrutura
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div> */}
          </div>

          {/* Coluna de Carrossel de Imagens */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Carrossel de Imagens */}
              <div className="aspect-[4/3] relative overflow-hidden cursor-zoom-in">
                {carouselImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                    onClick={() => {
                      const event = new CustomEvent('openImageZoom', {
                        detail: { src: img(image.src), alt: image.alt }
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <OptimizedImage
                      src={image.src}
                      alt={image.alt}
                      className="h-full"
                    />
                  </div>
                ))}

                {/* Overlay gradiente sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-20"></div>
              </div>

              {/* Decoração */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
