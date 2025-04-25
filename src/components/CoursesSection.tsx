import { ChevronRightIcon } from '@heroicons/react/24/outline';
import React from 'react';

// Tipos para os níveis
type BaseLevel = {
  name: string;
  color: string;
  subtext?: string;
};

type LevelGroup = {
  id: string;
  title: string;
  icon: string;
  description: string;
  levels: BaseLevel[];
};

// Componente de cartão reutilizável
const CourseCard: React.FC<{
  title: string;
  icon: string;
  description: string;
  isRed?: boolean;
  extraHeader?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, description, isRed = false, extraHeader, children }) => {
  return (
    <div className={`overflow-hidden rounded-lg ${isRed ? 'border border-red-300' : ''}`}>
      <div className={`p-6 pb-5 ${isRed ? 'bg-[#FFF2F2]' : 'bg-[#F3F3F3]'} rounded-t-lg ${extraHeader ? 'flex justify-between items-start' : ''}`}>
        {extraHeader ? (
          <>
            <div>
              <h3 className="text-xl font-bold text-primary">{title}</h3>
              <p className="text-sm text-gray-600 mt-1 mb-0">{description}</p>
            </div>
            {extraHeader}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">{icon}</span>
              <h3 className="text-xl font-bold text-primary">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-0">{description}</p>
          </>
        )}
      </div>
      
      <div className="p-5 bg-white rounded-b-lg">
        {children}
      </div>
    </div>
  );
};

// Botão de nível reutilizável
const LevelButton: React.FC<{ 
  color: string; 
  name: string; 
  subtext?: string;
  small?: boolean;
}> = ({ color, name, subtext, small = false }) => {
  return (
    <div 
      className={`${color} ${small ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded text-center text-sm`}
    >
      <span className="font-medium">{name}</span>
      {subtext && <span className="text-xs block">{subtext}</span>}
    </div>
  );
};

// Dados dos níveis
const levelGroups: LevelGroup[] = [
  {
    id: 'iniciantes',
    title: 'INICIANTES',
    icon: '🗣️',
    description: 'Primeiros passos no idioma',
    levels: [
      { name: 'Fun Conversation', color: 'bg-amber-400' }
    ]
  },
  {
    id: 'iniciantes-plus',
    title: 'INICIANTES+',
    icon: '👂',
    description: 'Desenvolvimento da compreensão auditiva',
    levels: [
      { name: 'Conversation 1', color: 'bg-teal-400' },
      { name: 'Conversation 2', color: 'bg-rose-400' },
      { name: 'Conversation 3', color: 'bg-amber-400' }
    ]
  },
  {
    id: 'intermediario',
    title: 'INTERMEDIÁRIO',
    icon: '💪',
    description: 'Desenvolvimento de habilidades práticas',
    levels: [
      { name: 'POWER 1', color: 'bg-amber-400' },
      { name: 'POWER 2', color: 'bg-green-700 text-white' },
      { name: 'POWER 3', color: 'bg-sky-400' },
      { name: 'POWER 4', color: 'bg-pink-500 text-white' },
      { name: 'POWER 5', color: 'bg-blue-600 text-white' },
      { name: 'POWER 6', color: 'bg-orange-500 text-white' }
    ]
  },
  {
    id: 'avancado',
    title: 'AVANÇADO',
    icon: '🏃',
    description: 'Desenvolvimento de fluência',
    levels: [
      { name: 'SPRINT 1', color: 'bg-amber-400' },
      { name: 'SPRINT 2', color: 'bg-blue-300' },
      { name: 'SPRINT 3', color: 'bg-pink-300' },
      { name: 'SPRINT 4', color: 'bg-green-300' }
    ]
  }
];

type CambridgeExam = BaseLevel;

const cambridgeExams: CambridgeExam[] = [
  { name: 'KET', color: 'bg-teal-400' },
  { name: 'PET', color: 'bg-red-600 text-white' },
  { name: 'FCE', color: 'bg-green-600 text-white' },
  { name: 'CAE', color: 'bg-blue-800 text-white' },
  { name: 'CPE', color: 'bg-purple-600 text-white' }
];

const CoursesSection = () => {
  return (
    <section id="courses" className="py-16 md:py-24 bg-gradient-to-b from-[#F0F6FF] to-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary">
            Nossos Níveis
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Programa estruturado em níveis progressivos para o desenvolvimento contínuo do aluno
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Iniciantes */}
          <CourseCard 
            title={levelGroups[0].title}
            icon={levelGroups[0].icon}
            description={levelGroups[0].description}
          >
            <div className="flex gap-2">
              {levelGroups[0].levels.map((level, idx) => (
                <LevelButton
                  key={idx}
                  color={level.color}
                  name={level.name}
                  subtext={level.subtext}
                />
              ))}
            </div>
          </CourseCard>

          {/* Iniciantes+ */}
          <CourseCard 
            title={levelGroups[1].title}
            icon={levelGroups[1].icon}
            description={levelGroups[1].description}
          >
            <div className="flex flex-wrap gap-2">
              {levelGroups[1].levels.map((level, idx) => (
                <LevelButton
                  key={idx}
                  color={level.color}
                  name={level.name}
                  subtext={level.subtext}
                />
              ))}
            </div>
          </CourseCard>

          {/* Intermediário */}
          <CourseCard 
            title={levelGroups[2].title}
            icon={levelGroups[2].icon}
            description={levelGroups[2].description}
          >
            <div className="flex flex-wrap gap-2">
              {levelGroups[2].levels.map((level, idx) => (
                <LevelButton
                  key={idx}
                  color={level.color}
                  name={level.name}
                  subtext={level.subtext}
                  small={true}
                />
              ))}
            </div>
          </CourseCard>

          {/* Avançado */}
          <CourseCard 
            title={levelGroups[3].title}
            icon={levelGroups[3].icon}
            description={levelGroups[3].description}
          >
            <div className="flex flex-wrap gap-2">
              {levelGroups[3].levels.map((level, idx) => (
                <LevelButton
                  key={idx}
                  color={level.color}
                  name={level.name}
                  subtext={level.subtext}
                />
              ))}
            </div>
          </CourseCard>
        </div>

        {/* Cambridge Preparation */}
        <CourseCard 
          title="CAMBRIDGE PREPARATION"
          icon=""
          description="Prepare-se para certificações internacionalmente reconhecidas"
          isRed={true}
          extraHeader={
            <img 
              src="/english-patio/assets/cambridge-compact.png" 
              alt="Cambridge Assessment" 
              className="h-12 object-contain" 
            />
          }
        >
          <div className="flex flex-wrap gap-2">
            {cambridgeExams.map((exam, idx) => (
              <LevelButton
                key={idx}
                color={exam.color}
                name={exam.name}
                subtext={exam.subtext}
              />
            ))}
          </div>
        </CourseCard>

        <div className="text-center mt-12">
          <a 
            href="#contact" 
            className="inline-flex items-center text-primary hover:text-secondary transition-colors"
          >
            Agende uma avaliação de nível
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection; 