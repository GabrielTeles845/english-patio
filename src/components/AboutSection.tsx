import { AcademicCapIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Metodologia Lúdica',
    description: 'Aprendizado através de brincadeiras, músicas e atividades interativas.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Professores Especializados',
    description: 'Equipe qualificada em ensino infantil e bilíngue.',
    icon: UserGroupIcon,
  },
  {
    name: 'Ambiente Acolhedor',
    description: 'Espaço projetado especialmente para crianças, com muita cor e diversão.',
    icon: GlobeAltIcon,
  },
];

const AboutSection = () => {
  return (
    <div className="py-12 bg-gradient-to-b from-background to-background-light" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Sobre Nós</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-primary sm:text-4xl">
            English Patio: Onde Aprender é Divertido!
          </p>
          <p className="mt-4 max-w-2xl text-xl text-primary lg:mx-auto">
            Transformamos o aprendizado de inglês em uma aventura divertida para crianças e adolescentes.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <div key={feature.name} className="relative card">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-full bg-secondary text-primary transform hover:scale-110 transition duration-300">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-primary">{feature.name}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-primary">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-12 text-center">
          <img
            src="/english-patio/assets/vacation-classes.jpg"
            alt="Crianças aprendendo inglês na English Patio"
            className="mx-auto rounded-2xl shadow-xl transform hover:scale-105 transition duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default AboutSection; 