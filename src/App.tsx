import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import CoursesSection from './components/CoursesSection';
import LevelsSection from './components/LevelsSection';
import PricingSection from './components/PricingSection';
import TestimonialsSection from './components/TestimonialsSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16"> {/* Espaço para o navbar fixo */}
        <HeroSection />
        <AboutSection />
        <CoursesSection />
        <LevelsSection />
        <PricingSection />
        <TestimonialsSection />
      </div>
      <Footer />
    </div>
  );
}

export default App; 