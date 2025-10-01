import { ChevronRightIcon } from '@heroicons/react/24/outline';

const levelGroups = [
  {
    id: 'talking-time',
    title: 'INICIANTES',
    icon: '🗣️',
    description: 'Primeiros passos no idioma',
    levels: [
      {
        id: 'fun-conversation',
        name: 'Fun Conversation',
        color: 'bg-yellow-400'
      }
    ]
  },
  {
    id: 'listen-up',
    title: 'INICIANTES+',
    icon: '👂',
    description: 'Desenvolvimento da compreensão auditiva',
    levels: [
      {
        id: 'conversation-1',
        name: 'Conversation 1',
        color: 'bg-teal-400'
      },
      {
        id: 'conversation-2',
        name: 'Conversation 2',
        color: 'bg-red-400'
      },
      {
        id: 'conversation-3',
        name: 'Conversation 3',
        color: 'bg-yellow-400'
      }
    ]
  },
  {
    id: 'lets-do-it',
    title: 'INTERMEDIÁRIO',
    icon: '💪',
    description: 'Desenvolvimento de habilidades práticas',
    levels: [
      {
        id: 'power-1',
        name: 'POWER 1',
        color: 'bg-yellow-400'
      },
      {
        id: 'power-2',
        name: 'POWER 2',
        color: 'bg-green-700'
      },
      {
        id: 'power-3',
        name: 'POWER 3',
        color: 'bg-blue-400'
      },
      {
        id: 'power-4',
        name: 'POWER 4',
        color: 'bg-red-400'
      },
      {
        id: 'power-5',
        name: 'POWER 5',
        color: 'bg-blue-600'
      },
      {
        id: 'power-6',
        name: 'POWER 6',
        color: 'bg-orange-500'
      }
    ]
  },
  {
    id: 'i-can-do-it',
    title: 'AVANÇADO',
    icon: '🏃',
    description: 'Desenvolvimento de fluência', 
    levels: [
      {
        id: 'sprint-1',
        name: 'SPRINT 1',
        color: 'bg-yellow-400'
      },
      {
        id: 'sprint-2',
        name: 'SPRINT 2',
        color: 'bg-indigo-200'
      },
      {
        id: 'sprint-3',
        name: 'SPRINT 3',
        color: 'bg-red-300'
      },
      {
        id: 'sprint-4',
        name: 'SPRINT 4',
        color: 'bg-green-300'
      }
    ]
  }
];

const LevelsSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-blue-50 to-white" id="levels">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Nossos Níveis
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Programa estruturado em níveis progressivos para o desenvolvimento contínuo do aluno
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {levelGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="bg-primary/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{group.icon}</span>
                  <h3 className="text-xl font-bold text-primary">{group.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">{group.description}</p>
              </div>
              
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {group.levels.map((level) => (
                    <div 
                      key={level.id}
                      className={`${level.color} px-3 py-1.5 rounded-lg transform transition-transform hover:scale-105`}
                    >
                      <span className="text-sm font-bold text-white">{level.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cambridge Preparation - Destacado */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-red-500">
          <div className="bg-red-50 p-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-primary">CAMBRIDGE PREPARATION</h3>
                <p className="text-sm text-gray-600 mt-1">Prepare-se para certificações internacionalmente reconhecidas</p>
              </div>
              {/* Logo Cambridge - Versão Mobile */}
              <div className="md:hidden">
                <img 
                  src="/assets/cambridge-compact.png" 
                  alt="Cambridge Young Learners" 
                  className="h-16 object-contain" 
                />
              </div>
              {/* Logo Cambridge - Versão Desktop */}
              <div className="hidden md:block">
                <img 
                  src="/assets/cambridge.png" 
                  alt="Cambridge Assessment" 
                  className="h-10 object-contain" 
                />
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <div className="bg-teal-300 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-bold text-white">KET</span>
              </div>
              <div className="bg-red-600 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-bold text-white">PET</span>
              </div>
              <div className="bg-green-600 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-bold text-white">FCE</span>
              </div>
              <div className="bg-blue-800 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-bold text-white">CAE</span>
              </div>
              <div className="bg-purple-500 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-bold text-white">CPE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="#contact" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary hover:text-secondary transition-colors">
            Agende uma avaliação de nível
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default LevelsSection; 