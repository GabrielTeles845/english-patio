import { useState, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

const homeSubmenuItems = [
  { title: 'Aprenda Inglês', href: '#', section: 'top' },
  { title: 'Sobre Nós', href: '#about', section: 'about' },
  { title: 'Cursos', href: '#courses', section: 'courses' },
  { title: 'Depoimentos', href: '#testimonials', section: 'testimonials' },
  { title: 'Contato', href: '#contact', section: 'contact' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSubmenuOpen, setIsMobileSubmenuOpen] = useState(false);
  const location = useLocation();
  const submenuButtonRef = useRef<HTMLButtonElement>(null);

  // Obter o caminho base da aplicação
  const basePath = '/english-patio';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Fechar o submenu quando fechar o menu principal
    if (isMenuOpen) {
      setIsMobileSubmenuOpen(false);
    }
  };

  const toggleMobileSubmenu = (e: React.MouseEvent) => {
    // Previne a propagação apenas quando for para abrir o menu
    // para que o evento de clique global possa fechar o menu
    if (!isMobileSubmenuOpen) {
      e.stopPropagation();
    }
    setIsMobileSubmenuOpen(!isMobileSubmenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Função para lidar com o scroll suave para as seções
  const handleScrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    
    // Fechar menus
    setIsMenuOpen(false);
    setIsMobileSubmenuOpen(false);
    
    // Se estiver na página inicial, fazer scroll suave
    if (location.pathname === '/' || location.pathname === basePath || location.pathname === `${basePath}/`) {
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
  
  // Efeito para fechar o submenu ao clicar em qualquer lugar
  useEffect(() => {
    const handleClickOutside = (_: MouseEvent) => {
      // Fecha o submenu em qualquer clique fora ou mesmo no botão quando estiver aberto
      if (isMobileSubmenuOpen) {
        setIsMobileSubmenuOpen(false);
      }
    };

    // Adiciona o listener apenas quando o submenu estiver aberto
    if (isMobileSubmenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileSubmenuOpen]);

  return (
    <div className="fixed w-full top-0 z-50">
      {/* Barra superior */}
      <div className="bg-white border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-2 text-sm text-center text-primary font-medium">
            🎉 Matrículas abertas para o segundo semestre de 2025!
          </div>
        </div>
      </div>

      {/* Navbar principal */}
      <div className="bg-white/95 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/">
                <Logo className="h-16 w-auto" />
              </Link>
            </div>

            {/* Links de navegação - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Item Início com Submenu */}
              <div className="relative group">
                <Link 
                  to="/"
                  className={`flex items-center ${isActive('/') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors font-medium`}
                >
                  Início
                  <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180" />
                </Link>
                
                {/* Submenu para Início - aparece no hover */}
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg py-2 w-48 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  {homeSubmenuItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-primary hover:bg-primary/5 hover:text-secondary"
                      onClick={(e) => handleScrollToSection(e, item.section)}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>
              
              <Link 
                to="/nossas-aulas" 
                className={`${isActive('/nossas-aulas') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors font-medium`}
              >
                Nossas Aulas
              </Link>
              
              <a href="#" className="text-primary hover:text-secondary transition-colors font-medium">
                Foco e Ação
              </a>
              
              <a href="#" className="text-primary hover:text-secondary transition-colors font-medium">
                Vacation Classes
              </a>
              
              <a
                href={`${basePath}/#contact`}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-light transition-colors font-medium"
              >
                Login
              </a>
            </div>

            {/* Botão do menu - Mobile */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-primary/5 transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6 text-primary" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-primary" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-lg border-t border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col space-y-4">
              {/* Menu Início para Mobile */}
              <div>
                <div className="flex justify-between items-center">
                  <Link
                    to="/"
                    className={`${isActive('/') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors py-2 font-medium`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Início
                  </Link>
                  <button
                    ref={submenuButtonRef}
                    onClick={toggleMobileSubmenu}
                    className="p-2 rounded-lg hover:bg-primary/5 transition-colors"
                    aria-label={isMobileSubmenuOpen ? "Fechar submenu" : "Abrir submenu"}
                  >
                    <ChevronDownIcon className={`h-5 w-5 transition-transform ${isMobileSubmenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {isMobileSubmenuOpen && (
                  <div className="pl-4 mt-2 border-l-2 border-primary/10">
                    {homeSubmenuItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block py-2 text-primary hover:text-secondary"
                        onClick={(e) => handleScrollToSection(e, item.section)}
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              <Link
                to="/nossas-aulas"
                className={`${isActive('/nossas-aulas') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors py-2 font-medium`}
                onClick={toggleMenu}
              >
                Nossas Aulas
              </Link>
              
              <a
                href="#"
                className="text-primary hover:text-secondary transition-colors py-2 font-medium"
                onClick={toggleMenu}
              >
                Foco e Ação
              </a>
              
              <a
                href="#"
                className="text-primary hover:text-secondary transition-colors py-2 font-medium"
                onClick={toggleMenu}
              >
                Vacation Classes
              </a>
              
              <a
                href={`${basePath}/#contact`}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-light transition-colors font-medium"
                onClick={toggleMenu}
              >
                Login
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar; 