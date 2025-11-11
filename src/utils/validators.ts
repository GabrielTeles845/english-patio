// Validação de CPF
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

// Função auxiliar para converter DD/MM/YYYY para Date
function parseBrazilianDate(dateString: string): Date | null {
  const cleanDate = dateString.replace(/\D/g, '');
  if (cleanDate.length !== 8) return null;

  const day = parseInt(cleanDate.substring(0, 2), 10);
  const month = parseInt(cleanDate.substring(2, 4), 10) - 1; // JavaScript months are 0-indexed
  const year = parseInt(cleanDate.substring(4, 8), 10);

  const date = new Date(year, month, day);

  // Verifica se a data é válida (ex: 31/02/2024 é inválida)
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

// Validação de data de nascimento do aluno (não pode ser maior que 20 anos nem no futuro)
export function isValidStudentBirthDate(dateString: string): { valid: boolean; message?: string } {
  if (!dateString) return { valid: false, message: 'Data obrigatória' };

  const birthDate = parseBrazilianDate(dateString);
  const today = new Date();

  // Verifica se a data é válida
  if (!birthDate || isNaN(birthDate.getTime())) {
    return { valid: false, message: 'Data inválida' };
  }

  // Verifica se não é no futuro
  if (birthDate > today) {
    return { valid: false, message: 'Data não pode ser no futuro' };
  }

  // Calcula idade
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Verifica se tem mais de 20 anos
  if (age > 20) {
    return { valid: false, message: 'Aluno não pode ter mais de 20 anos' };
  }

  return { valid: true };
}

// Validação de data de nascimento do responsável (maior de 18 anos, não no futuro)
export function isValidResponsibleBirthDate(dateString: string): { valid: boolean; message?: string } {
  if (!dateString) return { valid: false, message: 'Data obrigatória' };

  const birthDate = parseBrazilianDate(dateString);
  const today = new Date();

  // Verifica se a data é válida
  if (!birthDate || isNaN(birthDate.getTime())) {
    return { valid: false, message: 'Data inválida' };
  }

  // Verifica se não é no futuro
  if (birthDate > today) {
    return { valid: false, message: 'Data não pode ser no futuro' };
  }

  // Calcula idade
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Verifica se tem menos de 18 anos
  if (age < 18) {
    return { valid: false, message: 'Responsável deve ter no mínimo 18 anos' };
  }

  return { valid: true };
}

// Validação de telefone (deve começar com 9)
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // Formato: (XX) 9XXXX-XXXX = 11 dígitos, sendo o terceiro dígito = 9
  return cleanPhone.length === 11 && cleanPhone.charAt(2) === '9';
}

// Validação de nome completo (deve ter pelo menos nome e sobrenome)
export function isValidFullName(name: string): boolean {
  const trimmedName = name.trim();
  const nameParts = trimmedName.split(/\s+/);

  // Deve ter pelo menos 2 partes (nome e sobrenome)
  if (nameParts.length < 2) return false;

  // Conectores comuns em nomes brasileiros que podem ter 1 caractere
  const connectors = ['e', 'de', 'da', 'do', 'dos', 'das'];

  // Filtra as partes significativas (não conectores)
  const significantParts = nameParts.filter(
    part => !connectors.includes(part.toLowerCase())
  );

  // Deve ter pelo menos 2 partes significativas
  if (significantParts.length < 2) return false;

  // Cada parte significativa deve ter pelo menos 2 caracteres
  return significantParts.every(part => part.length >= 2);
}

// Validação de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de CEP (formato brasileiro)
export function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}

// Mensagens de erro customizadas
export const ErrorMessages = {
  REQUIRED: 'Campo obrigatório',
  INVALID_CPF: 'CPF inválido',
  INVALID_PHONE: 'Telefone deve começar com 9: (XX) 9XXXX-XXXX',
  INVALID_FULL_NAME: 'Digite o nome completo (nome e sobrenome)',
  INVALID_EMAIL: 'E-mail inválido',
  INVALID_CEP: 'CEP inválido',
};
