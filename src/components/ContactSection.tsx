import { PhoneIcon, MapPinIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 md:py-24 bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Contato</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Fale Conosco
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Estamos aqui para ajudar você a iniciar sua jornada no inglês
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Telefone */}
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                <PhoneIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Telefone</h3>
              <p className="mt-2 text-base text-gray-500 text-center">
                <a href="tel:+5562981953259" className="hover:text-primary">
                  (62) 98195-3259
                </a>
              </p>
              <p className="mt-2 text-sm text-gray-500 text-center">
                <span className="inline-flex items-center">
                  <svg className="h-4 w-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                  Também atendemos via WhatsApp
                </span>
              </p>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Disponível de Segunda a Sexta
                <br />
                das 8:00 às 19:00
              </p>
            </div>

            {/* Endereço */}
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                <MapPinIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Endereço</h3>
              <p className="mt-2 text-base text-gray-500 text-center">
                Av. F, 1541 - Quadra 01 Lote 12
                <br />
                Água Branca, Goiânia - GO, 74723-100
              </p>
              <p className="mt-2 text-sm text-gray-500 text-center">
                <span className="inline-flex items-center">
                  <svg className="h-4 w-4 mr-1 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Horário: Aberto - Fecha às 19:00
                </span>
              </p>
            </div>

            {/* Email */}
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                <EnvelopeIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Email</h3>
              <p className="mt-2 text-base text-gray-500 text-center">
                <a href="mailto:englishpatio@yahoo.com" className="hover:text-primary">
                  englishpatio@yahoo.com
                </a>
              </p>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Envie-nos suas dúvidas
                <br />
                Respondemos em até 24 horas
              </p>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Inclua seu telefone para retorno
              </p>
            </div>
          </div>

          {/* Informação sobre aulas */}
          <div className="mt-10 bg-white p-6 rounded-xl shadow-lg mx-auto max-w-3xl">
            <h3 className="text-lg font-medium text-center text-gray-900 mb-4">Oferecemos Flexibilidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-medium text-primary mb-2 flex items-center">
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Aulas em Nossa Sede
                </h4>
                <p className="text-sm text-gray-600">
                  Venha para o nosso espaço especialmente projetado para o aprendizado dinâmico e imersivo do inglês.
                </p>
              </div>
              <div className="bg-secondary/5 p-4 rounded-lg">
                <h4 className="font-medium text-secondary mb-2 flex items-center">
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Aulas em Casa
                </h4>
                <p className="text-sm text-gray-600">
                  Nossos professores podem ir até sua casa, proporcionando conforto e praticidade para o aprendizado do seu filho.
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Button */}
          <div className="mt-12 text-center">
            <a
              href="https://wa.me/5562981953259"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition duration-300"
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