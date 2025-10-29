import { useState, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, ExclamationTriangleIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Modal from './Modal';

// Tipos para o modal
type ModalData = {
  title: string;
  message: string;
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({ title: '', message: '' });
  const [isMenuClosing, setIsMenuClosing] = useState(false);

  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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
      }, 280); // Tempo um pouco menor que a duração da animação
    } else {
      setIsMenuOpen(true);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
      
      <div className="fixed w-full top-0 z-50 bg-white shadow-sm">
        {/* Barra superior */}
        <div className="bg-primary/5 border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-1 text-xs sm:text-sm text-center text-primary font-medium">
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
                {/* Item Início */}
                <Link
                  to="/"
                  className={`nav-item-hover ${isActive('/') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors font-medium`}
                >
                  Início
                </Link>
                
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

                {/* <Link
                  to="/infraestrutura"
                  className={`nav-item-hover ${isActive('/infraestrutura') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors font-medium`}
                >
                  Infraestrutura
                </Link> */}

                <Link
                  to="/matriculas"
                  className={`inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-light transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium ${isActive('/matriculas') ? 'ring-2 ring-secondary' : ''}`}
                >
                  Matrículas
                </Link>
              </div>

              {/* Botão do menu - Mobile */}
              <div className="md:hidden flex items-center gap-2">
                {/* Ícone de Matrículas */}
                <Link
                  to="/matriculas"
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary hover:bg-primary-light transition-colors"
                  aria-label="Matrículas"
                >
                  <AcademicCapIcon className="h-5 w-5 text-white" />
                </Link>

                {/* Menu Hamburguer */}
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
                <Link
                  to="/"
                  className={`${isActive('/') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors py-2 font-medium`}
                  onClick={() => toggleMenu()}
                >
                  Início
                </Link>
                
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

                {/* <Link
                  to="/infraestrutura"
                  className={`${isActive('/infraestrutura') ? 'text-secondary' : 'text-primary'} hover:text-secondary transition-colors py-2 font-medium`}
                  onClick={() => toggleMenu()}
                >
                  Infraestrutura
                </Link> */}

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