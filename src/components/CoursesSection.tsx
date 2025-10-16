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
    title: 'FUN CONVERSATION',
    icon: '',
    description: 'Primeiros contatos com o inglês, em uma abordagem totalmente lúdica, com jogos, músicas e atividades interativas. Para crianças de 4 e 5 anos de idade.',
    levels: [
      { name: 'Fun Conversation', color: 'bg-green-500 text-white' }
    ]
  },
  {
    id: 'iniciantes-plus',
    title: 'CONVERSATION SERIES',
    icon: '',
    description: 'Desenvolvimento da escuta e da fala, com introdução gradual à leitura em inglês. Ideal para alunos que estão começando a formar frases e reconhecer palavras no idioma.',
    levels: [
      { name: 'Conversation 1', color: 'bg-green-700 text-white' },
      { name: 'Conversation 2', color: 'bg-gray-500 text-white' },
      { name: 'Conversation 3', color: 'bg-green-500 text-white' }
    ]
  },
  {
    id: 'intermediario',
    title: 'POWER TRACK',
    icon: '',
    description: 'Módulos que desenvolvem as quatro habilidades essenciais — listening, speaking, reading e writing — com início das avaliações orais e escritas.',
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
    title: 'SPRINT FLUENCY',
    icon: '',
    description: 'Desafios práticos com foco em fluência, interpretação de texto, produção escrita e expressão espontânea. Aprofunda estruturas gramaticais e dá início à preparação para os exames Cambridge.',
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
    <section id="courses" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary">
            Nossos Níveis
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Programa estruturado em níveis progressivos para o desenvolvimento contínuo do aluno
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
            title="CAMBRIDGE PREPARATION"
            icon=""
            description="Prepare-se para certificações internacionalmente reconhecidas"
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
              Alunos dos níveis Sprint iniciam a preparação para exames Cambridge em encontros mensais, realizados como atividade complementar ao curso regular.
            </p>
          </CourseCard>
        </div>

        <div className="text-center mt-12">
          <a
            href="#contact"
            className="inline-flex items-center text-primary hover:text-secondary transition-colors"
          >
            Agende um teste de nível
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection; 