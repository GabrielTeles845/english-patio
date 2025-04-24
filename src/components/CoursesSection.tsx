import React from 'react';
import { AcademicCapIcon, ArrowRightIcon, BadgeCheckIcon } from '@heroicons/react/24/outline';

// Estrutura de dados para os níveis de curso
const courseLevels = {
  talkingTime: {
    title: 'TALKING TIME!',
    levels: [
      { name: 'Fun Conversation', color: 'from-amber-400 to-amber-500' }
    ]
  },
  listenUp: {
    title: 'LISTEN UP!',
    levels: [
      { name: 'Conversation 1', color: 'from-teal-400 to-teal-500' },
      { name: 'Conversation 2', color: 'from-red-400 to-red-500' },
      { name: 'Conversation 3', color: 'from-amber-400 to-amber-500' }
    ]
  },
  letsDoIt: {
    title: 'LET\'S DO IT!',
    levels: [
      { name: 'POWER 1', color: 'from-amber-400 to-amber-500' },
      { name: 'POWER 2', color: 'from-green-600 to-green-700' },
      { name: 'POWER 3', color: 'from-sky-400 to-sky-500' },
      { name: 'POWER 4', color: 'from-pink-500 to-pink-600' },
      { name: 'POWER 5', color: 'from-blue-500 to-blue-600' },
      { name: 'POWER 6', color: 'from-orange-400 to-orange-500' }
    ]
  },
  iCanDoIt: {
    title: 'I CAN DO IT!',
    levels: [
      { name: 'SPRINT 1', subtext: '(A - B)', color: 'from-amber-300 to-amber-400' },
      { name: 'SPRINT 2', subtext: '(A - B)', color: 'from-blue-300 to-blue-400' },
      { name: 'SPRINT 3', subtext: '(A - B)', color: 'from-pink-300 to-pink-400' },
      { name: 'SPRINT 4', subtext: '(A - B)', color: 'from-green-300 to-green-400' }
    ]
  },
  cambridge: {
    title: 'CAMBRIDGE PREPARATION',
    levels: [
      { name: 'KET', color: 'from-teal-400 to-teal-500' },
      { name: 'PET', color: 'from-red-500 to-red-600' },
      { name: 'FCE', color: 'from-green-500 to-green-600' },
      { name: 'CAE', color: 'from-blue-700 to-blue-800' },
      { name: 'CPE', color: 'from-purple-500 to-purple-600' }
    ]
  }
};

const CoursesSection = () => {
  return (
    <section id="courses" className="py-16 md:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            COURSE LEVELS
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Nossa jornada de aprendizado é estruturada em níveis progressivos para desenvolver
            todas as habilidades linguísticas de forma natural e eficiente
          </p>
        </div>
        
        {/* Talking Time */}
        <div className="mb-16">
          <div className="flex justify-center">
            <h3 className="inline-block text-2xl font-bold bg-primary text-white px-6 py-2 rounded-xl mb-6 transform -rotate-1 shadow-lg">
              {courseLevels.talkingTime.title}
            </h3>
          </div>
          <div className="flex justify-center">
            {courseLevels.talkingTime.levels.map((level, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-r ${level.color} text-white px-8 py-4 rounded-2xl shadow-lg 
                transform hover:scale-105 transition-transform duration-300 text-center min-w-64`}
              >
                <span className="text-xl font-bold">{level.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Listen Up */}
        <div className="mb-16">
          <div className="flex justify-center">
            <h3 className="inline-block text-2xl font-bold bg-blue-600 text-white px-6 py-2 rounded-xl mb-6 transform rotate-1 shadow-lg">
              {courseLevels.listenUp.title}
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {courseLevels.listenUp.levels.map((level, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-r ${level.color} text-white px-6 py-3 rounded-3xl shadow-lg 
                transform hover:scale-105 transition-transform duration-300 text-center min-w-48`}
              >
                <span className="text-lg font-bold">{level.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Let's Do It */}
        <div className="mb-16">
          <div className="flex justify-center">
            <h3 className="inline-block text-2xl font-bold bg-green-600 text-white px-6 py-2 rounded-xl mb-8 transform -rotate-1 shadow-lg">
              {courseLevels.letsDoIt.title}
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {courseLevels.letsDoIt.levels.map((level, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-r ${level.color} text-white w-24 h-24 md:w-28 md:h-28 rounded-full shadow-lg 
                flex items-center justify-center transform hover:scale-110 transition-transform duration-300`}
              >
                <span className="text-base md:text-lg font-bold">{level.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* I Can Do It */}
        <div className="mb-16">
          <div className="flex justify-center">
            <h3 className="inline-block text-2xl font-bold bg-purple-600 text-white px-6 py-2 rounded-xl mb-8 transform rotate-1 shadow-lg">
              {courseLevels.iCanDoIt.title}
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {courseLevels.iCanDoIt.levels.map((level, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-r ${level.color} text-primary px-6 py-4 rounded-lg shadow-lg 
                transform hover:scale-105 transition-transform duration-300 text-center min-w-40`}
              >
                <div className="font-bold text-lg">{level.name}</div>
                {level.subtext && <div className="text-sm opacity-90">{level.subtext}</div>}
              </div>
            ))}
          </div>
        </div>
        
        {/* Cambridge Preparation */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-red-600 relative mb-8">
          <div className="flex justify-center absolute -top-5 left-0 right-0">
            <span className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-xl shadow-lg font-bold text-xl">
              {courseLevels.cambridge.title}
            </span>
          </div>
          
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
            {courseLevels.cambridge.levels.map((level, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-r ${level.color} text-white p-3 rounded-lg shadow-md 
                transform hover:scale-105 transition-transform duration-300 text-center`}
              >
                <span className="font-bold text-xl">{level.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center items-center">
            <div className="mr-4">
              <img 
                src="/english-patio/assets/cambridge-compact.png" 
                alt="University of Cambridge" 
                className="h-14 object-contain"
              />
            </div>
            <div>
              <p className="text-gray-700 font-medium italic">Preparação oficial para os exames de Cambridge</p>
            </div>
          </div>
        </div>
        
        {/* Path illustration */}
        <div className="hidden md:block w-full h-24 relative my-10">
          <div className="absolute left-0 right-0 top-1/2 h-4 bg-gradient-to-r from-amber-400 via-blue-500 to-green-500 rounded-full transform -translate-y-1/2"></div>
          <div className="absolute left-0 top-0 w-8 h-8 bg-amber-400 rounded-full"></div>
          <div className="absolute left-1/4 top-0 w-8 h-8 bg-teal-400 rounded-full"></div>
          <div className="absolute left-2/4 top-0 w-8 h-8 bg-blue-500 rounded-full"></div>
          <div className="absolute left-3/4 top-0 w-8 h-8 bg-pink-400 rounded-full"></div>
          <div className="absolute right-0 top-0 w-8 h-8 bg-green-500 rounded-full"></div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Descubra o nível ideal para seu filho</h3>
          <p className="mb-6 max-w-2xl mx-auto">
            Agende uma avaliação de nível gratuita e conheça o programa de ensino perfeito 
            para o desenvolvimento do seu filho
          </p>
          <a
            href="#contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 
            font-medium rounded-xl shadow-md hover:bg-blue-50 transition-colors group"
          >
            Agendar Avaliação
            <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection; 