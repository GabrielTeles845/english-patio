import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import CoursesSection from '../components/CoursesSection';
// import TestimonialsSection from '../components/TestimonialsSection';
import ContactSection from '../components/ContactSection';
import InstagramFeed from '../components/InstagramFeed';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 md:pt-28"> {/* Espaçamento para navbar com barra superior */}
        <main>
          <HeroSection />
          <AboutSection />
          <CoursesSection />
          <ContactSection />
          <InstagramFeed />
          {/* <TestimonialsSection /> */}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Home; 