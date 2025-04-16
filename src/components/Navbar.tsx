import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
              <Logo className="h-16 w-auto" />
            </div>

            {/* Links de navegação - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-primary hover:text-secondary transition-colors font-medium">
                Início
              </a>
              <a href="#about" className="text-primary hover:text-secondary transition-colors font-medium">
                Sobre
              </a>
              <a href="#courses" className="text-primary hover:text-secondary transition-colors font-medium">
                Cursos
              </a>
              <a href="#testimonials" className="text-primary hover:text-secondary transition-colors font-medium">
                Depoimentos
              </a>
              <a
                href="#contact"
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
              <a
                href="#"
                className="text-primary hover:text-secondary transition-colors py-2 font-medium"
                onClick={toggleMenu}
              >
                Início
              </a>
              <a
                href="#about"
                className="text-primary hover:text-secondary transition-colors py-2 font-medium"
                onClick={toggleMenu}
              >
                Sobre
              </a>
              <a
                href="#courses"
                className="text-primary hover:text-secondary transition-colors py-2 font-medium"
                onClick={toggleMenu}
              >
                Cursos
              </a>
              <a
                href="#testimonials"
                className="text-primary hover:text-secondary transition-colors py-2 font-medium"
                onClick={toggleMenu}
              >
                Depoimentos
              </a>
              <a
                href="#contact"
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