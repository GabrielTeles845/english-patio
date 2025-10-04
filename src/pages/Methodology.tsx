import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PinterestGallery from '../components/PinterestGallery';
import { SparklesIcon, LightBulbIcon, HeartIcon } from '@heroicons/react/24/outline';
import OptimizedImage from '../components/OptimizedImage';

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
            {[
              { title: 'Atividades Práticas', image: 'DSC07250.jpg', alt: 'Alunos em atividade prática com materiais educativos' },
              { title: 'Jogos Interativos', image: 'DSC07076.jpg', alt: 'Alunos jogando e aprendendo de forma interativa' },
              { title: 'Projetos em Grupo', image: 'DSC07185.jpg', alt: 'Alunos trabalhando em projetos colaborativos' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg group"
              >
                <OptimizedImage
                  src={item.image}
                  alt={item.alt}
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <p className="text-white font-bold text-lg p-4">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria de Momentos - Estilo Pinterest */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-primary">Momentos de</span>{' '}
              <span className="text-secondary">Aprendizado Real</span>
            </h2>
            <p className="text-lg text-gray-600">
              Veja nossos alunos em ação, aprendendo inglês de forma natural e divertida
            </p>
          </div>

          <PinterestGallery
            images={[
              { src: 'DSC07154.jpg', alt: 'Alunos colaborando em atividade', orientation: '16x9' },
              { src: 'DSC07166.jpg', alt: 'Momento de aprendizado interativo', orientation: '9x16' },
              { src: 'DSC07171.jpg', alt: 'Atividade em grupo', orientation: '16x9' },
              { src: 'DSC07189.jpg', alt: 'Aprendizado prático', orientation: '9x16' },
              { src: 'DSC07195.jpg', alt: 'Trabalho colaborativo', orientation: '16x9' },
              { src: 'DSC07199.jpg', alt: 'Professora com turma', orientation: '9x16' },
              { src: 'DSC07202.jpg', alt: 'Atividade lúdica', orientation: '16x9' },
              { src: 'DSC07209.jpg', alt: 'Momento de concentração', orientation: '9x16' },
              { src: 'DSC07218.jpg', alt: 'Aprendizado divertido', orientation: '16x9' },
              { src: 'DSC07222.jpg', alt: 'Trabalho em equipe', orientation: '16x9' },
              { src: 'DSC07224.jpg', alt: 'Atividade criativa', orientation: '9x16' },
              { src: 'DSC07276.jpg', alt: 'Momento de interação', orientation: '16x9' },
              { src: 'DSC07282.jpg', alt: 'Aprendizado natural', orientation: '9x16' },
              { src: 'DSC07285.jpg', alt: 'Atividade colaborativa', orientation: '16x9' },
              { src: 'DSC07301.jpg', alt: 'Experiência educativa', orientation: '9x16' },
              { src: 'DSC07304.jpg', alt: 'Momento especial', orientation: '16x9' },
              { src: 'DSC07311.jpg', alt: 'Aprendizado ativo', orientation: '9x16' },
              { src: 'DSC07314.jpg', alt: 'Atividade interativa', orientation: '16x9' },
              { src: 'DSC07329.jpg', alt: 'Trabalho em dupla', orientation: '9x16' },
              { src: 'DSC07335.jpg', alt: 'Momento de diversão', orientation: '16x9' },
              { src: 'DSC07355.jpg', alt: 'Aprendizado lúdico', orientation: '9x16' },
              { src: 'DSC07357.jpg', alt: 'Atividade prática', orientation: '16x9' },
              { src: 'DSC07363.jpg', alt: 'Momento educativo', orientation: '9x16' },
              { src: 'DSC07370.jpg', alt: 'Experiência de aprendizado', orientation: '16x9' },
              { src: 'DSC07402.jpg', alt: 'Atividade engajadora', orientation: '9x16' },
              { src: 'DSC07557.jpg', alt: 'Momento de descoberta', orientation: '16x9' },
            ]}
          />
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
