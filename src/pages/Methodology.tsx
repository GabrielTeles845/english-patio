import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LearningPyramid from '../components/LearningPyramid';
import { SparklesIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import OptimizedImage from '../components/OptimizedImage';

const Methodology = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-48 pb-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-0">
            <span className="text-primary">Nossa</span>{' '}
            <span className="text-secondary">Metodologia</span>
          </h1>
        </div>
      </section>

      {/* Metodologias Ativas */}
      <section className="pt-8 pb-16 md:pt-12 md:pb-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Metodologias Ativas de Aprendizagem
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Na English Patio, adotamos estratégias pedagógicas fundamentadas nas metodologias ativas de ensino, que promovem a participação efetiva e o engajamento dos estudantes em seu processo de aprendizagem. Por meio de experiências práticas, contextualizadas e significativas, favorecemos o desenvolvimento das competências linguísticas de maneira natural, consistente e eficaz.
            </p>
          </div>

          {/* Grid com foto placeholder e texto */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 md:order-1">
              <h3 className="text-2xl font-bold text-primary mb-4">
                Aprendizagem Significativa
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Fundamentamos nossa prática pedagógica na teoria da aprendizagem significativa, onde o conhecimento prévio do aluno é ativado e conectado a novos conteúdos. Através de atividades contextualizadas e relevantes, o idioma deixa de ser abstrato e passa a fazer sentido real na vida dos alunos.
              </p>
            </div>
            <div className="order-1 md:order-2 rounded-xl aspect-[4/3] overflow-hidden shadow-lg">
              <OptimizedImage
                src="DSC07276.jpg"
                alt="Atividade de aprendizagem contextualizada"
                className="h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Foco e Ação */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Ferramentas de Ensino
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Selecionamos cuidadosamente materiais didáticos e recursos pedagógicos, além de desenvolvermos ferramentas próprias de aprendizagem, fundamentando todo o nosso planejamento em evidências científicas sobre os processos cognitivos envolvidos na aquisição e consolidação da linguagem.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-primary/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-secondary/10 rounded-full p-3 flex-shrink-0">
                  <LightBulbIcon className="h-8 w-8 text-secondary" />
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Cada atividade possui objetivos de aprendizagem claramente definidos, alinhados ao desenvolvimento progressivo das quatro habilidades linguísticas:
                </p>
              </div>

              {/* Grid de habilidades */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">👂</span>
                    <span className="font-bold text-blue-700 text-sm">Listening</span>
                  </div>
                  <p className="text-xs text-gray-600">Compreensão oral</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">💬</span>
                    <span className="font-bold text-green-700 text-sm">Speaking</span>
                  </div>
                  <p className="text-xs text-gray-600">Produção oral</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">📖</span>
                    <span className="font-bold text-purple-700 text-sm">Reading</span>
                  </div>
                  <p className="text-xs text-gray-600">Leitura e interpretação</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">✍️</span>
                    <span className="font-bold text-orange-700 text-sm">Writing</span>
                  </div>
                  <p className="text-xs text-gray-600">Escrita</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-secondary/10">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                  <SparklesIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Promovemos a análise crítica, o raciocínio lógico, a interpretação contextual e a resolução criativa de problemas. Embora reconheçamos a memorização como uma etapa inicial e necessária do processo de aprendizagem — atuando como ponte para a formação de frases e o desenvolvimento da conversação —, valorizamos dinâmicas interativas e repetição criativa como meios de consolidar o conhecimento. Assim, rejeitamos a memorização mecânica em favor de práticas pedagógicas que estimulam a autonomia, o pensamento crítico e a competência comunicativa genuína.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Pirâmide de Aprendizagem */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Por Que as Metodologias Ativas Funcionam?
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
              A Pirâmide de Glasser é um modelo que ilustra como diferentes formas de aprendizagem impactam na retenção do conhecimento. Segundo essa teoria, os alunos aprendem de maneira mais significativa quando participam ativamente do processo, especialmente ao praticar, discutir, ensinar e aplicar o que aprendem.
            </p>
          </div>

          <LearningPyramid />
        </div>
      </section>

      {/* Tipos de Metodologias Ativas */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Estratégias Pedagógicas Utilizadas
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Implementamos diversas metodologias ativas em nossas práticas pedagógicas diárias
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary mb-3">Aprendizagem Baseada em Projetos (PBL)</h3>
              <p className="text-gray-700 leading-relaxed">
                Desenvolvimento projetos temáticos que estimulam os alunos a investigar, planejar e executar atividades significativas, utilizando o inglês como ferramenta de comunicação autêntica e aplicada a contextos reais.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary mb-3">Aprendizagem Colaborativa</h3>
              <p className="text-gray-700 leading-relaxed">
                Valorização do trabalho em grupos heterogêneos, que favorece a interação constante, a negociação de significados e o desenvolvimento de competências socioemocionais, tendo o inglês como meio de expressão e colaboração.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary mb-3">Gamificação</h3>
              <p className="text-gray-700 leading-relaxed">
                Incorporação de elementos lúdicos e desafios significativos que potencializam o engajamento, a motivação intrínseca e a persistência dos alunos ao longo do processo de aquisição linguística.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary mb-3">Total Physical Response (TPR)</h3>
              <p className="text-gray-700 leading-relaxed">
                Integração de movimento corporal ao aprendizado linguístico, especialmente efetiva com crianças,
                promovendo conexão entre linguagem, cognição e ação física.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Agende uma Aula Experimental
          </h2>
          <a
            href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20agendar%20uma%20aula%20experimental."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg text-lg hover:scale-105"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Agendar pelo WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Methodology;
