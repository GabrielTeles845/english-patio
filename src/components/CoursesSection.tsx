import { ChevronRightIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { c } from '../content/site';

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
    <div className={`overflow-hidden rounded-lg ${isRed ? 'border-2 border-red-400' : 'border-2 border-primary'}`}>
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
              {icon && <span className="text-3xl">{icon}</span>}
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
    title: c('home', 'cursos-grupo-1-titulo'),
    icon: '',
    description: c('home', 'cursos-grupo-1-descricao'),
    levels: [
      { name: 'Fun Conversation 1', color: 'bg-green-500 text-white' },
      { name: 'Fun Conversation 2', color: 'bg-green-500 text-white' }
    ]
  },
  {
    id: 'iniciantes-plus',
    title: c('home', 'cursos-grupo-2-titulo'),
    icon: '',
    description: c('home', 'cursos-grupo-2-descricao'),
    levels: [
      { name: 'Conversation 1', color: 'bg-green-700 text-white' },
      { name: 'Conversation 2', color: 'bg-orange-500 text-white' },
      { name: 'Conversation 3', color: 'bg-purple-500 text-white' }
    ]
  },
  {
    id: 'intermediario',
    title: c('home', 'cursos-grupo-3-titulo'),
    icon: '',
    description: c('home', 'cursos-grupo-3-descricao'),
    levels: [
      { name: 'POWER 1', color: 'bg-orange-500 text-white' },
      { name: 'POWER 2', color: 'bg-green-500 text-white' },
      { name: 'POWER 3', color: 'bg-yellow-400' },
      { name: 'POWER 4', color: 'bg-red-500 text-white' },
      { name: 'POWER 5', color: 'bg-purple-500 text-white' },
      { name: 'POWER 6', color: 'bg-cyan-400' }
    ]
  },
  {
    id: 'avancado',
    title: c('home', 'cursos-grupo-4-titulo'),
    icon: '',
    description: c('home', 'cursos-grupo-4-descricao'),
    levels: [
      { name: 'SPRINT 1', color: 'bg-orange-500 text-white' },
      { name: 'SPRINT 2', color: 'bg-green-500 text-white' },
      { name: 'SPRINT 3', color: 'bg-purple-500 text-white' },
      { name: 'SPRINT 4', color: 'bg-blue-500 text-white' }
    ]
  }
];

type CambridgeExam = BaseLevel;

const cambridgeExams: CambridgeExam[] = [
  { name: 'KET', color: 'bg-teal-400' },
  { name: 'PET', color: 'bg-red-600 text-white' },
  { name: 'FCE', color: 'bg-green-600 text-white' }
];

const CoursesSection = () => {
  return (
    <section id="courses" className="relative py-16 md:py-20 bg-gradient-to-b from-white to-blue-50 overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-20 w-72 h-72 bg-yellow-200 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-blue-200 rounded-full opacity-15 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            {c('home', 'cursos-titulo')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {c('home', 'cursos-paragrafo')}
          </p>
        </div>

        <div className="flex flex-col gap-6 mb-6 max-w-4xl mx-auto">
          {levelGroups.map((group) => (
            <CourseCard
              key={group.id}
              title={group.title}
              icon={group.icon}
              description={group.description}
            >
              <div className="flex flex-wrap gap-2">
                {group.levels.map((level, idx) => (
                  <LevelButton
                    key={idx}
                    color={level.color}
                    name={level.name}
                    subtext={level.subtext}
                  />
                ))}
              </div>
            </CourseCard>
          ))}
        </div>

        {/* Cambridge Preparation */}
        <div className="max-w-4xl mx-auto">
          <CourseCard
            title={c('home', 'cursos-cambridge-titulo')}
            icon=""
            description={c('home', 'cursos-cambridge-descricao')}
            isRed={true}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {cambridgeExams.map((exam, idx) => (
                <LevelButton
                  key={idx}
                  color={exam.color}
                  name={exam.name}
                  subtext={exam.subtext}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center italic">
              {c('home', 'cursos-cambridge-rodape')}
            </p>
          </CourseCard>
        </div>

        <div className="text-center mt-12">
          <a
            href="#contact"
            className="inline-flex items-center px-6 py-3 bg-secondary hover:bg-secondary/90 text-primary font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            {c('home', 'cursos-cta')}
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection; 