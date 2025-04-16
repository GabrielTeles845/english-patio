import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';

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
    description: 'Aprendizado através de jogos e atividades práticas'
  },
  {
    title: 'Fun Space',
    description: 'Ambiente especialmente projetado para crianças'
  },
];

const HeroSection = () => {
  return (
    <div className="relative pt-24 overflow-hidden bg-gradient-to-b from-white to-blue-50">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-40 -left-20 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 lg:py-24">
          {/* Conteúdo à esquerda */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              <span className="block text-primary">Aprenda inglês</span>
              <span className="block text-secondary -mt-1">de forma divertida!</span>
            </h1>
            
            <p className="mt-8 text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
              Na English Patio, seu filho aprende inglês naturalmente através de 
              brincadeiras e atividades interativas, com professores especializados 
              em ensino infantil.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="#contact"
                className="btn-primary group"
              >
                Agende uma Aula Grátis
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#courses"
                className="btn-secondary"
              >
                Conheça Nossos Cursos
              </a>
            </div>

            {/* Cards de features */}
            <div className="mt-16 grid sm:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div 
                  key={feature.title}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-secondary/10 rounded-full p-2">
                        <CheckIcon className="h-6 w-6 text-secondary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{feature.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imagem à direita */}
          <div className="relative lg:ml-8">
            <div className="relative">
              {/* Círculo decorativo */}
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-secondary/10 rounded-full"></div>
              
              {/* Container da imagem com efeitos */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                <img
                  className="w-full h-auto"
                  src="/english-patio/assets/ao-vivo.jpeg"
                  alt="Crianças aprendendo inglês de forma divertida"
                />
                
                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay"></div>
              </div>

              {/* Elemento decorativo */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full"></div>
            </div>

            {/* Badge flutuante */}
            <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-2xl shadow-xl p-4 max-w-[200px]">
              <p className="text-sm font-semibold text-primary">Mais de 500 alunos já aprenderam conosco!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 