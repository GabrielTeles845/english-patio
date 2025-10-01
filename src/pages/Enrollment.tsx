import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface FormData {
  // Aluno 1
  student1Name: string;
  student1BirthDate: string;
  student1Age: string;

  // Aluno 2 (opcional)
  hasStudent2: boolean;
  student2Name: string;
  student2BirthDate: string;
  student2Age: string;

  // Mãe
  motherName: string;
  motherBirthDate: string;
  motherPhone: string;

  // Pai
  fatherName: string;
  fatherBirthDate: string;
  fatherPhone: string;

  // Responsável Financeiro
  responsibleName: string;
  responsibleCPF: string;
  responsibleEmail: string;
  address: string;
  cep: string;
  paymentMethod: string;

  // Autorizações
  authorizationMedia: boolean;
  authorizationContract: boolean;
}

const Enrollment = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    student1Name: '',
    student1BirthDate: '',
    student1Age: '',
    hasStudent2: false,
    student2Name: '',
    student2BirthDate: '',
    student2Age: '',
    motherName: '',
    motherBirthDate: '',
    motherPhone: '',
    fatherName: '',
    fatherBirthDate: '',
    fatherPhone: '',
    responsibleName: '',
    responsibleCPF: '',
    responsibleEmail: '',
    address: '',
    cep: '',
    paymentMethod: '',
    authorizationMedia: false,
    authorizationContract: false,
  });

  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));

      // Calcular idade automaticamente
      if (name === 'student1BirthDate') {
        setFormData(prev => ({ ...prev, student1Age: calculateAge(value) }));
      }
      if (name === 'student2BirthDate') {
        setFormData(prev => ({ ...prev, student2Age: calculateAge(value) }));
      }
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulário enviado:', formData);
    // TODO: Implementar EmailJS + jsPDF
    alert('Sistema de envio em desenvolvimento. Os dados foram registrados no console.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-primary">Matrícula</span>{' '}
            <span className="text-secondary">Online</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700">
            Preencha o formulário e faça parte da English Patio!
          </p>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Dados dos Alunos' },
              { num: 2, title: 'Dados dos Pais' },
              { num: 3, title: 'Pagamento' },
              { num: 4, title: 'Revisão' },
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      currentStep >= step.num
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center hidden sm:block">{step.title}</span>
                </div>
                {index < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      currentStep > step.num ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Content */}
      <section className="py-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Dados dos Alunos */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-primary mb-8">Dados dos Alunos</h2>

                {/* Aluno 1 */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-primary mb-4 flex items-center">
                    <UserIcon className="h-6 w-6 mr-2" />
                    Aluno 1
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        name="student1Name"
                        value={formData.student1Name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="Nome completo do aluno"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        name="student1BirthDate"
                        value={formData.student1BirthDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idade
                      </label>
                      <input
                        type="text"
                        name="student1Age"
                        value={formData.student1Age}
                        readOnly
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                        placeholder="Automático"
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox Aluno 2 */}
                <div className="mb-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasStudent2"
                      checked={formData.hasStudent2}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="ml-3 text-gray-700 font-medium">
                      Adicionar segundo aluno (irmão/irmã)
                    </span>
                  </label>
                </div>

                {/* Aluno 2 (condicional) */}
                {formData.hasStudent2 && (
                  <div className="mb-8 p-6 bg-blue-50/50 rounded-xl">
                    <h3 className="text-xl font-semibold text-primary mb-4 flex items-center">
                      <UserIcon className="h-6 w-6 mr-2" />
                      Aluno 2
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          name="student2Name"
                          value={formData.student2Name}
                          onChange={handleInputChange}
                          required={formData.hasStudent2}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          placeholder="Nome completo do segundo aluno"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Nascimento *
                        </label>
                        <input
                          type="date"
                          name="student2BirthDate"
                          value={formData.student2BirthDate}
                          onChange={handleInputChange}
                          required={formData.hasStudent2}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Idade
                        </label>
                        <input
                          type="text"
                          name="student2Age"
                          value={formData.student2Age}
                          readOnly
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                          placeholder="Automático"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-8">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Dados dos Pais */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-primary mb-8">Dados dos Pais</h2>

                {/* Mãe */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-primary mb-4">Mãe</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        name="motherBirthDate"
                        value={formData.motherBirthDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        name="motherPhone"
                        value={formData.motherPhone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="(62) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                {/* Pai */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-primary mb-4">Pai</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        name="fatherBirthDate"
                        value={formData.fatherBirthDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        name="fatherPhone"
                        value={formData.fatherPhone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="(62) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Dados de Pagamento */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-primary mb-8">Dados de Pagamento</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Responsável Financeiro *
                    </label>
                    <input
                      type="text"
                      name="responsibleName"
                      value={formData.responsibleName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF *
                      </label>
                      <input
                        type="text"
                        name="responsibleCPF"
                        value={formData.responsibleCPF}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        name="responsibleEmail"
                        value={formData.responsibleEmail}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço Completo *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Rua, número, complemento, bairro, cidade - UF"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CEP *
                      </label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="00000-000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Forma de Pagamento *
                      </label>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      >
                        <option value="">Selecione...</option>
                        <option value="pix">Pix</option>
                        <option value="boleto">Boleto Bancário</option>
                        <option value="cartao">Cartão de Crédito</option>
                        <option value="debito">Débito Automático</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Revisão e Autorizações */}
            {currentStep === 4 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-primary mb-8">Revisão e Confirmação</h2>

                {/* Resumo dos Dados */}
                <div className="mb-8 space-y-6">
                  {/* Alunos */}
                  <div className="p-6 bg-blue-50/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Alunos</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Aluno 1:</p>
                        <p className="font-medium">{formData.student1Name || '-'}</p>
                        <p className="text-sm text-gray-600">
                          {formData.student1BirthDate && `${formData.student1BirthDate} (${formData.student1Age} anos)`}
                        </p>
                      </div>
                      {formData.hasStudent2 && (
                        <div>
                          <p className="text-sm text-gray-600">Aluno 2:</p>
                          <p className="font-medium">{formData.student2Name || '-'}</p>
                          <p className="text-sm text-gray-600">
                            {formData.student2BirthDate && `${formData.student2BirthDate} (${formData.student2Age} anos)`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pais */}
                  <div className="p-6 bg-blue-50/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Dados dos Pais</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Mãe:</p>
                        <p className="font-medium">{formData.motherName || '-'}</p>
                        <p className="text-sm text-gray-600">{formData.motherPhone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pai:</p>
                        <p className="font-medium">{formData.fatherName || '-'}</p>
                        <p className="text-sm text-gray-600">{formData.fatherPhone || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pagamento */}
                  <div className="p-6 bg-blue-50/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Dados de Pagamento</h3>
                    <div className="space-y-2">
                      <p><span className="text-gray-600">Responsável:</span> <span className="font-medium">{formData.responsibleName || '-'}</span></p>
                      <p><span className="text-gray-600">CPF:</span> <span className="font-medium">{formData.responsibleCPF || '-'}</span></p>
                      <p><span className="text-gray-600">E-mail:</span> <span className="font-medium">{formData.responsibleEmail || '-'}</span></p>
                      <p><span className="text-gray-600">Endereço:</span> <span className="font-medium">{formData.address || '-'}</span></p>
                      <p><span className="text-gray-600">CEP:</span> <span className="font-medium">{formData.cep || '-'}</span></p>
                      <p><span className="text-gray-600">Forma de Pagamento:</span> <span className="font-medium">{formData.paymentMethod || '-'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Autorizações */}
                <div className="mb-8 p-6 border-2 border-primary/20 rounded-xl bg-primary/5">
                  <h3 className="text-lg font-semibold text-primary mb-4">Autorizações Necessárias</h3>

                  <div className="space-y-4">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        name="authorizationMedia"
                        checked={formData.authorizationMedia}
                        onChange={handleInputChange}
                        required
                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary mt-1 flex-shrink-0"
                      />
                      <span className="ml-3 text-gray-700">
                        Eu autorizo a escola a publicar e veicular vídeos ou fotos do aluno nas redes sociais da mesma, enquanto durar este contrato. *
                      </span>
                    </label>

                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        name="authorizationContract"
                        checked={formData.authorizationContract}
                        onChange={handleInputChange}
                        required
                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary mt-1 flex-shrink-0"
                      />
                      <span className="ml-3 text-gray-700">
                        Declaro que li e aceito os termos do contrato da English Patio. *
                      </span>
                    </label>
                  </div>
                </div>

                {/* TODO: Área de Assinatura Digital */}
                <div className="mb-8 p-6 border-2 border-dashed border-primary/30 rounded-xl">
                  <h3 className="text-lg font-semibold text-primary mb-4">Assinatura Digital</h3>
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      📝 TODO: Canvas para assinatura digital
                    </p>
                    <p className="text-sm text-gray-500">
                      Implementação com canvas HTML5 ou biblioteca signature_pad
                    </p>
                  </div>
                </div>

                {/* Aviso sobre envio */}
                <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Sistema em desenvolvimento:</strong> O envio automático por email e geração de PDF estão em implementação.
                    Por enquanto, os dados serão exibidos no console do navegador.
                  </p>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg flex items-center"
                  >
                    <CheckCircleIcon className="h-6 w-6 mr-2" />
                    Finalizar Matrícula
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Enrollment;
