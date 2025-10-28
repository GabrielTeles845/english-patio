import { XMarkIcon } from '@heroicons/react/24/outline';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContractModal = ({ isOpen, onClose }: ContractModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary to-primary/90 text-white px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold">Termos do Contrato</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 pb-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            <div className="prose prose-sm max-w-none">
              {/* Cabeçalho */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-primary mb-2">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
                <p className="text-gray-700">
                  <strong>English Patio LTDA</strong>, inscrito no CNPJ 28.022.726/0001-44<br />
                  Av. F Qd.D1 Lt.12 nr. 1541, Água Branca, Goiânia-GO, CEP 74.723-100
                </p>
              </div>

              {/* Fundamento Legal */}
              <div className="bg-blue-50 border-l-4 border-primary p-4 mb-6">
                <p className="text-sm text-gray-800 leading-relaxed">
                  <strong>Fundamento Legal:</strong> O presente contrato reger-se-á pelas regras vertidas no Código de Defesa do Consumidor
                  (Lei 8.078/1990), visto que trata-se de fornecedor de serviço e consumidor final de serviço, na forma do artigo 2º e 3º da Lei 8.078/1990.
                  Aplica-se, subsidiariamente, as previsões do Código Civil (CC), especificamente art. 104 (requisitos do negócio jurídico),
                  art. 112 (teoria objetiva da declaração da vontade), art. 113 (princípio da boa-fé objetiva), art. 247 (obrigações de fazer e responsabilidade civil),
                  e art. 593 (prestação de serviços).
                </p>
              </div>

              {/* DO OBJETO DO CONTRATO */}
              <section className="mb-6">
                <h3 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">
                  DO OBJETO DO CONTRATO
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  <strong>CLÁUSULA 1ª.</strong> O presente contrato tem como OBJETO a prestação, pela CONTRATADA,
                  ao CONTRATANTE, dos serviços de ensino do idioma Inglês, na forma estabelecida pela plataforma
                  oferecida quando da contratação.
                </p>
              </section>

              {/* DAS AULAS */}
              <section className="mb-6">
                <h3 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">
                  DAS AULAS
                </h3>

                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>CLÁUSULA 2ª.</strong> As aulas serão ministradas 2 (duas) vezes por semana, em blocos
                    realizados às segundas e quartas-feiras, e às terças e quintas-feiras, entre 08h e 19h, no local
                    previamente identificado no contrato (presencial na sede da contratada), ressalvando os feriados
                    e recessos previamente anunciados pela escola, informados ao contratante por qualquer meio idôneo
                    de comunicação (telefone, e-mail ou mensagem por aplicativo WhatsApp).
                  </p>

                  <p className="text-gray-700 leading-relaxed">
                    <strong>CLÁUSULA 3ª.</strong> A hora-aula tem a duração de 60 minutos, na unidade física da escola,
                    e os dias e horários são definidos na recepção da escola, quando da celebração do contrato.
                  </p>

                  <p className="text-gray-700 leading-relaxed">
                    <strong>CLÁUSULA 4ª.</strong> O CONTRATANTE não poderá remarcar aulas previamente acordadas
                    quando da celebração do contrato, nos dias e horários estabelecidos no ato da matrícula, e o atraso
                    gera preclusão do conteúdo ministrado, sem prejuízo do acesso aos materiais impressos da aula.
                  </p>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                    <p className="text-sm text-gray-800">
                      <strong>Parágrafo Primeiro:</strong> Em caso de adiamento feito pela contratada, do serviço nos
                      dias e horários designados, o contratante será informado, por qualquer meio idôneo de comunicação,
                      em tempo hábil, sendo o serviço reagendado para data posterior, de acordo com a grade de horários
                      da escola, sendo direito do contratante a reposição do serviço adiado.
                    </p>
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    <strong>CLÁUSULA 5ª.</strong> As aulas de imersão, denominadas <strong>Vacation Classes</strong>,
                    consubstanciam-se em aulas temáticas, em parques, shopping, dentre outros análogos, a fim de permitir
                    que os alunos pratiquem a língua inglesa em situações reais, viabilizando a fixação dos conteúdos
                    ministrados em aulas e desenvolvendo a plena capacidade de articulação do pensamento e fala da língua inglesa.
                  </p>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                    <p className="text-sm text-gray-800">
                      <strong>Parágrafo Primeiro:</strong> As Vacation Classes realizar-se-ão durante o ano, em dias e
                      horários previamente agendados pelo contratado, de acordo com a disponibilidade da grade de horários,
                      no total de 8 (oito) aulas de 02 (duas) horas cada, sendo os dias e horários informados ao contratante
                      com antecedência, em tempo hábil, por qualquer meio idôneo de comunicação.
                    </p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
                    <p className="text-sm text-gray-800 font-semibold">
                      <strong>Parágrafo Segundo:</strong> As mensalidades correspondentes aos meses de Janeiro e Julho
                      destinam-se ao custeio das Vacation Classes e Preparatório Cambridge, atividades que integram o
                      planejamento pedagógico anual da contratada. Tais atividades são regularmente ministradas,
                      garantindo-se a continuidade do processo educativo, sem qualquer prejuízo à carga horária fixa
                      ou aos objetivos pedagógicos estabelecidos.
                    </p>
                    <p className="text-sm text-gray-800 mt-2">
                      Fica expressamente estabelecido que as referidas mensalidades são parte integrante do valor total
                      ajustado neste contrato. Assim, <strong>não haverá desconto, compensação, abatimento ou restituição</strong> dos
                      valores correspondentes às mensalidades de Janeiro e Julho, ainda que o(a) Contratante opte por não
                      participar, total ou parcialmente, das referidas atividades.
                    </p>
                  </div>
                </div>
              </section>

              {/* DA RESILIÇÃO UNILATERAL */}
              <section className="mb-6">
                <h3 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">
                  DA RESILIÇÃO UNILATERAL DO CONTRATO
                </h3>

                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>CLÁUSULA 6ª.</strong> O CONTRATANTE possui direito potestativo de requerer a resilição unilateral
                    do contrato antes do término de sua vigência, exigindo-se, para tanto, o adimplemento dos meses já transcorridos
                    e do mês no qual requereu a extinção dos serviços contratados, bem como o <strong className="text-red-600">pagamento
                    de multa rescisória, no quantum correspondente a 01 (uma) mensalidade</strong>.
                  </p>

                  <div className="bg-red-50 border-l-4 border-red-500 p-3">
                    <p className="text-sm text-gray-800">
                      <strong>Parágrafo Primeiro:</strong> Em caso de requerimento de resilição unilateral do contrato, pelo contratante,
                      a não comprovação dos termos da cláusula 6ª parágrafo segundo impede a resilição do contrato, o qual deverá ser
                      integralmente cumprido nos termos firmados.
                    </p>
                  </div>
                </div>
              </section>

              {/* DO ADIMPLEMENTO E MULTA */}
              <section className="mb-6">
                <h3 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">
                  DA FORMA DO ADIMPLEMENTO PELO CONTRATANTE, DOS JUROS E MULTA PELA MORA
                </h3>

                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>CLÁUSULA 7ª.</strong> A mensalidade tem o valor de <strong>R$ 560,00 (por aluno)</strong>.
                    O adimplemento das mensalidades, por parte do contratante, será realizado, exclusivamente, por meio
                    de boleto bancário emitido pela contratada, os quais serão entregues quando da assinatura do contrato.
                  </p>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
                    <p className="text-sm text-gray-800">
                      <strong>CLÁUSULA 8ª.</strong> O pagamento após a data indicada como vencimento gerará:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 text-sm text-gray-800">
                      <li>Multa de <strong>2% (dois por cento)</strong> no valor da mensalidade</li>
                      <li>Juros moratórios de <strong>1,00% ao mês</strong>, com espeque nos artigos 406 do Código Civil c/c art. 161 do Código Tributário Nacional</li>
                      <li>Sem prejuízo da cobrança judicial do débito</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* DA VIGÊNCIA */}
              <section className="mb-6">
                <h3 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">
                  DA VIGÊNCIA DO CONTRATO
                </h3>

                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>CLÁUSULA 9ª.</strong> O presente contrato terá vigência de <strong>12 (doze) meses</strong>,
                    iniciando em Janeiro e finalizando em Dezembro de 2026.
                  </p>

                  <div className="bg-green-50 border-l-4 border-green-500 p-3">
                    <p className="text-sm text-gray-800">
                      <strong>Parágrafo Primeiro:</strong> Um carnê físico será entregue ao responsável no ato da matrícula com 12 parcelas.
                    </p>
                  </div>
                </div>
              </section>

              {/* CONDIÇÕES GERAIS */}
              <section className="mb-6">
                <h3 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">
                  CONDIÇÕES GERAIS
                </h3>

                <p className="text-gray-700 leading-relaxed">
                  <strong>CLÁUSULA 10ª.</strong> Não está incluso neste contrato o fornecimento de material didático e de apoio.
                </p>
              </section>

              {/* USO DE IMAGEM */}
              <section className="mb-6">
                <h3 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">
                  USO DE IMAGEM
                </h3>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-3">
                  <p className="text-sm text-gray-800">
                    <strong>CLÁUSULA 11ª.</strong> Pelo presente instrumento particular e na melhor forma de direito,
                    o CONTRATANTE poderá <strong>autorizar</strong> ou <strong>não autorizar</strong> a CONTRATADA
                    a utilizar e veicular as fotografias e vídeos realizados com o registro da imagem do aluno
                    nas redes sociais da escola.
                  </p>
                </div>
              </section>

              {/* DO FORO */}
              <section className="mb-6">
                <h3 className="text-lg font-bold text-primary mb-3 border-b-2 border-primary/30 pb-2">
                  DO FORO
                </h3>

                <p className="text-gray-700 leading-relaxed">
                  <strong>CLÁUSULA 12ª.</strong> As partes elegem o foro da comarca de <strong>Goiânia-GO</strong> para
                  dirimir divergências judiciais.
                </p>
              </section>

              {/* Informação sobre processo de assinatura */}
              <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900">
                  <strong>📄 Processo de Assinatura:</strong>
                  <br />
                  Após a matrícula, você receberá o contrato preenchido por e-mail. A equipe da English Patio entrará em contato
                  e enviará um link para assinatura digital, garantindo a validade jurídica do documento conforme a legislação brasileira.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractModal;
