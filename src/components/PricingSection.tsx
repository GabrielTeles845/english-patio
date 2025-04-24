const plans = [
  {
    id: 'hexeto',
    title: 'Hexeto',
    description: 'Até 6 alunos por turma',
    price: 'R$ 420,00',
    color: 'bg-primary'
  },
  {
    id: 'trio',
    title: 'Trio',
    description: '3 alunos por turma',
    price: 'R$ 480,00',
    color: 'bg-yellow-400'
  },
  {
    id: 'dupla',
    title: 'Dupla',
    description: '2 alunos por turma',
    price: 'R$ 525,00',
    color: 'bg-primary'
  },
  {
    id: 'individual',
    title: 'Individual',
    description: 'Aulas particulares',
    price: 'R$ 640,00',
    color: 'bg-yellow-400'
  },
  {
    id: 'em-casa',
    title: 'Em casa',
    description: 'Professor vai até sua casa',
    price: 'R$ 460,00',
    color: 'bg-primary'
  },
  {
    id: 'escola',
    title: 'Na Escola',
    description: 'Em nossa sede',
    price: 'R$ 460,00',
    color: 'bg-secondary'
  }
];

const PricingSection = () => {
  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-b from-white to-blue-50" id="pricing">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Mensalidades <span className="text-secondary">2025</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Escolha o plano que melhor se adapta às necessidades do seu filho
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
            >
              {/* Cabeçalho com título */}
              <div className={`${plan.color} px-4 py-3`}>
                <h3 className="text-xl font-bold text-white text-center">{plan.title}</h3>
              </div>

              {/* Preço e descrição */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="text-2xl font-bold text-primary mb-2 text-center">
                  {plan.price}
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">por aluno/mês</p>
                <p className="text-sm text-gray-700 text-center mb-auto">{plan.description}</p>
                
                <a
                  href="#contact"
                  className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-light transition-colors duration-300"
                >
                  Saiba mais
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center mt-8">
          <span className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
            *Valores referentes ao ano de <span className="font-semibold">2025</span>
          </span>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 