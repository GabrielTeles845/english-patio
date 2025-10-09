import { useState, useEffect, useRef } from 'react';
import InputMask from 'react-input-mask';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContractModal from '../components/ContractModal';
import {
  UserIcon,
  CheckCircleIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { fillContractPDF } from '../services/pdfService';
import { sendContractEmails } from '../services/emailService';

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

  // Responsável Legal Principal
  responsibleName: string;
  responsibleBirthDate: string;
  responsibleCPF: string;
  responsiblePhone: string;
  responsibleRelationship: string; // Grau de parentesco
  responsibleEmail: string;

  // Segundo Responsável (opcional - apenas contato)
  hasSecondResponsible: boolean;
  secondResponsibleName: string;
  secondResponsiblePhone: string;
  secondResponsibleRelationship: string;

  // Responsável Financeiro (pode ser diferente)
  financialResponsibleType: 'same' | 'other'; // Mesmo responsável ou outro
  financialResponsibleName: string; // Usado se 'other'

  // Endereço
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  paymentMethod: string;

  // Campos do Contrato
  classFormat: 'sede' | 'domicilio';
  schedule: 'seg-qua' | 'ter-qui';
  scheduleDay1Start: string;
  scheduleDay1End: string;
  scheduleDay2Start: string;
  scheduleDay2End: string;

  // Autorizações
  authorizationMedia: boolean;
  authorizationContract: boolean;
  scheduleConfirmed: boolean;
}

