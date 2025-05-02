import heroImage from '../assets/vacation-classes/88dd5f0a-e2ee-4129-9a0a-ffc6523a5a9b.jpg';

const VacationHero = () => {
  return (
    <div className="relative bg-gradient-to-r from-background to-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          {/* Conteúdo textual */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl">
              Vacation Classes
            </h1>
            <p className="mt-6 text-xl text-primary max-w-3xl">
              Experiências imersivas e práticas em lugares reais para que seus filhos 
              aprendam inglês de forma natural e divertida durante as férias.
            </p>
            <div className="mt-8">
              <div className="inline-flex rounded-md shadow">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary-light transition-colors"
                >
                  Inscreva seu Filho
                </a>
              </div>
            </div>
          </div>
          
          {/* Imagem */}
          <div className="mt-12 lg:mt-0">
            <div className="relative">
              <img
                className="w-full h-[400px] object-cover rounded-xl shadow-xl"
                src={heroImage}
                alt="Vacation Classes na English Patio"
              />
              <div className="absolute inset-0 bg-primary/10 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationHero; 