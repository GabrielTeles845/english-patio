// Configuração do Cloudinary
const CLOUD_NAME = 'dfvihcel2';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

/**
 * Gera URL otimizada do Cloudinary com transformações
 * @param imagePath - Caminho da imagem (ex: 'DSC06842.jpg')
 * @param options - Opções de transformação
 */
export function getCloudinaryUrl(
  imagePath: string,
  options: {
    width?: number;
    quality?: number | 'auto';
    format?: 'auto' | 'jpg' | 'webp' | 'png';
  } = {}
): string {
  const { width = 1920, quality = 'auto:good', format = 'auto' } = options;

  // Transformações do Cloudinary
  const transformations: string[] = [];

  // Adiciona width (padrão 1920px - suficiente para web)
  transformations.push(`w_${width}`);

  // Adiciona quality (auto:good é mais leve que auto:best)
  transformations.push(`q_${quality}`);

  // Formato automático (WebP para navegadores compatíveis)
  transformations.push(`f_${format}`);

  // Progressive loading para JPEGs
  transformations.push('fl_progressive');

  const transformString = transformations.join(',');

  return `${BASE_URL}/${transformString}/${imagePath}`;
}

/**
 * Helper para gerar URL padrão (quality auto, format auto)
 */
export const img = (filename: string) => getCloudinaryUrl(filename);

export default img;
