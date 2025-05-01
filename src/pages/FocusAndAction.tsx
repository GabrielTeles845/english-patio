import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FocusHero from '../components/FocusHero';
import FocusContent from '../components/FocusContent';

const FocusAndAction = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 md:pt-16"> {/* Espaço para o navbar fixo, ajustado para mobile */}
        <FocusHero />
        <FocusContent />
        <Footer />
      </div>
    </div>
  );
};

export default FocusAndAction; 