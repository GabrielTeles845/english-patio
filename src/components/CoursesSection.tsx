import { ChevronRightIcon } from '@heroicons/react/24/outline';

// Dados dos níveis
const levelGroups = [
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
      { name: 'SPRINT 1', subtext: 'A - B', color: 'bg-amber-300' },
      { name: 'SPRINT 2', subtext: 'A - B', color: 'bg-blue-300' },
      { name: 'SPRINT 3', subtext: 'A - B', color: 'bg-pink-300' },
      { name: 'SPRINT 4', subtext: 'A - B', color: 'bg-green-300' }
    ]
  }
];

const cambridgeExams = [
  { name: 'KET', color: 'bg-teal-400' },
  { name: 'PET', color: 'bg-red-600 text-white' },
  { name: 'FCE', color: 'bg-green-600 text-white' },
  { name: 'CAE', color: 'bg-blue-800 text-white' },
  { name: 'CPE', color: 'bg-purple-600 text-white' }
];

const CoursesSection = () => {
  return (
    <section id="courses" className="py-16 md:py-24 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary">
            Nossos Níveis
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Programa estruturado em níveis progressivos para o desenvolvimento contínuo do aluno
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Iniciantes */}
          <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{levelGroups[0].icon}</span>
                <h3 className="text-xl font-bold text-primary">{levelGroups[0].title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{levelGroups[0].description}</p>
              
              <div className="flex gap-3">
                {levelGroups[0].levels.map((level, idx) => (
                  <div 
                    key={idx} 
                    className={`${level.color} px-4 py-2 rounded-full text-center`}
                  >
                    <span className="font-medium">{level.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Iniciantes+ */}
          <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{levelGroups[1].icon}</span>
                <h3 className="text-xl font-bold text-primary">{levelGroups[1].title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{levelGroups[1].description}</p>
              
              <div className="flex flex-wrap gap-3">
                {levelGroups[1].levels.map((level, idx) => (
                  <div 
                    key={idx} 
                    className={`${level.color} px-4 py-2 rounded-full text-center`}
                  >
                    <span className="font-medium">{level.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Intermediário */}
          <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{levelGroups[2].icon}</span>
                <h3 className="text-xl font-bold text-primary">{levelGroups[2].title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{levelGroups[2].description}</p>
              
              <div className="flex flex-wrap gap-3">
                {levelGroups[2].levels.map((level, idx) => (
                  <div 
                    key={idx} 
                    className={`${level.color} px-4 py-2 rounded-full text-center`}
                  >
                    <span className="font-medium">{level.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Avançado */}
          <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{levelGroups[3].icon}</span>
                <h3 className="text-xl font-bold text-primary">{levelGroups[3].title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{levelGroups[3].description}</p>
              
              <div className="flex flex-wrap gap-3">
                {levelGroups[3].levels.map((level, idx) => (
                  <div 
                    key={idx} 
                    className={`${level.color} px-4 py-2 rounded-lg text-center`}
                  >
                    <span className="font-medium">{level.name}</span>
                    {level.subtext && (
                      <span className="text-xs block">{level.subtext}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cambridge Preparation */}
        <div className="bg-red-50 rounded-lg border border-red-200 p-6 mb-8 relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-primary">CAMBRIDGE PREPARATION</h3>
              <p className="text-sm text-gray-600 mt-1">Prepare-se para certificações internacionalmente reconhecidas</p>
            </div>
            <img 
              src="/english-patio/assets/cambridge-compact.png" 
              alt="Cambridge Assessment" 
              className="h-10 object-contain" 
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            {cambridgeExams.map((exam, idx) => (
              <div 
                key={idx} 
                className={`${exam.color} px-4 py-2 rounded-lg text-center`}
              >
                <span className="font-medium">{exam.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
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