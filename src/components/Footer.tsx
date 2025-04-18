import { PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  return (
    <footer className="bg-white">
      {/* Seção principal do footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="col-span-1 md:col-span-2">
            <img src="/english-patio/assets/logo-index.webp" alt="English Patio" className="h-12 w-auto mb-4" />
            <p className="text-gray-600 mb-6">
              Somos a English Patio, uma escola de inglês que vai onde você está!
              Nosso maior compromisso? Tornar o inglês parte do cotidiano dos nossos alunos.
            </p>
            <p className="text-gray-600">
              Ensinamos inglês de forma lúdica, diferenciada e dinâmica, à crianças e adolescentes,
              organizados em pequenas turmas de no máximo 4 alunos ou individualmente.
              Oferecemos aulas tanto em nossa sede quanto na casa dos alunos.
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="text-primary font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-secondary transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-600 hover:text-secondary transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#methodology" className="text-gray-600 hover:text-secondary transition-colors">
                  Metodologia
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-600 hover:text-secondary transition-colors">
                  Contato
                </a>
              </li>
              <li>
                <a href="/login" className="text-gray-600 hover:text-secondary transition-colors">
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-primary font-semibold mb-4">Entre em Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-secondary" />
                <a 
                  href="tel:+556281953259" 
                  className="text-gray-600 hover:text-secondary transition-colors"
                >
                  (62) 98195-3259
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-secondary" />
                <a 
                  href="mailto:contato@englishpatio.com.br"
                  className="text-gray-600 hover:text-secondary transition-colors"
                >
                  contato@englishpatio.com.br
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-secondary flex-shrink-0" />
                <span className="text-gray-600">
                  Av. F, 1541 - Quadra 01 Lote 12<br />
                  Água Branca, Goiânia - GO, 74723-100
                </span>
              </li>
              <li className="flex items-start space-x-3 mt-2">
                <svg className="h-5 w-5 text-secondary flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">
                  Horário: Aberto - Fecha às 19:00
                </span>
              </li>
            </ul>

            {/* Redes sociais */}
            <div className="mt-6">
              <h3 className="text-primary font-semibold mb-4">Redes Sociais</h3>
              <div className="flex space-x-4">
                <a
                  href="https://instagram.com/englishpatio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-secondary transition-colors"
                >
                  @englishpatio
                </a>
                <a
                  href="https://facebook.com/englishpatio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-secondary transition-colors"
                >
                  /englishpatio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} English Patio. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 