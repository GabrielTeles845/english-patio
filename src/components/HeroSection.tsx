import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import img from '../config/cloudinary';
import OptimizedImage from './OptimizedImage';

const features = [
  {
    title: 'Aulas 100% em inglês',
    description: 'Imersão total no idioma desde a primeira aula'
  },
  {
    title: 'Turmas reduzidas',
    description: 'Até 6 alunos por turma para atendimento personalizado'
  },
  {
    title: 'Metodologia ativa',
    description: 'Práticas interativas que priorizam a conversação.'
  },
  {
    title: 'Espaço que Inspira',
    description: 'Infraestrutura que integra conforto, funcionalidade e foco no aprendizado.'
  },
];

const HeroSection = () => {
  return (
    <div className="relative pb-12 md:pt-8 md:pb-16 overflow-hidden bg-white animate-fade-in">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-40 -left-20 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-20 items-start lg:items-center py-8 lg:py-16">
          {/* Conteúdo à esquerda */}
          <div className="text-center lg:text-left order-1">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
              <span className="block text-primary">
                Inglês para <span className="text-secondary">crianças</span>
              </span>
              <span className="block mt-1 lg:-mt-1 lg:whitespace-nowrap">
                <span className="text-primary">e </span>
                <span className="text-secondary">adolescentes</span>
              </span>
            </h1>

            <p className="mt-6 lg:mt-8 text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Na English Patio, seu filho aprende inglês de forma natural por meio de dinâmicas e atividades interativas,
              conduzidas por professores treinados em Metodologias Ativas.
            </p>
            <p className="mt-3 lg:mt-4 text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Nossas turmas reduzidas garantem atenção individualizada e personalização do aprendizado, respeitando o ritmo de cada aluno.
            </p>

            <div className="mt-8 lg:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <a
                href="#contact"
                className="btn-primary btn-hover group text-center inline-flex items-center justify-center"
              >
                Fale Conosco
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#courses"
                className="btn-secondary btn-hover text-center inline-flex items-center justify-center"
              >
                Conheça Nosso Curso
              </a>
            </div>

            {/* Cards de features */}
            <div className="mt-10 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white/70 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-3 lg:gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-secondary/10 rounded-full p-1.5 lg:p-2">
                        <CheckIcon className="h-5 w-5 lg:h-6 lg:w-6 text-secondary" />
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-primary text-sm lg:text-base">{feature.title}</h3>
                      <p className="mt-1 text-xs lg:text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid de 3 imagens criativo à direita */}
          <div className="relative lg:ml-8 order-2">
            <div className="relative grid grid-cols-2 gap-3 lg:gap-4">
              {/* Círculo decorativo - escondido no mobile */}
              <div className="hidden lg:block absolute -top-8 -right-8 w-64 h-64 bg-secondary/10 rounded-full -z-10"></div>

              {/* Imagem 1 - Grande no topo esquerdo */}
              <div className="col-span-2 relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl lg:shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                <OptimizedImage
                  src="DSC06890.jpg"
                  alt="Alunos da English Patio aprendendo de forma interativa"
                  className="cursor-zoom-in h-64 lg:h-80"
                  onClick={() => {
                    const event = new CustomEvent('openImageZoom', {
                      detail: { src: img('DSC06890.jpg'), alt: 'Alunos da English Patio aprendendo de forma interativa' }
                    });
                    window.dispatchEvent(event);
                  }}
                />
              </div>

              {/* Imagem 2 - Pequena embaixo esquerda */}
              <div className="relative rounded-xl lg:rounded-2xl overflow-hidden shadow-lg lg:shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
                <OptimizedImage
                  src="DSC07227.jpg"
                  alt="Momento de leitura na English Patio"
                  className="cursor-zoom-in h-48 lg:h-64"
                  onClick={() => {
                    const event = new CustomEvent('openImageZoom', {
                      detail: { src: img('DSC07227.jpg'), alt: 'Momento de leitura na English Patio' }
                    });
                    window.dispatchEvent(event);
                  }}
                />
              </div>

              {/* Imagem 3 - Pequena embaixo direita */}
              <div className="relative rounded-xl lg:rounded-2xl overflow-hidden shadow-lg lg:shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
                <OptimizedImage
                  src="DSC07547.jpg"
                  alt="Atividades práticas e divertidas"
                  className="cursor-zoom-in h-48 lg:h-64"
                  onClick={() => {
                    const event = new CustomEvent('openImageZoom', {
                      detail: { src: img('DSC07547.jpg'), alt: 'Atividades práticas e divertidas' }
                    });
                    window.dispatchEvent(event);
                  }}
                />
              </div>

              {/* Elemento decorativo - escondido no mobile */}
              <div className="hidden lg:block absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full -z-10"></div>
            </div>

            {/* Badge flutuante - ajustado para mobile */}
            <div className="hidden lg:block absolute -right-4 top-8 bg-white rounded-2xl shadow-xl p-4 max-w-[200px] z-10">
              <p className="text-sm font-semibold text-primary">Aulas em Casa disponíveis na região dos setores Bueno e Marista</p>
            </div>

            {/* Badge embaixo no mobile */}
            <div className="lg:hidden mt-4 bg-white rounded-xl shadow-lg p-4 text-center">
              <p className="text-sm font-semibold text-primary">Aulas em Casa disponíveis na região dos setores Bueno e Marista</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
