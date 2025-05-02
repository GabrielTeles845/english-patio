import { PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

// Reutilizando os mesmos itens do menu do Navbar para manter consistência
const homeSubmenuItems = [
  { title: 'Aprenda Inglês', href: '#', section: 'top' },
  { title: 'Sobre Nós', href: '#about', section: 'about' },
  { title: 'Cursos', href: '#courses', section: 'courses' },
  { title: 'Depoimentos', href: '#testimonials', section: 'testimonials' },
  { title: 'Contato', href: '#contact', section: 'contact' },
];

const Footer = () => {
  const basePath = '/english-patio';
  
  // Função para lidar com o scroll suave para as seções
  const handleScrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    
    // Se estiver na página inicial, fazer scroll suave
    if (window.location.pathname === '/' || 
        window.location.pathname === basePath || 
        window.location.pathname === `${basePath}/`) {
      if (sectionId === 'top') {
        // Scroll para o topo da página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Scroll para a seção específica
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      // Se não estiver na página inicial, navegar para a página inicial e depois para a seção
      if (sectionId === 'top') {
        window.location.href = `${basePath}/`;
      } else {
        window.location.href = `${basePath}/#${sectionId}`;
      }
    }
  };
  
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
              organizados em pequenas turmas de no máximo 6 alunos.
              Oferecemos aulas tanto em nossa sede quanto na casa dos alunos.
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="text-primary font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <a href={`${basePath}/`} className="text-gray-600 hover:text-secondary transition-colors font-medium">
                  Início
                </a>
                {/* Subitens de Início */}
                <ul className="ml-5 mt-2 space-y-2">
                  {homeSubmenuItems.map((item) => (
                    <li key={item.section}>
                      <a
                        href={item.href}
                        className="text-gray-500 hover:text-secondary transition-colors text-sm"
                        onClick={(e) => handleScrollToSection(e, item.section)}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              
              <li>
                <a href={`${basePath}/nossas-aulas`} className="text-gray-600 hover:text-secondary transition-colors font-medium">
                  Nossas Aulas
                </a>
              </li>
              
              <li>
                <a 
                  href={`${basePath}/foco-e-acao`} 
                  className="text-gray-600 hover:text-secondary transition-colors font-medium"
                >
                  Foco e Ação
                </a>
              </li>
              
              <li>
                <a 
                  href={`${basePath}/vacation-classes`} 
                  className="text-gray-600 hover:text-secondary transition-colors font-medium"
                >
                  Vacation Classes
                </a>
              </li>
              
              <li>
                <a 
                  href="#" 
                  className="text-gray-600 hover:text-secondary transition-colors font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    // Mostrar o modal de "Em desenvolvimento" - Reusa a mesma função da Navbar
                    const event = new CustomEvent('showDevelopmentModal', { 
                      detail: { feature: 'Login' } 
                    });
                    document.dispatchEvent(event);
                  }}
                >
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
                  href="mailto:englishpatio@yahoo.com"
                  className="text-gray-600 hover:text-secondary transition-colors"
                >
                  englishpatio@yahoo.com
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
              <div className="flex space-x-2 items-center">
                <a
                  href="https://instagram.com/englishpatio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-pink-600 transition-colors flex items-center"
                >
                  <svg 
                    className="h-6 w-6 mr-2" 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  @englishpatio
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