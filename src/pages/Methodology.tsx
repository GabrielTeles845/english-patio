import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SparklesIcon, LightBulbIcon, HeartIcon } from '@heroicons/react/24/outline';

const Methodology = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-primary">Nossa</span>{' '}
            <span className="text-secondary">Metodologia</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700">
            Aprender Inglês de Forma Natural e Divertida
          </p>
        </div>
      </section>

      {/* Carta para os Pais */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              Queridos pais e responsáveis,
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              Sabemos que escolher uma escola de inglês para seus filhos é uma decisão importante. Vocês querem ter certeza de
              que estão investindo em um método que realmente funciona, que respeita o ritmo de aprendizado de cada criança e
              que, acima de tudo, faz com que elas gostem de aprender.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              É por isso que gostaríamos de compartilhar com vocês um pouco sobre como trabalhamos aqui no English Patio.
            </p>

            <h2 className="text-3xl font-bold text-primary mt-12 mb-6">
              Aprender Fazendo: O Segredo das Metodologias Ativas
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Nossa abordagem é baseada em algo chamado <strong>Metodologias Ativas</strong>. Mas o que isso significa na prática?
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              Imagine que, em vez de apenas ouvir o professor falar sobre cores em inglês, seu filho está pintando, criando arte,
              brincando com massinha colorida – tudo isso enquanto usa as palavras em inglês naturalmente. Em vez de decorar verbos
              em uma lista, ele está cozinhando uma receita simples, seguindo instruções em inglês, provando o resultado e se
              divertindo no processo.
            </p>
          </div>

          {/* Card Destacado: Metodologias Ativas */}
          <div className="my-12 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 shadow-lg border-2 border-primary/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                <SparklesIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary mb-3">
                  O que são Metodologias Ativas?
                </h3>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              São estratégias de ensino onde o aluno é o protagonista do próprio aprendizado. Em vez de apenas ouvir, ele
              experimenta, cria, interage, resolve problemas reais e aprende fazendo.
            </p>

            <p className="text-gray-700 leading-relaxed">
              No English Patio, acreditamos que a melhor forma de aprender inglês é vivenciando o idioma através de atividades
              práticas, jogos, projetos e muita interação – sempre de forma leve e divertida!
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-8">
              Essa é a essência do nosso trabalho: colocar as crianças e adolescentes no centro do aprendizado. Eles não são
              apenas receptores passivos de informação – são exploradores ativos do idioma.
            </p>

            <h2 className="text-3xl font-bold text-primary mt-12 mb-6">
              Foco e Ação: Nossos Pilares
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Trabalhamos com dois pilares fundamentais que guiam todas as nossas aulas:
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-white rounded-xl p-6 shadow-md border border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <LightBulbIcon className="h-6 w-6 text-secondary" />
                  <h3 className="text-xl font-bold text-primary">Foco</h3>
                </div>
                <p className="text-gray-700">
                  Cada atividade tem um objetivo claro e é cuidadosamente planejada para desenvolver habilidades específicas:
                  conversação, compreensão, leitura ou escrita. Nada é aleatório. Tudo tem um propósito pedagógico bem definido.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-secondary/20">
                <div className="flex items-center gap-3 mb-3">
                  <SparklesIcon className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary">Ação</h3>
                </div>
                <p className="text-gray-700">
                  Aprender inglês não pode ser uma experiência passiva. Por isso, nossas aulas são cheias de movimento,
                  criatividade e interação. Jogos, dramatizações, projetos em grupo, músicas, tecnologia – usamos tudo que possa
                  tornar o aprendizado mais envolvente e significativo.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-primary mt-12 mb-6">
              Aprendizado que Vai Além da Sala de Aula
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Acreditamos que o aprendizado vai além da sala de aula. Ele também acontece em casa, nos hábitos e estímulos do dia
              a dia. Por isso, seguimos contando com o apoio de vocês para incentivar os filhos nas tarefas, reforçar o conteúdo
              de forma natural e manter vivo o interesse e a motivação contínua para aprender.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              Livros, músicas, brincadeiras, filmes e séries em inglês são grandes aliados nesse processo – reforçam o conteúdo
              de forma natural e divertida.
            </p>

            <h2 className="text-3xl font-bold text-primary mt-12 mb-6">
              Nosso Compromisso com Você
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              Nossa equipe está sempre pronta para acompanhar de perto o desenvolvimento de cada aluno. Oferecemos um ambiente
              acolhedor, seguro e estimulante, onde cada criança e adolescente se sente confiante para se expressar, errar, tentar
              de novo e, principalmente, se divertir enquanto aprende.
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              Seguimos firmes no compromisso com a qualidade e o desenvolvimento de cada aluno. Queremos que seus filhos não apenas
              aprendam inglês – queremos que eles amem aprender inglês.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              Agradecemos pela confiança. Estamos animados para mais um período cheio de descobertas, conquistas e muito aprendizado!
            </p>

            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-2 text-primary">
                <HeartIcon className="h-6 w-6" />
                <p className="text-xl font-semibold">Com carinho,</p>
              </div>
              <p className="text-2xl font-bold text-primary mt-2">Equipe English Patio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Galeria de Imagens - Placeholder */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Nossas Aulas em Ação
            </h2>
            <p className="text-xl text-gray-600">
              Veja como aplicamos as metodologias ativas no dia a dia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {['Atividades Práticas', 'Jogos Interativos', 'Projetos em Grupo'].map((title, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-lg"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <SparklesIcon className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium text-sm">📸 TODO: {title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Venha Conhecer Nossa Metodologia na Prática!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Agende uma aula experimental e veja como seu filho vai se apaixonar pelo inglês
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center px-8 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors shadow-lg text-lg"
          >
            Fale Conosco
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Methodology;
