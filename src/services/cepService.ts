// Interface para padronizar a resposta de diferentes APIs de CEP
interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

// Interface para resultado da busca de CEP
export interface CepSearchResult {
  success: boolean;
  data?: AddressData;
  notFound?: boolean; // CEP não existe
  allApisFailed?: boolean; // Todas as APIs estão indisponíveis
}

// Função para buscar CEP no ViaCEP
async function fetchFromViaCEP(cep: string): Promise<{ data: AddressData | null; notFound: boolean }> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error('ViaCEP unavailable');

    const data = await response.json();
    if (data.erro) return { data: null, notFound: true }; // CEP não existe

    return {
      data: {
        cep: data.cep,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      },
      notFound: false
    };
  } catch (error) {
    console.warn('ViaCEP failed:', error);
    return { data: null, notFound: false }; // API falhou (não sabemos se o CEP existe)
  }
}

// Função para buscar CEP no BrasilAPI (v2)
async function fetchFromBrasilAPI(cep: string): Promise<{ data: AddressData | null; notFound: boolean }> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (!response.ok) {
      // BrasilAPI retorna 404 quando CEP não existe
      if (response.status === 404) {
        return { data: null, notFound: true };
      }
      throw new Error('BrasilAPI unavailable');
    }

    const data = await response.json();

    return {
      data: {
        cep: data.cep,
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
      },
      notFound: false
    };
  } catch (error) {
    console.warn('BrasilAPI failed:', error);
    return { data: null, notFound: false };
  }
}

// Função para buscar CEP no OpenCep
async function fetchFromOpenCep(cep: string): Promise<{ data: AddressData | null; notFound: boolean }> {
  try {
    const response = await fetch(`https://opencep.com/v1/${cep}`);
    if (!response.ok) {
      // OpenCep retorna 404 quando CEP não existe
      if (response.status === 404) {
        return { data: null, notFound: true };
      }
      throw new Error('OpenCep unavailable');
    }

    const data = await response.json();

    return {
      data: {
        cep: data.cep,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      },
      notFound: false
    };
  } catch (error) {
    console.warn('OpenCep failed:', error);
    return { data: null, notFound: false };
  }
}

// Função para buscar CEP no ApiCEP
async function fetchFromApiCEP(cep: string): Promise<{ data: AddressData | null; notFound: boolean }> {
  try {
    const response = await fetch(`https://cdn.apicep.com/file/apicep/${cep}.json`);
    if (!response.ok) {
      // ApiCEP retorna 404 quando CEP não existe
      if (response.status === 404) {
        return { data: null, notFound: true };
      }
      throw new Error('ApiCEP unavailable');
    }

    const data = await response.json();
    if (!data.ok) return { data: null, notFound: true }; // CEP não existe

    return {
      data: {
        cep: data.code,
        street: data.address || '',
        neighborhood: data.district || '',
        city: data.city || '',
        state: data.state || '',
      },
      notFound: false
    };
  } catch (error) {
    console.warn('ApiCEP failed:', error);
    return { data: null, notFound: false };
  }
}

// Função principal que tenta múltiplas APIs em paralelo
export async function fetchAddress(cep: string): Promise<CepSearchResult> {
  const cleanCEP = cep.replace(/\D/g, '');

  if (cleanCEP.length !== 8) {
    return { success: false, notFound: true };
  }

  console.log('🔍 Buscando CEP em todas as APIs em paralelo...');

  // Dispara todas as requisições em paralelo
  const results = await Promise.allSettled([
    fetchFromViaCEP(cleanCEP),
    fetchFromBrasilAPI(cleanCEP),
    fetchFromOpenCep(cleanCEP),
    fetchFromApiCEP(cleanCEP),
  ]);

  let cepNotFoundCount = 0;
  let apisFailed = 0;

  // Processa os resultados
  for (const result of results) {
    if (result.status === 'fulfilled') {
      // Se encontrou dados válidos, retorna imediatamente
      if (result.value.data) {
        console.log('✅ CEP encontrado!');
        return { success: true, data: result.value.data };
      }

      // Conta se CEP não foi encontrado ou se API falhou
      if (result.value.notFound) {
        cepNotFoundCount++;
      } else {
        apisFailed++;
      }
    } else {
      // Promise rejeitada = API falhou
      apisFailed++;
    }
  }

  // Analisa os resultados
  if (cepNotFoundCount >= 2) {
    // Pelo menos 2 APIs confirmaram que o CEP não existe
    console.error('❌ CEP não encontrado (confirmado por múltiplas APIs)');
    return { success: false, notFound: true };
  } else if (apisFailed === results.length) {
    // Todas as APIs falharam por indisponibilidade
    console.error('❌ Todas as APIs de CEP estão indisponíveis');
    return { success: false, allApisFailed: true };
  } else {
    // Situação mista - provavelmente o CEP não existe
    console.error('❌ CEP não encontrado em nenhuma API');
    return { success: false, notFound: true };
  }
}
