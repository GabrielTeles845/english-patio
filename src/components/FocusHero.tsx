import heroImage from '../assets/foco-e-acao/1.svg';

const FocusHero = () => {
  return (
    <div className="relative bg-gradient-to-r from-background to-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          {/* Conteúdo textual */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl">
              Foco e Ação
            </h1>
            <p className="mt-6 text-xl text-primary max-w-3xl">
              Nossa metodologia é baseada nas melhores práticas de aprendizado, tornando o ensino 
              de inglês natural, divertido e eficaz para crianças e adolescentes.
            </p>
            <div className="mt-8">
              <div className="inline-flex rounded-md shadow">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary-light transition-colors"
                >
                  Conheça Nossa Metodologia
                </a>
              </div>
            </div>
          </div>
          
          {/* Imagem */}
          <div className="mt-12 lg:mt-0">
            <div className="relative">
              <img
                className="w-full rounded-xl shadow-xl"
                src={heroImage}
                alt="Foco e Ação na English Patio"
              />
              <div className="absolute inset-0 bg-primary/10 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusHero; 