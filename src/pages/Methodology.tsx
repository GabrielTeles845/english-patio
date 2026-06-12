import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LearningPyramid from '../components/LearningPyramid';
import { SparklesIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import OptimizedImage from '../components/OptimizedImage';
import { c } from '../content/site';

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
              {c('metodologia', 'metodologias-ativas-titulo')}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {c('metodologia', 'metodologias-ativas-paragrafo')}
            </p>
          </div>

          {/* Grid com foto placeholder e texto */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 md:order-1">
              <h3 className="text-2xl font-bold text-primary mb-4">
                {c('metodologia', 'aprendizagem-significativa-titulo')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {c('metodologia', 'aprendizagem-significativa-paragrafo')}
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
              {c('metodologia', 'ferramentas-titulo')}
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              {c('metodologia', 'ferramentas-paragrafo')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-primary/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-secondary/10 rounded-full p-3 flex-shrink-0">
                  <LightBulbIcon className="h-8 w-8 text-secondary" />
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {c('metodologia', 'ferramentas-card1-paragrafo')}
                </p>
              </div>

              {/* Grid de habilidades */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">👂</span>
                    <span className="font-bold text-blue-700 text-sm">{c('metodologia', 'habilidade-1-titulo')}</span>
                  </div>
                  <p className="text-xs text-gray-600">{c('metodologia', 'habilidade-1-descricao')}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">💬</span>
                    <span className="font-bold text-green-700 text-sm">{c('metodologia', 'habilidade-2-titulo')}</span>
                  </div>
                  <p className="text-xs text-gray-600">{c('metodologia', 'habilidade-2-descricao')}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">📖</span>
                    <span className="font-bold text-purple-700 text-sm">{c('metodologia', 'habilidade-3-titulo')}</span>
                  </div>
                  <p className="text-xs text-gray-600">{c('metodologia', 'habilidade-3-descricao')}</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">✍️</span>
                    <span className="font-bold text-orange-700 text-sm">{c('metodologia', 'habilidade-4-titulo')}</span>
                  </div>
                  <p className="text-xs text-gray-600">{c('metodologia', 'habilidade-4-descricao')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-secondary/10">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                  <SparklesIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {c('metodologia', 'ferramentas-card2-paragrafo')}
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
              {c('metodologia', 'piramide-titulo')}
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
              {c('metodologia', 'piramide-paragrafo')}
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
              {c('metodologia', 'estrategias-titulo')}
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              {c('metodologia', 'estrategias-paragrafo')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary mb-3">{c('metodologia', 'estrategia-1-titulo')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {c('metodologia', 'estrategia-1-paragrafo')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary mb-3">{c('metodologia', 'estrategia-2-titulo')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {c('metodologia', 'estrategia-2-paragrafo')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary mb-3">{c('metodologia', 'estrategia-3-titulo')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {c('metodologia', 'estrategia-3-paragrafo')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary mb-3">{c('metodologia', 'estrategia-4-titulo')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {c('metodologia', 'estrategia-4-paragrafo')}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            {c('metodologia', 'cta-titulo')}
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
            {c('metodologia', 'cta-whatsapp')}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Methodology;
