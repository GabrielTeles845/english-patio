import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import CoursesSection from '../components/CoursesSection';
import TestimonialsSection from '../components/TestimonialsSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-8"> {/* Reduzido de pt-16 para pt-8 */}
        <main>
          <HeroSection />
          <AboutSection />
          <CoursesSection />
          <TestimonialsSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Home; 