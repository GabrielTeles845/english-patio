import { useState } from 'react';

interface PyramidLevel {
  id: string;
  name: string;
  retention: number;
  color: string;
  icon: string;
  description: string;
  isActive: boolean;
}

const LearningPyramid = () => {
  // Definição dos níveis de aprendizado com suas informações
  const [levels, setLevels] = useState<PyramidLevel[]>([
    {
      id: 'lecture',
      name: 'Aula Expositiva',
      retention: 5,
      color: 'bg-blue-300',
      icon: '👨‍🏫',
      description: 'Apenas ouvir o professor explicando o conteúdo.',
      isActive: false
    },
    {
      id: 'reading',
      name: 'Leitura',
      retention: 10,
      color: 'bg-blue-400',
      icon: '📚',
      description: 'Ler materiais didáticos ou textos sobre o assunto.',
      isActive: false
    },
    {
      id: 'audioVisual',
      name: 'Audiovisual',
      retention: 20,
      color: 'bg-blue-500',
      icon: '🎬',
      description: 'Assistir vídeos ou apresentações sobre o tema.',
      isActive: false
    },
    {
      id: 'demonstration',
      name: 'Demonstração',
      retention: 30,
      color: 'bg-blue-600',
      icon: '👀',
      description: 'Observar alguém realizando a atividade na prática.',
      isActive: false
    },
    {
      id: 'discussion',
      name: 'Discussão em Grupo',
      retention: 50,
      color: 'bg-orange-300',
      icon: '💬',
      description: 'Participar de debates e discussões sobre o tema.',
      isActive: false
    },
    {
      id: 'practice',
      name: 'Prática',
      retention: 75,
      color: 'bg-orange-400',
      icon: '✍️',
      description: 'Realizar exercícios práticos sobre o conteúdo.',
      isActive: false
    },
    {
      id: 'teaching',
      name: 'Ensinar',
      retention: 90,
      color: 'bg-orange-500',
      icon: '👩‍🏫',
      description: 'Explicar o conteúdo para outra pessoa, fixando seu próprio conhecimento.',
      isActive: false
    }
  ]);

  // Estado para armazenar o nível selecionado
  const [selectedLevel, setSelectedLevel] = useState<PyramidLevel | null>(null);

  // Função para lidar com o clique em um nível
  const handleLevelClick = (level: PyramidLevel) => {
    setSelectedLevel(level);
    // Atualiza o estado de ativo apenas para o nível clicado
    setLevels(levels.map(l => ({
      ...l,
      isActive: l.id === level.id
    })));
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Título da pirâmide */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-primary">Pirâmide de Aprendizado</h3>
        <p className="text-gray-600">Taxa média de retenção após 24 horas</p>
      </div>

      {/* Divisão entre aprendizado passivo e ativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="text-center p-4 bg-blue-100 rounded-lg">
          <h4 className="font-semibold text-blue-800">Aprendizado Passivo</h4>
          <p className="text-sm text-blue-600">5% - 30% de retenção</p>
        </div>
        <div className="text-center p-4 bg-orange-100 rounded-lg">
          <h4 className="font-semibold text-orange-800">Aprendizado Ativo</h4>
          <p className="text-sm text-orange-600">50% - 90% de retenção</p>
        </div>
      </div>

      {/* A pirâmide em si */}
      <div className="relative">
        <div className="flex flex-col items-center">
          {levels.map((level, index) => {
            // Calculando a largura de cada nível (diminui conforme sobe na pirâmide)
            const width = 100 - (index * (100 / levels.length));
            
            return (
              <div
                key={level.id}
                onClick={() => handleLevelClick(level)}
                className={`${level.color} ${level.isActive ? 'ring-2 ring-yellow-400 shadow-lg' : ''} 
                           mb-1 py-3 rounded-sm cursor-pointer transition-all duration-300 hover:brightness-110
                           flex items-center justify-center text-white font-medium`}
                style={{ width: `${width}%` }}
              >
                <span className="mr-2">{level.icon}</span>
                <span>{level.name}</span>
                <span className="ml-3 bg-white text-gray-800 px-2 py-1 rounded-full text-sm font-bold">
                  {level.retention}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhes do nível selecionado */}
      {selectedLevel && (
        <div className="mt-8 p-5 border rounded-lg bg-gray-50 shadow-sm transition-all duration-300">
          <h4 className="font-bold text-lg text-primary flex items-center">
            <span className="mr-2">{selectedLevel.icon}</span> 
            {selectedLevel.name}
            <span className="ml-auto text-2xl font-bold">{selectedLevel.retention}%</span>
          </h4>
          <p className="mt-2 text-gray-700">{selectedLevel.description}</p>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${selectedLevel.color}`} 
                style={{ width: `${selectedLevel.retention}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem destacando o aprendizado ativo */}
      <div className="mt-8 text-center p-5 bg-primary-light/20 rounded-lg">
        <p className="text-primary font-medium">
          Na English Patio, priorizamos a aprendizagem ativa, com técnicas que promovem maior retenção e aplicabilidade real do conhecimento.
        </p>
      </div>
    </div>
  );
};

export default LearningPyramid; 