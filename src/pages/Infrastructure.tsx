import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeCarousel from '../components/FadeCarousel';
import ImageCollage from '../components/ImageCollage';
import ScrollingBackground from '../components/ScrollingBackground';
import { SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
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
                A escola conta com <strong>salas de aula</strong> com layout interativo, utilizando mesas redondas que favorecem a troca entre os alunos. As salas também possuem estantes com livros literários, decoração lúdica, climatização, e computadores disponíveis para atividades orientadas pelos professores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Card 2: Ambiente Temático */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 items-stretch">
            <div className="md:col-span-3 bg-white rounded-2xl shadow-xl p-8 md:p-10 flex flex-col justify-center">
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
            <div className="md:col-span-2">
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
                Sala multiuso equipada com karaokê, cozinha completa e palco. Espaço criativo onde os alunos são incentivados a atuar em apresentações, dramatizações e atividades práticas em inglês, desenvolvendo a fluência de forma natural e divertida.
              </p>
              <FadeCarousel
                images={[
                  { src: 'DSC07521.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07522.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07524.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07677.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07678.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07681.jpg', alt: 'Infrastructure image' }
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
                Espaço planejado para promover o convívio e o bem-estar dos alunos, com bancos, música ambiente, cesta de basquete e um pergolado com mesas que acolhem momentos de lanche, atividades artísticas e os responsáveis durante o período de espera.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { src: 'DSC07432.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07447.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07569.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07617.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07621.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07744.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07759.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07761.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07779.jpg', alt: 'Infrastructure image' },
                { src: 'DSC07801.jpg', alt: 'Infrastructure image' }
              ].map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-zoom-in group"
                  onClick={() => {
                    const event = new CustomEvent('openImageZoom', {
                      detail: { src: img(image.src), alt: image.alt }
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  <OptimizedImage
                    src={image.src}
                    alt={image.alt}
                    className="transition-transform duration-500 group-hover:scale-110 h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Card 5: Equipe */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-xl overflow-hidden p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                  Nosso Time
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
              <ImageCollage
                images={[
                  { src: 'DSC07209.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07218.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07318.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07335.jpg', alt: 'Infrastructure image' },
                  { src: 'DSC07402.jpg', alt: 'Infrastructure image' }
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <ScrollingBackground
        images={[
          { src: 'DSC06844.jpg', alt: 'Infrastructure image' },
          { src: 'DSC06852.jpg', alt: 'Infrastructure image' },
          { src: 'DSC06859.jpg', alt: 'Infrastructure image' },
          { src: 'DSC06862.jpg', alt: 'Infrastructure image' },
          { src: 'DSC06877.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07140.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07398.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07432.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07447.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07559.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07612.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07617.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07621.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07644.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07649.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07677.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07678.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07681.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07728.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07733.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07741.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07744.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07759.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07779.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07785.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07794.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07797.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07801.jpg', alt: 'Infrastructure image' },
          { src: 'DSC07807.jpg', alt: 'Infrastructure image' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">
            Venha Conhecer Pessoalmente!
          </h2>
          <p className="text-xl md:text-2xl text-white mb-8 drop-shadow-md">
            Agende uma visita e veja de perto toda a nossa estrutura pensada para o seu filho
          </p>
          <a
            href="#contact"
            className="inline-flex items-center px-8 py-4 bg-secondary hover:bg-secondary/90 text-primary font-bold rounded-lg transition-all shadow-2xl hover:shadow-xl text-lg"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/#contact';
            }}
          >
            Agende Sua Visita
          </a>
        </div>
      </ScrollingBackground>

      <Footer />
    </div>
  );
};

export default Infrastructure;
