import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline';
// Separando os ícones das fotos para melhor organização
import iconVacation from '../assets/vacation-classes/3.webp'; // Ícone de férias
import iconBook from '../assets/vacation-classes/4.webp'; // Ícone de livro com coisas saindo
import iconHeart from '../assets/vacation-classes/5.webp'; // Ícone de coração com "we love it"
import image6 from '../assets/vacation-classes/6.webp';
import image7 from '../assets/vacation-classes/7.webp';
import image8 from '../assets/vacation-classes/8.webp';
import imagePark from '../assets/vacation-classes/88dd5f0a-e2ee-4129-9a0a-ffc6523a5a9b.jpg';
import imageCooking from '../assets/vacation-classes/227c9b0a-e790-46d4-be80-b7a85ca6cd8f.jpg';
import imageActivity from '../assets/vacation-classes/3341bfed-e291-4ef7-b431-8070c4967f2d.jpg';
import imageNature from '../assets/vacation-classes/0582aaf3-1fa8-4555-a88f-b7ea60d75385.jpg';
import imageExperience from '../assets/vacation-classes/733d1dd1-7481-4550-ab67-81374e2263ec.jpg';
import imageWhatsapp from '../assets/vacation-classes/WhatsApp Image 2025-05-01 at 21.47.12.jpeg';

// Imagens para o carrossel - usando apenas fotos reais para o carrossel
const carouselImages = [
  { src: image8, alt: 'Alunos se divertindo nas Vacation Classes' },
  { src: imageNature, alt: 'Experiência com a natureza' },
  { src: imagePark, alt: 'Atividades em grupo' },
  { src: imageCooking, alt: 'Atividades culinárias' },
  { src: imageWhatsapp, alt: 'Brincadeiras educativas' },
];

