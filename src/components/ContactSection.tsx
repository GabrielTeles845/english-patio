import { PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

const ContactSection = () => {
  return (
    <section id="contact" className="py-12 md:py-16 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Fale Conosco
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Estamos prontos para ajudar você a começar sua jornada no inglês
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Cards de contato */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-8 items-stretch">
            {/* Telefone */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-100/30 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <PhoneIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">Telefone</h3>
                  <a
                    href="tel:+556236367775"
                    className="text-2xl font-semibold text-gray-900 hover:text-primary transition-colors mb-4 block"
                  >
                    (62) 3636-7775
                  </a>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mt-auto">
                    <svg className="h-4 w-4 text-primary flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      Seg a Sex: 8:00 - 18:30
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-primary/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <MapPinIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">Endereço</h3>
                  <p className="text-base text-gray-700 font-medium mb-1">
                    Av. F, 1541 - Quadra 01 Lote 12
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Água Branca, Goiânia - GO
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mt-auto">
                    <svg className="h-4 w-4 text-primary flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      Seg a Sex: 8:00 - 18:30
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Button */}
          <div className="text-center">
            <a
              href="https://wa.me/556236367775"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-green-700 transition duration-300"
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Fale conosco no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection; 