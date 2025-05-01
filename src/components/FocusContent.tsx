import { LightBulbIcon, SparklesIcon } from '@heroicons/react/24/outline';
import image2 from '../assets/foco-e-acao/2.webp';
import image3 from '../assets/foco-e-acao/3.webp';
import image4 from '../assets/foco-e-acao/4.webp';
import image5 from '../assets/foco-e-acao/5.webp';
import image6 from '../assets/foco-e-acao/6.webp';

// Criando um ícone personalizado para o cérebro
const BrainIcon = (props: React.ComponentProps<'svg'>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v.01M12 12v.01M12 16v.01M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
  </svg>
);

const FocusContent = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Introdução */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
              Metodologia Baseada em Evidências
            </h2>
            <p className="mt-4 text-xl text-primary/80 max-w-3xl mx-auto">
              Todo o planejamento é feito considerando as melhores formas que o cérebro humano absorve e fixa conteúdo, 
              conforme estudos científicos mundialmente reconhecidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="relative">
              <img
                src={image2}
                alt="Aprendizado baseado em evidências"
                className="rounded-xl shadow-lg"
              />
            </div>

            <div>
              <p className="text-lg text-primary/80">
                A escolha dos materias didáticos e recursos pedagógicos, a abordagem dos conteúdos, 
                a propositura e desenvolvimento das atividades durante cada semestre, o planejamento 
                das aulas dos nossos queridos adolescentes e crianças; tudo é feito levando em 
                consideração as melhores formas que o cérebro humano absorve e fixa conteúdo.
              </p>
            </div>
          </div>
        </div>

        {/* Segunda seção */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-primary mb-6">
                Abordagem Ativa e Envolvente
              </h2>
              <p className="text-lg text-primary/80">
                Por essa razão é que trabalhamos de forma ativa, incentivando a análise crítica, 
                o raciocínio, a interpretação do conteúdo trabalhado, a criatividade para a 
                solução de problemas, a improvisação, o diálogo, os jogos e as brincadeiras.
              </p>
              
              <div className="mt-8 flex gap-4">
                <div className="bg-background-light p-5 rounded-xl shadow-sm flex-1">
                  <LightBulbIcon className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="text-lg font-semibold text-primary">Criatividade</h3>
                  <p className="text-primary/80 text-sm mt-2">
                    Estimulamos o pensamento criativo e a busca por soluções inovadoras.
                  </p>
                </div>
                
                <div className="bg-background-light p-5 rounded-xl shadow-sm flex-1">
                  <BrainIcon className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="text-lg font-semibold text-primary">Raciocínio</h3>
                  <p className="text-primary/80 text-sm mt-2">
                    Desenvolvemos o pensamento crítico e a capacidade analítica.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src={image3}
                alt="Aprendizado ativo e envolvente"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Terceira seção */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <img
                src={image4}
                alt="Crianças pensantes e criativas"
                className="rounded-xl shadow-lg"
              />
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-extrabold text-primary mb-6">
                Crianças Pensantes e Criativas
              </h2>
              <p className="text-lg text-primary/80">
                Não queremos crianças robotizadas, que apenas decoram e reproduzem frases prontas. 
                Queremos crianças pensantes, interessadas e interessantes!
              </p>
              
              <div className="mt-8 bg-background-light p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <SparklesIcon className="h-8 w-8 text-secondary mr-3" />
                  <h3 className="text-xl font-semibold text-primary">Além da Memorização</h3>
                </div>
                <p className="text-primary/80">
                  Acreditamos que o verdadeiro aprendizado vai muito além de decorar frases e regras.
                  Priorizamos a compreensão e o uso prático do idioma.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quarta seção */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-primary mb-6">
                Quando a Memorização é Útil
              </h2>
              <p className="text-lg text-primary/80">
                Nesse contexto, a memorização é utilizada apenas quando é requisito necessário para 
                desenvolver projetos específicos; como em apresentações teatrais, para recitar aquele 
                poema legal que a teacher colou no caderno, cantar a paródia produzida em sala ou 
                contar aquela piada engraçada para os colegas.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-background-light p-4 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-primary">Teatro</h3>
                  <p className="text-primary/80 text-sm mt-2">
                    Apresentações teatrais que estimulam a expressão e a confiança.
                  </p>
                </div>
                
                <div className="bg-background-light p-4 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-primary">Poesia</h3>
                  <p className="text-primary/80 text-sm mt-2">
                    Recitação de poemas para desenvolver pronúncia e ritmo.
                  </p>
                </div>
                
                <div className="bg-background-light p-4 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-primary">Música</h3>
                  <p className="text-primary/80 text-sm mt-2">
                    Paródias e canções que tornam o aprendizado divertido.
                  </p>
                </div>
                
                <div className="bg-background-light p-4 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-primary">Humor</h3>
                  <p className="text-primary/80 text-sm mt-2">
                    Piadas e histórias que criam conexão com a língua.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src={image5}
                alt="Memorização para projetos específicos"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Quinta seção */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <img
                src={image6}
                alt="Língua viva e dinâmica"
                className="rounded-xl shadow-lg"
              />
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-extrabold text-primary mb-6">
                Língua Viva e Dinâmica
              </h2>
              <p className="text-lg text-primary/80 mb-4">
                Acreditamos na língua viva, dinâmica e cheia de surpresas; que une pessoas, 
                rompe barreiras e aproxima os povos. Sem fórmulas mágicas e mitos!
              </p>
              <p className="text-xl text-primary font-medium italic">
                "Apenas vivida e praticada com a naturalidade de um nativo!"
              </p>
              
              <div className="mt-8">
                <div className="inline-flex rounded-md shadow">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary-light transition-colors"
                  >
                    Conheça Nossa Escola
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl mb-8">
            Venha Conhecer Nossa Metodologia na Prática
          </h2>
          <div className="inline-flex rounded-md shadow">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-primary hover:bg-primary-light transition-colors"
            >
              Agende uma Aula Experimental
            </a>
          </div>
          <p className="mt-4 text-sm text-primary/70">
            Descubra como podemos transformar o aprendizado do inglês para seu filho.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FocusContent; 