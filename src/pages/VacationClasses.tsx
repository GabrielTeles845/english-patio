import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VacationHero from '../components/VacationHero';
import VacationContent from '../components/VacationContent';

const VacationClasses = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <VacationHero />
      <VacationContent />
      <Footer />
    </div>
  );
};

export default VacationClasses; 