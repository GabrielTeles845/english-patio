import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeCarousel from '../components/FadeCarousel';
import { SparklesIcon } from '@heroicons/react/24/outline';
import img from '../config/cloudinary';
import OptimizedImage from '../components/OptimizedImage';

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
            O espaço da English Patio foi concebido para ir além de uma simples sala de aula: cada detalhe foi pensado para estimular o aprendizado de forma natural e prazerosa. O ambiente convida o aluno a se sentir à vontade, favorecendo a troca, a curiosidade e a confiança necessárias para aprender um novo idioma com segurança e entusiasmo.
          </p>
        </div>
      </section>


      {/* Card 1: Salas de Aula */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <div className="absolute inset-0">
              <OptimizedImage
                src="DSC06842.jpg"
                alt="Sala de aula com mesas redondas e decoração temática"
                className="h-full"
              />
            </div>
            <div className="relative bg-white/95 backdrop-blur-sm p-8 md:p-12 md:w-2/3">
              <div className="inline-block bg-secondary text-primary px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Salas de Aula
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Salas Interativas
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                As salas de aula da escola oferecem um ambiente acolhedor e funcional, com mesas redondas que incentivam a interação entre os alunos, espaço para leitura, estantes com livros literários e uma decoração que remete ao conforto de um lar. São climatizadas, garantindo o bem-estar de todos, e contam com computadores utilizados em atividades orientadas pelos professores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Card 2: Ambiente Temático */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 items-stretch">
            <div className="md:col-span-2 order-2 md:order-1">
              <FadeCarousel
                images={[
                  { src: 'DSC07744.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07759.jpg', alt: 'Infrastructure image' }
                ]}
                autoPlayInterval={4000}
                showIndicators={true}
                showControls={true}
                aspectRatio="aspect-[3/4] md:aspect-auto md:h-full"
              />
            </div>
            <div className="md:col-span-3 order-1 md:order-2 bg-white rounded-2xl shadow-xl p-8 md:p-10 flex flex-col justify-center">
              <div className="inline-block bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold mb-4 self-start">
                Decoração
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Ambiente Imersivo
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Os ambientes da escola são decorados com murais artísticos e elementos visuais que remetem à cultura de países de língua inglesa, criando uma atmosfera temática que contribui para a imersão no idioma desde o primeiro contato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Card 3: Fun Space */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl shadow-2xl overflow-hidden border-4 border-secondary">
            <div className="p-8 md:p-12 text-center">
              <SparklesIcon className="h-16 w-16 text-secondary mx-auto mb-6" />
              <div className="inline-block bg-secondary text-primary px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Destaque Especial
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                Fun Space
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-8 max-w-3xl mx-auto">
                A escola conta com uma sala multiuso equipada com karaokê, cozinha completa e palco, configurando um espaço criativo que estimula a expressão artística e a prática do idioma. Nesse ambiente, os alunos são incentivados a participar de apresentações, dramatizações e atividades práticas em inglês, além de assistirem a pequenos vídeos como parte das atividades didáticas, favorecendo o desenvolvimento da fluência de forma natural, dinâmica e envolvente.
              </p>
              <FadeCarousel
                images={[
                  { src: 'DSC07677.jpg', alt: 'Fun Space' },
                  { src: 'DSC07678.jpg', alt: 'Fun Space' },
                  { src: 'DSC07681.jpg', alt: 'Fun Space' }
                ]}
                autoPlayInterval={4000}
                showIndicators={true}
                showControls={true}
                aspectRatio="aspect-video"
                className="rounded-xl overflow-hidden shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Card 4: Pátio Amplo */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Área Externa
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Pátio Amplo e Acolhedor
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                Espaço cuidadosamente planejado para promover o convívio e o bem-estar dos alunos, com bancos, música ambiente, cesta de basquete e um pergolado com mesas que acolhem momentos de lanche, atividades artísticas e os responsáveis durante o período de espera. O ambiente conta ainda com gramado sintético e serve como espaço para a realização de atividades didáticas mais dinâmicas, contribuindo para uma atmosfera acolhedora, agradável e inspiradora.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('DSC07432.jpg'), alt: 'Pátio Amplo' }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <OptimizedImage
                  src="DSC07432.jpg"
                  alt="Pátio Amplo"
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
              </div>
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('DSC07447.jpg'), alt: 'Pátio Amplo' }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <OptimizedImage
                  src="DSC07447.jpg"
                  alt="Pátio Amplo"
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
              </div>
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('DSC07617.jpg'), alt: 'Pátio Amplo' }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <OptimizedImage
                  src="DSC07617.jpg"
                  alt="Pátio Amplo"
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
              </div>
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('DSC07621.jpg'), alt: 'Pátio Amplo' }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <OptimizedImage
                  src="DSC07621.jpg"
                  alt="Pátio Amplo"
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
              </div>
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('DSC07744.jpg'), alt: 'Pátio Amplo' }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <OptimizedImage
                  src="DSC07744.jpg"
                  alt="Pátio Amplo"
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
              </div>
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('DSC07801.jpg'), alt: 'Pátio Amplo' }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <OptimizedImage
                  src="DSC07801.jpg"
                  alt="Pátio Amplo"
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
              </div>
              {/* Penúltima foto ocupando 2 lugares */}
              <div
                className="relative aspect-[4/3] md:col-span-2 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
                onClick={() => {
                  const event = new CustomEvent('openImageZoom', {
                    detail: { src: img('DSC07779.jpg'), alt: 'Pátio Amplo' }
                  });
                  window.dispatchEvent(event);
                }}
              >
                <OptimizedImage
                  src="DSC07779.jpg"
                  alt="Pátio Amplo"
                  className="transition-transform duration-500 group-hover:scale-110 h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Final */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-10 text-primary">
            Agende sua visita!
          </h2>
          <a
            href="#contact"
            className="inline-flex items-center px-10 py-5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg hover:scale-105"
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
