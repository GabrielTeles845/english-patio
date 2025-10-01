import { BuildingOffice2Icon, SparklesIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const highlights = [
  {
    name: 'Fun Space',
    description: 'Sala multiuso com karaokê, cozinha e palco para apresentações em inglês',
    icon: SparklesIcon,
  },
  {
    name: 'Pátio Amplo',
    description: 'Espaço acolhedor com bancos, música ambiente, cesta de basquete e pergolado',
    icon: BuildingOffice2Icon,
  },
  {
    name: 'Equipe Solícita',
    description: 'Profissionais sempre presentes para orientar alunos, pais e responsáveis',
    icon: UserGroupIcon,
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-16 md:py-24 bg-blue-50">
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
            <div className="prose prose-lg">
              <p className="text-gray-700 leading-relaxed">
                A escola conta com <strong>mais de 10 salas de aula</strong>, todas com layout interativo,
                utilizando mesas redondas que favorecem a troca entre os alunos. As salas também possuem
                estantes com livros literários, decoração lúdica, climatização, e computadores disponíveis
                para atividades orientadas pelos professores.
              </p>

              <p className="text-gray-700 leading-relaxed">
                Os ambientes da escola são decorados com murais artísticos e elementos visuais que remetem
                à cultura de países de língua inglesa, criando uma atmosfera temática que contribui para
                a imersão no idioma desde o primeiro contato.
              </p>
            </div>

            {/* 3 Cards de Destaques */}
            <div className="grid gap-4 mt-8">
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
            <div className="pt-4">
              <Link
                to="/infraestrutura"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg group"
              >
                Conheça Nossa Infraestrutura
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Coluna de Carrossel de Imagens */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Placeholder para carrossel - você vai adicionar as imagens depois */}
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <SparklesIcon className="h-16 w-16 text-primary/40 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    📸 TODO: Adicionar carrossel automático com fotos da infraestrutura
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    (Fachada, salas de aula, Fun Space, Pátio, etc.)
                  </p>
                </div>
              </div>

              {/* Decoração */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
            </div>

            {/* Badge flutuante decorativo */}
            <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 hidden lg:block">
              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="h-6 w-6 text-secondary" />
                <div>
                  <p className="text-xs text-gray-500">Mais de</p>
                  <p className="text-lg font-bold text-primary">10 salas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