const Enrollment = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isStepsHidden, setIsStepsHidden] = useState(false);
  const userClosedSteps = useRef(false);
  const [formData, setFormData] = useState<FormData>({
    student1Name: '',
    student1BirthDate: '',
    student1Age: '',
    hasStudent2: false,
    student2Name: '',
    student2BirthDate: '',
    student2Age: '',
    responsibleName: '',
    responsibleBirthDate: '',
    responsibleCPF: '',
    responsiblePhone: '',
    responsibleRelationship: '',
    responsibleEmail: '',
    hasSecondResponsible: false,
    secondResponsibleName: '',
    secondResponsiblePhone: '',
    secondResponsibleRelationship: '',
    financialResponsibleType: 'same',
    financialResponsibleName: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    paymentMethod: 'boleto',
    classFormat: 'sede',
    schedule: 'seg-qua',
    scheduleDay1Start: '',
    scheduleDay1End: '',
    scheduleDay2Start: '',
    scheduleDay2End: '',
    authorizationMedia: false,
    authorizationContract: false,
    scheduleConfirmed: false,
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

  // Função para validar se o CEP permite aulas em domicílio
  const canHaveHomeClasses = (cep: string): boolean => {
    // Remove formatação (hífens, espaços)
    const numericCep = cep.replace(/\D/g, '');
    if (numericCep.length !== 8) return false;

    const cepNumber = parseInt(numericCep, 10);

    // Setor Bueno: 74210-000 até 74230-999
    const isBueno = cepNumber >= 74210000 && cepNumber <= 74230999;

    // Setor Marista: 74115-000 até 74215-999
    const isMarista = cepNumber >= 74115000 && cepNumber <= 74215999;

    return isBueno || isMarista;
  };

  // Função para buscar endereço via ViaCEP
  const fetchAddressFromCep = async (cep: string) => {
    const numericCep = cep.replace(/\D/g, '');
    if (numericCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado. Por favor, verifique e tente novamente.');
        return;
      }

      // Atualiza os campos de endereço automaticamente
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }));

      // Se o CEP não permite aulas em domicílio, reseta para 'sede'
      if (!canHaveHomeClasses(cep) && formData.classFormat === 'domicilio') {
        setFormData(prev => ({
          ...prev,
          classFormat: 'sede',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP. Por favor, tente novamente.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));

      // Calcular idade automaticamente
      if (name === 'student1BirthDate') {
        setFormData(prev => ({ ...prev, student1Age: calculateAge(value) }));
      }
      if (name === 'student2BirthDate') {
        setFormData(prev => ({ ...prev, student2Age: calculateAge(value) }));
      }

      // Buscar endereço automaticamente quando CEP completo
      if (name === 'cep') {
        const numericCep = value.replace(/\D/g, '');
        if (numericCep.length === 8) {
          fetchAddressFromCep(value);
        }
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Detectar scroll para compactar os steps
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 200;
      setIsScrolled(scrolled);

      // Se scrollou para o topo, resetar tudo e mostrar steps expandidos
      if (!scrolled) {
        userClosedSteps.current = false;
        setIsStepsHidden(false);
      }
      // Se scrollou para baixo e usuário fechou manualmente, manter fechado
      else if (scrolled && userClosedSteps.current) {
        setIsStepsHidden(true);
      }
      // Se scrollou para baixo e usuário NÃO fechou manualmente, mostrar compacto
      else if (scrolled && !userClosedSteps.current) {
        setIsStepsHidden(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Montar endereço completo
      const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}, ${formData.neighborhood}, ${formData.city}/${formData.state}`;

      // Preparar dados do contrato
      const contractData = {
        contractorName: formData.responsibleName,
        contractorAddress: fullAddress,
        contractorCEP: formData.cep,
        contractorCPF: formData.responsibleCPF,
        contractorPhone: formData.responsiblePhone,
        classFormat: formData.classFormat,
        schedule: formData.schedule,
        scheduleDay1Start: formData.scheduleDay1Start,
        scheduleDay1End: formData.scheduleDay1End,
        scheduleDay2Start: formData.scheduleDay2Start,
        scheduleDay2End: formData.scheduleDay2End,
        imageAuthorization: formData.authorizationMedia,
        signatureDate: new Date().toLocaleDateString('pt-BR'),
      };

      // Preencher PDF
      console.log('Preenchendo PDF...');
      const pdfBytes = await fillContractPDF(contractData);
      console.log('PDF preenchido com sucesso!');

      // Enviar emails
      console.log('Enviando emails...');
      await sendContractEmails(
        pdfBytes,
        {
          studentName: formData.student1Name,
          contractorName: formData.responsibleName,
          contractorEmail: formData.responsibleEmail,
          contractorPhone: formData.responsiblePhone,
          pdfBase64: '', // será preenchido internamente no serviço
        },
        {
          serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
          templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
        }
      );

      alert('✅ Matrícula realizada com sucesso! Você receberá o contrato por email em breve.');
      console.log('Formulário enviado:', formData);
    } catch (error) {
      console.error('Erro ao processar matrícula:', error);
      alert('❌ Erro ao processar matrícula. Por favor, tente novamente ou entre em contato conosco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-4 md:pt-40 md:pb-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            <span className="text-primary">Matrícula</span>{' '}
            <span className="text-secondary">Online</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700">
            Preencha o formulário e faça parte da English Patio!
          </p>
        </div>
      </section>

      {/* Progress Steps */}
      {!isStepsHidden && (
        <section className={`sticky top-[106px] z-40 transition-all duration-300 ${
          isScrolled
            ? 'pt-2 pb-1 md:pt-3 md:pb-2 shadow-md bg-white'
            : 'pt-4 pb-2 md:pt-6 md:pb-3 bg-gradient-to-br from-slate-50 via-blue-50/30 to-white'
        }`}>
          <div className="max-w-5xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 relative">
            <div className="relative">
            {/* Background Line - Desktop and Mobile */}
            <div className={`absolute left-0 right-0 h-1 bg-gray-200 transition-all duration-300 ${
              isScrolled ? 'top-4 sm:top-5 md:top-6' : 'top-5 sm:top-6 md:top-8'
            }`} style={{ zIndex: 0 }}></div>
            <div
              className={`absolute left-0 h-1 bg-primary transition-all duration-300 ${
                isScrolled ? 'top-4 sm:top-5 md:top-6' : 'top-5 sm:top-6 md:top-8'
              }`}
              style={{
                width: `${((currentStep - 1) / 3) * 100}%`,
                zIndex: 1
              }}
            ></div>

            {/* Steps */}
            <div className="relative flex justify-between gap-1" style={{ zIndex: 2 }}>
              {[
                { num: 1, title: 'Dados do Aluno', icon: '🎒' },
                { num: 2, title: 'Responsável Legal', icon: '👨‍👩‍👦' },
                { num: 3, title: 'Pagamento', icon: '💳' },
                { num: 4, title: 'Confirmação', icon: '📋' },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center relative flex-1">
                  <div
                    className={`rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 ${
                      isScrolled
                        ? 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12'
                        : 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14'
                    } ${
                      currentStep >= step.num
                        ? 'bg-primary text-white border-primary shadow-lg scale-110'
                        : currentStep === step.num - 1
                        ? 'bg-white text-primary border-primary/30 shadow-md'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircleIcon className={`text-white drop-shadow-md transition-all duration-300 ${
                        isScrolled
                          ? 'h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5'
                          : 'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6'
                      }`} />
                    ) : (
                      <span
                        className={`transition-all duration-300 ${
                          isScrolled
                            ? 'text-sm sm:text-base md:text-lg'
                            : 'text-base sm:text-lg md:text-xl'
                        } ${currentStep >= step.num ? 'drop-shadow-md' : ''}`}
                        style={currentStep >= step.num ? {
                          filter: 'brightness(1.5) contrast(1.2)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        } : {}}
                      >
                        {step.icon}
                      </span>
                    )}
                  </div>
                  <div className={`text-center max-w-[70px] sm:max-w-[90px] md:max-w-[110px] transition-all duration-300 ${
                    isScrolled ? 'mt-1' : 'mt-1.5 md:mt-2'
                  }`}>
                    {!isScrolled && (
                      <p className={`font-semibold transition-all duration-300 text-[10px] sm:text-xs ${
                        currentStep >= step.num ? 'text-primary' : 'text-gray-500'
                      }`}>
                        Etapa {step.num}
                      </p>
                    )}
                    <p className={`leading-tight transition-all duration-300 ${
                      isScrolled
                        ? 'text-[10px] sm:text-xs mt-0'
                        : 'text-xs sm:text-sm mt-0.5'
                    } ${currentStep >= step.num ? 'text-gray-700' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Etiqueta para ocultar/mostrar steps */}
      {isScrolled && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-30 pointer-events-none transition-all duration-300"
          style={{
            top: isStepsHidden
              ? '106px'
              : window.innerWidth >= 768
                ? 'calc(106px + 5.5rem)'
                : 'calc(106px + 4.5rem)'
          }}
        >
          <button
            onClick={() => {
              const newHiddenState = !isStepsHidden;
              setIsStepsHidden(newHiddenState);
              // Marcar que o usuário fechou manualmente
              if (newHiddenState) {
                userClosedSteps.current = true;
              } else {
                userClosedSteps.current = false;
              }
            }}
            className="p-1.5 bg-white rounded-b-lg shadow-md hover:shadow-lg transition-all duration-300 group pointer-events-auto"
            title={isStepsHidden ? "Mostrar indicador de etapas" : "Ocultar indicador de etapas"}
            aria-label={isStepsHidden ? "Mostrar indicador de etapas" : "Ocultar indicador de etapas"}
          >
            {isStepsHidden ? (
              <ChevronUpIcon className="h-3.5 w-3.5 text-primary group-hover:text-secondary transition-colors rotate-180" />
            ) : (
              <ChevronUpIcon className="h-3.5 w-3.5 text-primary group-hover:text-secondary transition-colors" />
            )}
          </button>
        </div>
      )}

      {/* Form Content */}
      <section className="py-8 md:py-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Dados do Aluno */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 md:mb-8">Dados do Aluno</h2>

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
                        placeholder="Nome completo"
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
                      Adicionar segundo(a) aluno(a)
                    </span>
                  </label>
                </div>

                {/* Aluno 2 (condicional) */}
                {formData.hasStudent2 && (
                  <div className="mb-8 p-6 bg-blue-50/50 rounded-xl animate-slide-down">
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
                          placeholder="Nome completo"
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

                <div className="flex justify-end mt-6 md:mt-8">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Dados do Responsável Legal */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 md:mb-8">Dados do Responsável Legal</h2>

                {/* Responsável Principal */}
                <div className="mb-8">
                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-primary flex items-center">
                      <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
                      Responsável Legal
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 ml-7 sm:ml-8">quem assinará o contrato</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        name="responsibleName"
                        value={formData.responsibleName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="Nome completo do responsável"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        name="responsibleBirthDate"
                        value={formData.responsibleBirthDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF *
                      </label>
                      <InputMask
                        mask="999.999.999-99"
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
                        Telefone/WhatsApp *
                      </label>
                      <InputMask
                        mask="(99) 99999-9999"
                        type="tel"
                        name="responsiblePhone"
                        value={formData.responsiblePhone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="(62) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grau de Parentesco *
                      </label>
                      <select
                        name="responsibleRelationship"
                        value={formData.responsibleRelationship}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      >
                        <option value="">Selecione...</option>
                        <option value="mae">Mãe</option>
                        <option value="pai">Pai</option>
                        <option value="avo">Avó</option>
                        <option value="avoo">Avô</option>
                        <option value="tia">Tia</option>
                        <option value="tio">Tio</option>
                        <option value="tutor">Tutor Legal</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Checkbox Segundo Responsável */}
                <div className="mb-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasSecondResponsible"
                      checked={formData.hasSecondResponsible}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="ml-3 text-gray-700 font-medium">
                      Adicionar segundo responsável (opcional - para contato adicional)
                    </span>
                  </label>
                </div>

                {/* Segundo Responsável (opcional) */}
                {formData.hasSecondResponsible && (
                  <div className="mb-8 p-6 bg-blue-50/50 rounded-xl animate-slide-down">
                    <h3 className="text-xl font-semibold text-primary mb-4 flex items-center">
                      <UserIcon className="h-6 w-6 mr-2" />
                      Segundo Responsável (Contato Adicional)
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          name="secondResponsibleName"
                          value={formData.secondResponsibleName}
                          onChange={handleInputChange}
                          required={formData.hasSecondResponsible}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone/WhatsApp *
                        </label>
                        <InputMask
                          mask="(99) 99999-9999"
                          type="tel"
                          name="secondResponsiblePhone"
                          value={formData.secondResponsiblePhone}
                          onChange={handleInputChange}
                          required={formData.hasSecondResponsible}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          placeholder="(62) 99999-9999"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grau de Parentesco *
                        </label>
                        <select
                          name="secondResponsibleRelationship"
                          value={formData.secondResponsibleRelationship}
                          onChange={handleInputChange}
                          required={formData.hasSecondResponsible}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        >
                          <option value="">Selecione...</option>
                          <option value="mae">Mãe</option>
                          <option value="pai">Pai</option>
                          <option value="avo">Avó</option>
                          <option value="avoo">Avô</option>
                          <option value="tia">Tia</option>
                          <option value="tio">Tio</option>
                          <option value="tutor">Tutor Legal</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 md:mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors order-2 sm:order-1"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg order-1 sm:order-2"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Dados de Pagamento */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 md:mb-8">Dados de Pagamento</h2>

                <div className="space-y-6">
                  {/* Responsável Financeiro */}
                  <div className="p-6 bg-blue-50/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Responsável Financeiro</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Quem será o responsável financeiro? *
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center cursor-pointer p-3 border-2 rounded-lg hover:bg-white transition-colors">
                            <input
                              type="radio"
                              name="financialResponsibleType"
                              value="same"
                              checked={formData.financialResponsibleType === 'same'}
                              onChange={handleInputChange}
                              className="w-5 h-5 text-primary"
                            />
                            <span className="ml-3 font-medium">{formData.responsibleName || 'O responsável legal cadastrado'}</span>
                          </label>
                          <label className="flex items-center cursor-pointer p-3 border-2 rounded-lg hover:bg-white transition-colors">
                            <input
                              type="radio"
                              name="financialResponsibleType"
                              value="other"
                              checked={formData.financialResponsibleType === 'other'}
                              onChange={handleInputChange}
                              className="w-5 h-5 text-primary"
                            />
                            <span className="ml-3 font-medium">Outra pessoa</span>
                          </label>
                        </div>
                      </div>

                      {formData.financialResponsibleType === 'other' && (
                        <div className="animate-slide-down">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Responsável Financeiro *
                          </label>
                          <input
                            type="text"
                            name="financialResponsibleName"
                            value={formData.financialResponsibleName}
                            onChange={handleInputChange}
                            required={formData.financialResponsibleType === 'other'}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="Nome completo"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail para Contato *
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

                  {/* Endereço com Auto-preenchimento */}
                  <div className="p-6 bg-green-50/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Endereço</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CEP *
                          </label>
                          <InputMask
                            mask="99999-999"
                            type="text"
                            name="cep"
                            value={formData.cep}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="00000-000"
                          />
                          <p className="text-xs text-gray-500 mt-1">Os campos abaixo serão preenchidos automaticamente</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rua/Avenida *
                          </label>
                          <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-gray-50"
                            placeholder="Auto-preenchido"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número
                          </label>
                          <input
                            type="text"
                            name="number"
                            value={formData.number}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="123 ou S/N"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Complemento
                          </label>
                          <input
                            type="text"
                            name="complement"
                            value={formData.complement}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="Apto, Bloco, etc (opcional)"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bairro *
                          </label>
                          <input
                            type="text"
                            name="neighborhood"
                            value={formData.neighborhood}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-gray-50"
                            placeholder="Auto-preenchido"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cidade *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-gray-50"
                            placeholder="Auto-preenchido"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado *
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            maxLength={2}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-gray-50"
                            placeholder="UF"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Forma de Pagamento (fixo) */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <p className="text-lg font-semibold text-primary">Boleto Bancário</p>
                    <p className="text-sm text-gray-600 mt-1">Um carnê físico/online será entregue a cada família</p>
                  </div>

                  {/* Confirmação de Horário */}
                  <div className="mt-6">
                    <label className="flex items-start cursor-pointer p-4 border-2 border-primary/30 rounded-lg hover:bg-blue-50/30 transition-colors">
                      <input
                        type="checkbox"
                        name="scheduleConfirmed"
                        checked={formData.scheduleConfirmed}
                        onChange={handleInputChange}
                        required
                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary mt-1 flex-shrink-0"
                      />
                      <span className="ml-3 text-gray-700 font-medium">
                        Já confirmei o horário das aulas do(a) meu(minha) filho(a) *
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 md:mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors order-2 sm:order-1"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg order-1 sm:order-2"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Revisão e Autorizações */}
            {currentStep === 4 && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 md:mb-8">Revisão e Confirmação</h2>

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

                  {/* Responsável Legal */}
                  <div className="p-6 bg-blue-50/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Responsável Legal</h3>
                    <div className="space-y-2">
                      <p><span className="text-gray-600">Nome:</span> <span className="font-medium">{formData.responsibleName || '-'}</span></p>
                      <p><span className="text-gray-600">Parentesco:</span> <span className="font-medium">{formData.responsibleRelationship ? formData.responsibleRelationship.charAt(0).toUpperCase() + formData.responsibleRelationship.slice(1) : '-'}</span></p>
                      <p><span className="text-gray-600">CPF:</span> <span className="font-medium">{formData.responsibleCPF || '-'}</span></p>
                      <p><span className="text-gray-600">Telefone:</span> <span className="font-medium">{formData.responsiblePhone || '-'}</span></p>
                      <p><span className="text-gray-600">E-mail:</span> <span className="font-medium">{formData.responsibleEmail || '-'}</span></p>
                    </div>
                    {formData.hasSecondResponsible && (
                      <div className="mt-4 pt-4 border-t border-primary/20">
                        <p className="text-sm text-gray-600 mb-2">Segundo Responsável (Contato):</p>
                        <p><span className="text-gray-600">Nome:</span> <span className="font-medium">{formData.secondResponsibleName || '-'}</span></p>
                        <p><span className="text-gray-600">Telefone:</span> <span className="font-medium">{formData.secondResponsiblePhone || '-'}</span></p>
                      </div>
                    )}
                  </div>

                  {/* Endereço e Pagamento */}
                  <div className="p-6 bg-blue-50/50 rounded-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Endereço e Pagamento</h3>
                    <div className="space-y-2">
                      <p><span className="text-gray-600">Endereço:</span> <span className="font-medium">{formData.street ? `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}` : '-'}</span></p>
                      <p><span className="text-gray-600">Bairro:</span> <span className="font-medium">{formData.neighborhood || '-'}</span></p>
                      <p><span className="text-gray-600">Cidade/UF:</span> <span className="font-medium">{formData.city && formData.state ? `${formData.city}/${formData.state}` : '-'}</span></p>
                      <p><span className="text-gray-600">CEP:</span> <span className="font-medium">{formData.cep || '-'}</span></p>
                      <p className="pt-2"><span className="text-gray-600">Responsável Financeiro:</span> <span className="font-medium">{formData.financialResponsibleType === 'same' ? formData.responsibleName : formData.financialResponsibleName}</span></p>
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
                        Autorizo o uso de imagem do(a) aluno(a) em fotos e vídeos produzidos pela escola, caso ele(a) apareça ao fundo ou em atividades gerais, para divulgação nas redes sociais da English Patio, enquanto durar este contrato. *
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
                        Declaro que li e aceito os{' '}
                        <button
                          type="button"
                          onClick={() => setIsContractModalOpen(true)}
                          className="text-primary font-semibold underline hover:text-primary/80 transition-colors"
                        >
                          termos do contrato
                        </button>
                        {' '}da English Patio, e que as informações fornecidas são verdadeiras. *
                      </span>
                    </label>
                  </div>
                </div>

                {/* Informação sobre Contrato Eletrônico */}
                <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    <strong>📄 Sobre o Contrato Eletrônico:</strong>
                    <br />
                    Ao finalizar a matrícula, você receberá o contrato preenchido por e-mail. Este contrato tem validade jurídica conforme a Lei 13.709/2018 (LGPD) e o Marco Civil da Internet (Lei 12.965/2014). A aceitação dos termos por meio eletrônico é legalmente válida e vinculante.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 md:mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors order-2 sm:order-1"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-6 w-6 mr-2" />
                        Finalizar Matrícula
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      <Footer />

      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
      />
    </div>
  );
};

export default Enrollment;
