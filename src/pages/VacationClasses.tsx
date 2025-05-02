import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VacationHero from '../components/VacationHero';
import VacationContent from '../components/VacationContent';

const VacationClasses = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 md:pt-16"> {/* Espaço para o navbar fixo, ajustado para mobile */}
        <VacationHero />
        <VacationContent />
        <Footer />
      </div>
    </div>
  );
};

export default VacationClasses; 