import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BuildingOffice2Icon, SparklesIcon, UserGroupIcon, HomeIcon } from '@heroicons/react/24/outline';

const Infrastructure = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-primary">Infraestrutura</span>{' '}
            <span className="text-secondary">que Estimula</span>{' '}
            <span className="text-primary">o Aprendizado</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
            A English Patio oferece um ambiente cuidadosamente planejado para promover o aprendizado com conforto, criatividade e acolhimento.
          </p>
        </div>
      </section>

      {/* Introdução ao Tour */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Faça um Tour Virtual pela English Patio
            </h2>
            <p className="text-xl text-gray-700">
              Cada espaço da escola foi pensado para estimular o desenvolvimento de crianças e adolescentes de forma leve e eficaz.
            </p>
          </div>
        </div>
      </section>

      {/* Card 1: Salas de Aula - Layout Full Width com imagem de fundo */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            {/* Placeholder de imagem como background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <BuildingOffice2Icon className="h-32 w-32 text-primary/30" />
                <span className="absolute bottom-4 right-4 text-gray-500 font-medium text-sm bg-white/80 px-3 py-1 rounded">
                  📸 TODO: Sala de aula com mesas redondas
                </span>
              </div>
            </div>
            {/* Conteúdo sobreposto */}
            <div className="relative bg-white/95 backdrop-blur-sm p-8 md:p-12 md:w-2/3">
              <div className="inline-block bg-secondary text-primary px-4 py-1 rounded-full text-sm font-semibold mb-4">
                01. Salas de Aula
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Mais de 10 Salas Interativas
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                A escola conta com <strong>mais de 10 salas de aula</strong>, todas com layout interativo, utilizando mesas redondas que favorecem a troca entre os alunos. As salas também possuem estantes com livros literários, decoração lúdica, climatização, e computadores disponíveis para atividades orientadas pelos professores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Card 2: Ambiente Temático - Layout com imagem grande ao lado */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 items-stretch">
            <div className="md:col-span-3 bg-white rounded-2xl shadow-xl p-8 md:p-10 flex flex-col justify-center">
              <div className="inline-block bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold mb-4 self-start">
                02. Decoração
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Ambiente Imersivo
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Os ambientes da escola são decorados com murais artísticos e elementos visuais que remetem à cultura de países de língua inglesa, criando uma atmosfera temática que contribui para a imersão no idioma desde o primeiro contato.
              </p>
            </div>
            <div className="md:col-span-2 relative aspect-[3/4] md:aspect-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <BuildingOffice2Icon className="h-16 w-16 text-primary/40 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium text-sm">📸 TODO: Murais ou decoração temática</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card 3: Fun Space - Card destacado centralizado */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl shadow-2xl overflow-hidden border-4 border-secondary">
            <div className="p-8 md:p-12 text-center">
              <SparklesIcon className="h-16 w-16 text-secondary mx-auto mb-6" />
              <div className="inline-block bg-secondary text-primary px-4 py-1 rounded-full text-sm font-semibold mb-4">
                03. Destaque Especial
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                Fun Space
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-8 max-w-3xl mx-auto">
                Sala multiuso equipada com karaokê, cozinha completa e palco. Espaço criativo onde os alunos são incentivados a atuar em apresentações, dramatizações e atividades práticas em inglês, desenvolvendo a fluência de forma natural e divertida.
              </p>
              {/* Placeholder de imagem */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <SparklesIcon className="h-16 w-16 text-primary/40 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium text-sm">📸 TODO: Fun Space com palco e karaokê</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card 4: Pátio - Layout em colunas assimétricas */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 items-stretch">
            <div className="md:col-span-2 relative aspect-[3/4] md:aspect-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <HomeIcon className="h-16 w-16 text-primary/40 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium text-sm">📸 TODO: Pátio com pergolado</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-3 bg-white rounded-2xl shadow-xl p-8 md:p-10 flex flex-col justify-center">
              <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-4 self-start">
                04. Área Externa
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Pátio Amplo e Acolhedor
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Espaço planejado para promover o convívio e o bem-estar dos alunos, com bancos, música ambiente, cesta de basquete e um pergolado com mesas que acolhem momentos de lanche, atividades artísticas e os responsáveis durante o período de espera.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Card 5: Equipe - Layout em grid com múltiplas informações */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-xl overflow-hidden p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                  05. Nosso Time
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                  Equipe Solícita e Dedicada
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Profissionais qualificados e sempre presentes para orientar e acompanhar cada aluno de perto.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-secondary rounded-full p-2 mt-1">
                      <UserGroupIcon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-gray-700">Comunicação constante com pais e responsáveis</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-secondary rounded-full p-2 mt-1">
                      <UserGroupIcon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-gray-700">Suporte personalizado e atencioso</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-secondary rounded-full p-2 mt-1">
                      <UserGroupIcon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-gray-700">Acompanhamento durante toda a jornada</p>
                  </div>
                </div>
              </div>
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <UserGroupIcon className="h-16 w-16 text-primary/40 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium text-sm">📸 TODO: Equipe ou professores com alunos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-primary">Venha Conhecer</span>{' '}
            <span className="text-secondary">Pessoalmente!</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Agende uma visita e veja de perto toda a nossa estrutura pensada para o seu filho
          </p>
          <a
            href="#contact"
            className="inline-flex items-center px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-lg"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/#contact';
            }}
          >
            Agende Sua Visita
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Infrastructure;
