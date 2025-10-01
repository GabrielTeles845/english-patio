const InstagramFeed = () => {
  return (
    <section className="py-16 md:py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
            Siga-nos no Instagram
          </h2>
          <p className="text-xl text-gray-600">
            Acompanhe nosso dia a dia e fique por dentro das novidades!
          </p>
        </div>

        {/* Widget do Instagram - TODO: Adicionar widget real */}
        <div className="max-w-5xl mx-auto">
          {/* Placeholder para o widget */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-dashed border-primary/20">
            <div className="mb-6">
              <svg
                className="h-16 w-16 text-primary/40 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <h3 className="text-2xl font-bold text-primary mb-3">
                📸 TODO: Widget do Instagram
              </h3>
              <p className="text-gray-600 mb-6">
                Aqui será integrado o feed do Instagram com 6-8 posts mais recentes usando Elfsight ou SnapWidget.
              </p>
            </div>

            {/* Instruções para implementação */}
            <div className="bg-blue-50/50 rounded-xl p-6 text-left max-w-2xl mx-auto">
              <p className="text-sm text-gray-700 mb-3 font-semibold">
                📝 Opções de implementação:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  <span><strong>Elfsight Instagram Feed</strong> - Widget gratuito pronto (6 posts)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  <span><strong>SnapWidget</strong> - HTML simples, gratuito até 8 posts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  <span><strong>Curator.io</strong> - Feed agregador (até 25 posts free)</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                O widget será inserido neste espaço assim que o código for obtido.
              </p>
            </div>
          </div>
        </div>

        {/* Botão Ver Mais */}
        <div className="text-center mt-8">
          <a
            href="https://www.instagram.com/englishpatio/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg
              className="h-6 w-6 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Ver Mais no Instagram
          </a>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
