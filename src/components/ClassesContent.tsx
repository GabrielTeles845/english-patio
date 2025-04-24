import { CheckCircleIcon, UserGroupIcon, HomeIcon, AcademicCapIcon, SparklesIcon } from '@heroicons/react/24/outline';
import classImage4 from '../assets/our-classes/4.webp';

const ClassesContent = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Flexibilidade de Local */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
              Flexibilidade para sua Família
            </h2>
            <p className="mt-4 text-xl text-primary/80 max-w-3xl mx-auto">
              A quantidade de alunos por turma e o local onde seu filho terá aulas são escolhidos por você!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background-light p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <HomeIcon className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-xl font-semibold text-primary">Aulas em Nossa Escola</h3>
              </div>
              <p className="text-primary/80">
                Ambiente especialmente preparado para o aprendizado de inglês, com recursos 
                pedagógicos e espaço acolhedor.
              </p>
            </div>

            <div className="bg-background-light p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <UserGroupIcon className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-xl font-semibold text-primary">Aulas em Grupo</h3>
              </div>
              <p className="text-primary/80">
                Turmas reduzidas para atendimento personalizado. Seu filho pode estudar com amigos 
                ou formar novas turminhas.
              </p>
            </div>

            <div className="bg-background-light p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-xl font-semibold text-primary">Aulas Personalizadas</h3>
              </div>
              <p className="text-primary/80">
                Aulas na sua casa, na escola, no condomínio ou onde for melhor para você. 
                Adaptamos nossa metodologia a cada contexto.
              </p>
            </div>
          </div>
        </div>

        {/* Metodologia */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-primary">
                Metodologia Dinâmica e Eficaz
              </h2>
              <p className="mt-4 text-lg text-primary/80">
                Ministramos aulas dinâmicas, com a utilização de diversos recursos pedagógicos. 
                O objetivo é promover o aprendizado da língua de forma natural, divertida e envolvente.
              </p>
              <p className="mt-4 text-lg text-primary/80">
                Desta forma, temos alunos interessados e motivados, que conseguem desenvolver, 
                simultaneamente, as 4 habilidades básicas para aquisição de um novo idioma de 
                forma consistente e tranquila.
              </p>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-primary mb-4">
                  As 4 Habilidades Desenvolvidas:
                </h3>
                <ul className="space-y-3">
                  {["Ouvir", "Falar", "Ler", "Escrever"].map((skill, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-6 w-6 text-secondary mr-2 flex-shrink-0" />
                      <span className="text-primary/80">{skill} em inglês com desenvoltura e sem stress</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative">
              <img
                src={classImage4}
                alt="Aulas de inglês no English Patio"
                className="rounded-xl shadow-lg"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary p-4 rounded-xl text-white shadow-lg">
                <div className="font-bold text-xl">Turmas Reduzidas</div>
                <div className="text-sm mt-1">Atenção personalizada</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Porque escolher */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
              Por Que Escolher o English Patio?
            </h2>
            <p className="mt-4 text-xl text-primary/80 max-w-3xl mx-auto">
              Cada um tem o tempo, a atenção e os estímulos necessários para crescer cada vez mais no idioma!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-background-light p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <SparklesIcon className="h-8 w-8 text-secondary mr-3" />
                <h3 className="text-xl font-semibold text-primary">Formação de Turminhas</h3>
              </div>
              <p className="text-primary/80 mb-4">
                "Tenho um filho mas gostaria que ele tivesse aulas em um trio. É possível?"
              </p>
              <p className="text-primary font-medium">
                Sim! Após um teste de nível, conectamos pais e alunos para que novas turminhas sejam formadas.
              </p>
            </div>

            <div className="bg-background-light p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <UserGroupIcon className="h-8 w-8 text-secondary mr-3" />
                <h3 className="text-xl font-semibold text-primary">Todos São Diferentes</h3>
              </div>
              <p className="text-primary/80 mb-2">
                Personalizamos ao máximo nossas aulas para atender às necessidades específicas de cada aluno.
              </p>
              <p className="text-primary font-medium italic">
                "Afinal, se somos diferentes, por que sermos tratados como se fôssemos iguais?"
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex rounded-md shadow">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-primary hover:bg-primary-light transition-colors"
            >
              Agende uma Avaliação de Nível
            </a>
          </div>
          <p className="mt-4 text-sm text-primary/70">
            Descubra o nível atual do seu filho e conheça o plano personalizado que podemos oferecer.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClassesContent; 