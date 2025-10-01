import { useState, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Modal from './Modal';

// Tipos para o modal
type ModalData = {
  title: string;
  message: string;
};

const homeSubmenuItems = [
  { title: 'Aprenda Inglês', href: '#', section: 'top' },
  { title: 'Infraestrutura', href: '#about', section: 'about' },
  { title: 'Cursos', href: '#courses', section: 'courses' },
  { title: 'Feedbacks', href: '#testimonials', section: 'testimonials' },
  { title: 'Contato', href: '#contact', section: 'contact' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSubmenuOpen, setIsMobileSubmenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({ title: '', message: '' });
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isSubmenuClosing, setIsSubmenuClosing] = useState(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const location = useLocation();
  const submenuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Obter o caminho base da aplicação
  const basePath = '';

  // Bloquear scroll quando menu estiver aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      // Pequeno timeout para esperar a animação do menu terminar
      setTimeout(() => {
        if (!isMenuOpen && !isMenuClosing) {
          document.body.style.overflow = '';
        }
      }, 300);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen, isMenuClosing]);

  const toggleMenu = () => {
    if (isMenuOpen) {
      // Animação de fechamento
      setIsMenuClosing(true);
      setTimeout(() => {
        setIsMenuOpen(false);
        setIsMenuClosing(false);
        setIsMobileSubmenuOpen(false);
        setIsSubmenuClosing(false);
      }, 280); // Tempo um pouco menor que a duração da animação
    } else {
      setIsMenuOpen(true);
    }
  };

  const toggleMobileSubmenu = (e: React.MouseEvent) => {
    // Previne a propagação apenas quando for para abrir o menu
    // para que o evento de clique global possa fechar o menu
    if (!isMobileSubmenuOpen) {
      e.stopPropagation();
      setIsMobileSubmenuOpen(true);
    } else {
      // Animação de fechamento do submenu
      setIsSubmenuClosing(true);
      setTimeout(() => {
        setIsMobileSubmenuOpen(false);
        setIsSubmenuClosing(false);
      }, 280); // Tempo um pouco menor que a duração da animação
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Função para lidar com o scroll suave para as seções
  const handleScrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    
    // Animação de fechamento
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
      setIsMobileSubmenuOpen(false);
      setIsSubmenuClosing(false);
      
      // Continua com o scroll após a animação
      if (location.pathname === '/' || location.pathname === basePath || location.pathname === `${basePath}/`) {
        if (sectionId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const section = document.getElementById(sectionId);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } else {
        if (sectionId === 'top') {
          window.location.href = `${basePath}/`;
        } else {
          window.location.href = `${basePath}/#${sectionId}`;
        }
      }
    }, 280);
  };
  
  // Função para exibir o modal "Em desenvolvimento"
  // const showDevelopmentModal = (e: React.MouseEvent, feature: string) => {
  //   e.preventDefault();
  //   setModalData({
  //     title: 'Em Desenvolvimento',
  //     message: `A funcionalidade "${feature}" está em desenvolvimento e estará disponível em breve!`
  //   });
  //   setModalOpen(true);

  //   // Fechar os menus com animação
  //   if (isMenuOpen) {
  //     setIsMenuClosing(true);
  //     setTimeout(() => {
  //       setIsMenuOpen(false);
  //       setIsMenuClosing(false);
  //       setIsMobileSubmenuOpen(false);
  //       setIsSubmenuClosing(false);
  //     }, 280);
  //   }
  // };
  
  // Efeito para fechar o submenu ao clicar em qualquer lugar
  useEffect(() => {
    const handleClickOutside = (_: MouseEvent) => {
      // Fecha o submenu em qualquer clique fora ou mesmo no botão quando estiver aberto
      if (isMobileSubmenuOpen) {
        setIsSubmenuClosing(true);
        setTimeout(() => {
          setIsMobileSubmenuOpen(false);
          setIsSubmenuClosing(false);
        }, 280);
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

  // Efeito para ouvir o evento personalizado do footer
  useEffect(() => {
    const handleShowDevelopmentModal = (e: CustomEvent) => {
      const { feature } = e.detail;
      setModalData({
        title: 'Em Desenvolvimento',
        message: `A funcionalidade "${feature}" está em desenvolvimento e estará disponível em breve!`
      });
      setModalOpen(true);
    };

    // Adiciona o listener para o evento personalizado
    document.addEventListener('showDevelopmentModal', handleShowDevelopmentModal as EventListener);

    return () => {
      document.removeEventListener('showDevelopmentModal', handleShowDevelopmentModal as EventListener);
    };
  }, []);

  // Auto-hide da navbar inteira ao fazer scroll
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - esconde a navbar inteira
        setIsNavbarVisible(false);
        setIsTopBarVisible(false);
      } else {
        // Scrolling up - mostra a navbar
        setIsNavbarVisible(true);
        setIsTopBarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <>
      {/* Overlay com blur para o fundo quando o menu mobile estiver aberto */}
      {(isMenuOpen || isMenuClosing) && (
        <div 
          ref={overlayRef}
          className={`fixed inset-0 bg-primary/10 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMenuClosing ? 'opacity-0' : 'opacity-100'}`}
          style={{ pointerEvents: 'all' }}
          onClick={toggleMenu}
        />
      )}
      
      <div className={`fixed w-full top-0 z-50 bg-white shadow-sm transition-transform duration-300 ${
        isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        {/* Barra superior */}
        <div
          className={`bg-primary/5 border-b border-primary/10 transition-all duration-300 overflow-hidden ${
            isTopBarVisible ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-2 text-sm text-center text-primary font-medium">
              Matrículas abertas para o primeiro semestre de 2026!
            </div>
          </div>
        </div>

        {/* Navbar principal */}
        <div className="bg-white border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/">
                  <Logo className="h-16 w-auto transform hover:scale-105 transition-transform duration-300" />
                </Link>
              </div>

              {/* Links de navegação - Desktop */}
              <div className="hidden md:flex items-center space-x-8">
                {/* Item Início com Submenu */}
                <div className="relative group">
                  <Link 
                    to="/"
                    className={`nav-item-hover flex items-center ${isActive('/') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors font-medium`}
                  >
                    Início
                    <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180 duration-300" />
                  </Link>
                  
                  {/* Submenu para Início - aparece no hover */}
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg py-2 w-48 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    {homeSubmenuItems.map((item, index) => (
                      <a
                        key={item.href}
                        href={item.href}
                        style={{ animationDelay: `${index * 50}ms` }} 
                        className="submenu-item-enter block px-4 py-2 text-primary hover:bg-primary/5 hover:text-secondary"
                        onClick={(e) => handleScrollToSection(e, item.section)}
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                </div>
                
                <Link
                  to="/metodologia"
                  className={`nav-item-hover ${isActive('/metodologia') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors font-medium`}
                >
                  Metodologia
                </Link>

                <Link
                  to="/vacation-classes"
                  className={`nav-item-hover ${isActive('/vacation-classes') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors font-medium`}
                >
                  Vacation Classes
                </Link>

                <Link
                  to="/infraestrutura"
                  className={`nav-item-hover ${isActive('/infraestrutura') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors font-medium`}
                >
                  Infraestrutura
                </Link>

                <Link
                  to="/matriculas"
                  className={`inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-light transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium ${isActive('/matriculas') ? 'ring-2 ring-secondary' : ''}`}
                >
                  Matrículas
                </Link>
              </div>

              {/* Botão do menu - Mobile */}
              <div className="md:hidden">
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-lg hover:bg-primary/5 transition-colors"
                  aria-label="Menu"
                >
                  {isMenuOpen ? (
                    <XMarkIcon className="h-6 w-6 text-primary transform rotate-90 animate-[spin_0.3s_ease-in-out]" />
                  ) : (
                    <Bars3Icon className="h-6 w-6 text-primary" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        {(isMenuOpen || isMenuClosing) && (
          <div 
            ref={menuRef}
            className={`absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-lg border-t border-primary/10 ${isMenuClosing ? 'mobile-menu-exit' : 'mobile-menu-enter'}`}
            style={{
              overflow: 'hidden',
              visibility: isMenuClosing && !isMenuOpen ? 'hidden' : 'visible',
              opacity: isMenuClosing && !isMenuOpen ? '0' : '1', 
              zIndex: 50
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col space-y-4">
                {/* Menu Início para Mobile */}
                <div>
                  <div className="flex justify-between items-center">
                    <Link
                      to="/"
                      className={`${isActive('/') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors py-2 font-medium`}
                      onClick={() => toggleMenu()}
                    >
                      Início
                    </Link>
                    <button
                      ref={submenuButtonRef}
                      onClick={toggleMobileSubmenu}
                      className="p-2 rounded-lg hover:bg-primary/5 transition-colors"
                      aria-label={isMobileSubmenuOpen ? "Fechar submenu" : "Abrir submenu"}
                    >
                      <ChevronDownIcon className={`h-5 w-5 transition-transform duration-300 ${isMobileSubmenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  
                  {(isMobileSubmenuOpen || isSubmenuClosing) && (
                    <div 
                      ref={submenuRef}
                      className={`pl-4 mt-2 border-l-2 border-primary/10 ${isSubmenuClosing ? 'submenu-container-exit' : 'submenu-container-enter'}`}
                      style={{ 
                        overflow: 'hidden', 
                        visibility: isSubmenuClosing && !isMobileSubmenuOpen ? 'hidden' : 'visible',
                        opacity: isSubmenuClosing && !isMobileSubmenuOpen ? '0' : '1'
                      }}
                    >
                      {homeSubmenuItems.map((item, index) => (
                        <a
                          key={item.href}
                          href={item.href}
                          style={{ animationDelay: `${index * 50}ms` }}
                          className="submenu-item-enter block py-2 text-primary hover:text-secondary"
                          onClick={(e) => handleScrollToSection(e, item.section)}
                        >
                          {item.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                
                <Link
                  to="/metodologia"
                  className={`${isActive('/metodologia') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors py-2 font-medium`}
                  onClick={() => toggleMenu()}
                >
                  Metodologia
                </Link>

                <Link
                  to="/vacation-classes"
                  className={`${isActive('/vacation-classes') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors py-2 font-medium`}
                  onClick={() => toggleMenu()}
                >
                  Vacation Classes
                </Link>

                <Link
                  to="/infraestrutura"
                  className={`${isActive('/infraestrutura') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors py-2 font-medium`}
                  onClick={() => toggleMenu()}
                >
                  Infraestrutura
                </Link>

                <Link
                  to="/matriculas"
                  className={`inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-light transition-colors font-medium transform hover:scale-105 transition-transform duration-300 ${isActive('/matriculas') ? 'ring-2 ring-secondary' : ''}`}
                  onClick={toggleMenu}
                >
                  Matrículas
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de funcionalidade em desenvolvimento */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        message={modalData.message}
        icon={<ExclamationTriangleIcon className="h-12 w-12 text-secondary" />}
      />
    </>
  );
};

export default Navbar; 