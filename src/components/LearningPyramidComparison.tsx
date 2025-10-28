
const LearningPyramidComparison = () => {
  const levelsBase = [
    {
      id: 'lecture',
      name: 'Aula',
      retention: 5,
      icon: '👨‍🏫',
      description: 'Apenas ouvir o professor explicando o conteúdo.',
      isActive: false
    },
    {
      id: 'reading',
      name: 'Leitura de materiais',
      retention: 10,
      icon: '📚',
      description: 'Ler materiais didáticos ou textos sobre o assunto.',
      isActive: false
    },
    {
      id: 'audioVisual',
      name: 'Assistir vídeos e apresentações',
      retention: 20,
      icon: '🎬',
      description: 'Assistir vídeos ou apresentações sobre o tema.',
      isActive: false
    },
    {
      id: 'demonstration',
      name: 'Observar demonstrações práticas',
      retention: 30,
      icon: '👀',
      description: 'Observar alguém realizando a atividade na prática.',
      isActive: false
    },
    {
      id: 'discussion',
      name: 'Participar de discussões em grupo',
      retention: 50,
      icon: '💬',
      description: 'Participar de debates e discussões sobre o tema.',
      isActive: false
    },
    {
      id: 'practice',
      name: 'Praticar e fazer exercícios sobre o conteúdo',
      retention: 75,
      icon: '✍️',
      description: 'Realizar exercícios práticos sobre o conteúdo.',
      isActive: false
    },
    {
      id: 'teaching',
      name: 'Ensinar o conteúdo para outra pessoa',
      retention: 90,
      icon: '👩‍🏫',
      description: 'Explicar o conteúdo para outra pessoa, fixando seu próprio conhecimento.',
      isActive: true
    }
  ];

  // Função para obter cor baseada no gradiente vermelho->verde
  const getGradientColor = (index: number) => {
    const colors = [
      'bg-red-400',      // 5%
      'bg-orange-400',   // 10%
      'bg-yellow-400',   // 20%
      'bg-yellow-500',   // 30%
      'bg-lime-400',     // 50%
      'bg-green-400',    // 75%
      'bg-green-600',    // 90%
    ];
    return colors[index] || 'bg-gray-400';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-16 py-8">
      <h2 className="text-3xl font-bold text-center text-primary mb-8">
        Escolha a melhor visualização da pirâmide:
      </h2>

      {/* OPÇÃO 1: Gradiente + Labels Laterais com Emojis */}
      <div className="border-4 border-blue-500 rounded-2xl p-8 bg-blue-50/30">
        <h3 className="text-2xl font-bold text-center mb-2 text-blue-600">
          OPÇÃO 1: Gradiente de Cores + Labels com Emojis
        </h3>
        <p className="text-center text-gray-600 mb-8">Vermelho (menos eficaz) → Verde (mais eficaz) + textos nas laterais</p>

        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center">
            {/* Labels laterais */}
            <div className="flex flex-col justify-between h-[400px] mr-4 text-sm font-semibold">
              <div className="text-red-600 flex items-center gap-2">
                <span className="text-2xl">😕</span>
                <span className="hidden md:block">Menos<br/>eficaz</span>
                <span className="md:hidden">😕</span>
              </div>
              <div className="text-yellow-600 flex items-center gap-2">
                <span className="text-2xl">😐</span>
                <span className="hidden md:block">Médio</span>
              </div>
              <div className="text-green-600 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="hidden md:block">Mais<br/>eficaz</span>
                <span className="md:hidden">🎯</span>
              </div>
            </div>

            {/* Pirâmide */}
            <div className="flex-1 flex flex-col items-center">
              {levelsBase.map((level, index) => {
                const width = 30 + (index * (70 / (levelsBase.length - 1)));
                return (
                  <div
                    key={level.id}
                    className={`${getGradientColor(index)} ring-1 ring-white/30
                               mb-1 py-3 px-4 rounded-sm
                               flex items-center justify-center text-white font-bold text-center`}
                    style={{ width: `${width}%` }}
                  >
                    <span className="mr-2 text-lg">{level.icon}</span>
                    <span className="flex-1 text-sm md:text-base">{level.name}</span>
                    <span className="ml-2 bg-white text-gray-800 px-2 py-1 rounded-full text-xs md:text-sm font-bold">
                      {level.retention}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* OPÇÃO 2: Gradiente + Barra Lateral de Efetividade */}
      <div className="border-4 border-purple-500 rounded-2xl p-8 bg-purple-50/30">
        <h3 className="text-2xl font-bold text-center mb-2 text-purple-600">
          OPÇÃO 2: Gradiente + Barra de Efetividade
        </h3>
        <p className="text-center text-gray-600 mb-8">Barra lateral colorida mostrando nível de efetividade</p>

        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Barra lateral de efetividade */}
            <div className="w-16 h-[400px] rounded-full overflow-hidden relative bg-gradient-to-b from-red-400 via-yellow-400 to-green-600 flex flex-col justify-between p-2">
              <span className="text-xs font-bold text-white text-center drop-shadow-lg">Fraco</span>
              <span className="text-xs font-bold text-white text-center drop-shadow-lg">Médio</span>
              <span className="text-xs font-bold text-white text-center drop-shadow-lg">Forte</span>
              <span className="text-xs font-bold text-white text-center drop-shadow-lg">Excelente!</span>
            </div>

            {/* Pirâmide */}
            <div className="flex-1 flex flex-col items-center">
              {levelsBase.map((level, index) => {
                const width = 30 + (index * (70 / (levelsBase.length - 1)));
                return (
                  <div
                    key={level.id}
                    className={`${getGradientColor(index)} ring-1 ring-white/30
                               mb-1 py-3 px-4 rounded-sm
                               flex items-center justify-center text-white font-bold text-center`}
                    style={{ width: `${width}%` }}
                  >
                    <span className="mr-2 text-lg">{level.icon}</span>
                    <span className="flex-1 text-sm md:text-base">{level.name}</span>
                    <span className="ml-2 bg-white text-gray-800 px-2 py-1 rounded-full text-xs md:text-sm font-bold">
                      {level.retention}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* OPÇÃO 3: Gradiente + Seta Grande */}
      <div className="border-4 border-green-500 rounded-2xl p-8 bg-green-50/30">
        <h3 className="text-2xl font-bold text-center mb-2 text-green-600">
          OPÇÃO 3: Gradiente + Seta de Efetividade
        </h3>
        <p className="text-center text-gray-600 mb-8">Seta grande apontando para baixo indicando aumento de efetividade</p>

        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center gap-6">
            {/* Pirâmide */}
            <div className="flex-1 flex flex-col items-center">
              {levelsBase.map((level, index) => {
                const width = 30 + (index * (70 / (levelsBase.length - 1)));
                return (
                  <div
                    key={level.id}
                    className={`${getGradientColor(index)} ring-1 ring-white/30
                               mb-1 py-3 px-4 rounded-sm
                               flex items-center justify-center text-white font-bold text-center`}
                    style={{ width: `${width}%` }}
                  >
                    <span className="mr-2 text-lg">{level.icon}</span>
                    <span className="flex-1 text-sm md:text-base">{level.name}</span>
                    <span className="ml-2 bg-white text-gray-800 px-2 py-1 rounded-full text-xs md:text-sm font-bold">
                      {level.retention}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Seta lateral */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-[350px] bg-gradient-to-b from-red-400 via-yellow-400 to-green-600 rounded-full relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-xs transform -rotate-90 whitespace-nowrap">
                    EFETIVIDADE
                  </span>
                </div>
              </div>
              <div className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[40px] border-t-green-600"></div>
              <span className="text-green-600 font-bold text-sm mt-2 text-center">AUMENTA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="text-center p-6 bg-gray-100 rounded-xl">
        <p className="text-lg font-semibold text-gray-700">
          👆 Escolha qual opção você prefere e me avise!
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Depois vou implementar a escolhida no componente final
        </p>
      </div>
    </div>
  );
};

export default LearningPyramidComparison;
