import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ClassesHero from '../components/ClassesHero';
import ClassesContent from '../components/ClassesContent';

const OurClasses = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 md:pt-16"> {/* Espaço para o navbar fixo, ajustado para mobile */}
        <ClassesHero />
        <ClassesContent />
        <Footer />
      </div>
    </div>
  );
};

export default OurClasses; 