const VacationContent = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  };

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Carrossel de Imagens */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
              Conheça Nossas Vacation Classes
            </h2>
            <p className="mt-4 text-xl text-primary/80 max-w-3xl mx-auto">
              A cada semestre, em 4 oportunidades e locais distintos, propomos situações 
              do cotidiano e levamos nossos alunos para vivenciá-las.
            </p>
          </div>

          <div className="relative">
            {/* Carrossel */}
            <div className="relative overflow-hidden rounded-xl shadow-lg h-[500px]">
              {carouselImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute w-full h-full transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ pointerEvents: index === currentSlide ? 'auto' : 'none' }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-primary/5 rounded-xl"></div>
                </div>
              ))}

              {/* Controles do carrossel */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                aria-label="Imagem anterior"
              >
                <ChevronLeftIcon className="h-6 w-6 text-primary" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                aria-label="Próxima imagem"
              >
                <ChevronRightIcon className="h-6 w-6 text-primary" />
              </button>

              {/* Indicadores */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-primary' : 'bg-white/70'
                    }`}
                    aria-label={`Ir para slide ${index + 1}`}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Seção Onde são realizadas */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex justify-center mb-6">
                <img 
                  src={iconVacation} 
                  alt="Ícone de Férias" 
                  className="h-32 w-auto"
                />
              </div>
              <h2 className="text-3xl font-extrabold text-primary mb-6 text-center">
                Onde são nossas queridas e esperadas Vacation Classes?
              </h2>
              <p className="text-lg text-primary/80">
                Onde nossa imaginação e o interesse das turminhas nos levar! Parques, supermercados, 
                shoppings, floriculturas, zoológico, clubes...
              </p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Parques e Praças</h3>
                    <p className="text-primary/80">
                      Atividades ao ar livre, jogos e brincadeiras em inglês.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Shoppings e Supermercados</h3>
                    <p className="text-primary/80">
                      Compras simuladas, identificação de produtos e interações práticas.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Zoológico e Áreas Naturais</h3>
                    <p className="text-primary/80">
                      Aprendizado sobre animais e natureza com vocabulário específico.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src={imagePark}
                alt="Locais das Vacation Classes"
                className="rounded-xl shadow-lg object-cover h-[400px] w-full"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary p-4 rounded-xl text-white shadow-lg">
                <div className="font-bold text-xl">Ambientes Reais</div>
                <div className="text-sm mt-1">Diversão e aprendizado</div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção O que fazemos */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src={imageActivity}
                  alt="Atividades criativas"
                  className="rounded-xl shadow-lg object-cover h-[250px] w-full"
                />
                <img
                  src={image7}
                  alt="Atividades ao ar livre"
                  className="rounded-xl shadow-lg object-cover h-[250px] w-full"
                />
                <img
                  src={image6}
                  alt="Atividades em grupo"
                  className="rounded-xl shadow-lg object-cover h-[200px] w-full col-span-2"
                />
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="flex justify-center mb-6">
                <img 
                  src={iconBook} 
                  alt="Ícone de Livro com Ideias" 
                  className="h-32 w-auto"
                />
              </div>
              <h2 className="text-3xl font-extrabold text-primary mb-6 text-center">
                O que fazemos lá?
              </h2>
              <p className="text-lg text-primary/80 mb-4">
                O que nossa criatividade permitir! Culinária, artesanato, teatro, pintura, 
                passeios de bicicleta, picnic, gincanas, oficinas, tours...
              </p>
              
              <div className="mt-8 bg-background-light p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <SparklesIcon className="h-8 w-8 text-secondary mr-3" />
                  <h3 className="text-xl font-semibold text-primary">Atividades Práticas</h3>
                </div>
                <p className="text-primary/80">
                  Todas as atividades são planejadas para garantir que as crianças usem o 
                  inglês em situações reais de comunicação, ampliando seu vocabulário e 
                  desenvolvendo confiança no uso do idioma.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Valor Agregado */}
        <div className="mb-20 bg-background-light p-8 rounded-2xl shadow-sm">
          <div className="text-center mb-10">
            <img 
              src={iconHeart} 
              alt="We Love It" 
              className="h-32 w-auto mx-auto mb-4"
            />
            <h2 className="text-3xl font-extrabold text-primary">
              Valor Agregado para Toda a Família
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <img 
                src={imageExperience}
                alt="Experiência de aprendizado"
                className="rounded-lg w-full h-48 object-cover mb-4"
              />
              <h3 className="text-xl font-semibold text-primary mb-3">
                Compensamos os pais
              </h3>
              <p className="text-primary/80">
                Além de proporcionar uma maior vivência do idioma para nossos alunos, 
                compensamos os papais e mamães pelas mensalidades pagas nas férias!
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <img 
                src={imageCooking}
                alt="Aprendizado com diversão"
                className="rounded-lg w-full h-48 object-cover mb-4"
              />
              <h3 className="text-xl font-semibold text-primary mb-3">
                Valorizamos seu investimento
              </h3>
              <p className="text-primary/80">
                Desse modo, valorizamos seu dinheiro, agregamos valor ao aprendizado 
                de seu filho e fazemos o que mais amamos!
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <img 
                src={imageWhatsapp}
                alt="Crianças aprendendo inglês"
                className="rounded-lg w-full h-48 object-cover mb-4"
              />
              <h3 className="text-xl font-semibold text-primary mb-3">
                Nosso grande objetivo
              </h3>
              <p className="text-primary/80 font-medium">
                FORMAMOS CRIANÇAS FLUENTES EM INGLÊS
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl mb-8">
            Descubra as Próximas Vacation Classes
          </h2>
          <div className="inline-flex rounded-md shadow">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-primary hover:bg-primary-light transition-colors"
            >
              Fale Conosco
            </a>
          </div>
          <p className="mt-4 text-sm text-primary/70">
            Nossas Vacation Classes são exclusivas para alunos matriculados. Entre em contato para saber mais!
          </p>
        </div>
      </div>
    </div>
  );
};

export default VacationContent; 