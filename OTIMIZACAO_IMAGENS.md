# Guia de Otimização de Imagens com OptimizedImage

Este documento descreve como migrar imagens estáticas para o componente `OptimizedImage` que usa Cloudinary com lazy loading e placeholder blur.

## O que foi feito

### 1. Configuração do Cloudinary (`src/config/cloudinary.ts`)

Configurado para gerar URLs otimizadas com:
- **Width padrão**: 1920px (suficiente para web)
- **Quality**: `auto:good` (balanço entre qualidade e tamanho)
- **Formato**: `auto` (WebP quando suportado, JPEG caso contrário)
- **Progressive loading**: Carregamento progressivo para JPEGs

### 2. Componente OptimizedImage (`src/components/OptimizedImage.tsx`)

Componente criado com:
- **Lazy loading nativo**: `loading="lazy"`
- **Placeholder blur**: Thumbnail 10px com blur enquanto carrega
- **Fade-in suave**: Transição opacity quando a imagem carregar
- **Async decoding**: Não bloqueia a UI durante decode

## Como migrar uma imagem

### ❌ ANTES (img tag normal)

```tsx
<div className="relative rounded-2xl overflow-hidden shadow-xl">
  <img
    className="w-full h-64 lg:h-80 object-cover cursor-zoom-in"
    src={img('DSC06890.jpg')}
    alt="Descrição da imagem"
    onClick={() => {
      // onClick handler aqui
    }}
  />
</div>
```

### ✅ DEPOIS (OptimizedImage)

```tsx
import OptimizedImage from './OptimizedImage';

<div className="relative rounded-2xl overflow-hidden shadow-xl">
  <OptimizedImage
    src="DSC06890.jpg"
    alt="Descrição da imagem"
    className="cursor-zoom-in h-64 lg:h-80"
    onClick={() => {
      // onClick handler aqui
    }}
  />
</div>
```

## Passos para migração

### 1. Adicionar import no topo do arquivo

```tsx
import OptimizedImage from '../components/OptimizedImage';
// ou
import OptimizedImage from './OptimizedImage';
```

### 2. Substituir tag `<img>` por `<OptimizedImage>`

**Mudanças importantes:**

| Antes | Depois | Observação |
|-------|--------|------------|
| `src={img('foto.jpg')}` | `src="foto.jpg"` | Remove a função `img()`, passa só o nome |
| `className="w-full h-64 object-cover"` | `className="h-64"` | Remove `w-full` e `object-cover` (já inclusos no componente) |
| Altura no container `<div>` | Altura no `className` do `OptimizedImage` | Move `h-64 lg:h-80` para dentro do componente |

### 3. Exemplo completo de transformação

#### Arquivo: `src/components/HeroSection.tsx`

**ANTES:**
```tsx
{/* Imagem 1 */}
<div className="col-span-2 relative rounded-2xl overflow-hidden shadow-xl h-64 lg:h-80">
  <img
    className="w-full h-full object-cover cursor-zoom-in"
    src={img('DSC06890.jpg')}
    alt="Alunos da English Patio"
    onClick={() => {
      const event = new CustomEvent('openImageZoom', {
        detail: { src: img('DSC06890.jpg'), alt: 'Alunos da English Patio' }
      });
      window.dispatchEvent(event);
    }}
  />
</div>
```

**DEPOIS:**
```tsx
{/* Imagem 1 */}
<div className="col-span-2 relative rounded-2xl overflow-hidden shadow-xl">
  <OptimizedImage
    src="DSC06890.jpg"
    alt="Alunos da English Patio"
    className="cursor-zoom-in h-64 lg:h-80"
    onClick={() => {
      const event = new CustomEvent('openImageZoom', {
        detail: { src: img('DSC06890.jpg'), alt: 'Alunos da English Patio' }
      });
      window.dispatchEvent(event);
    }}
  />
</div>
```

**Mudanças aplicadas:**
1. ✅ Removeu `h-64 lg:h-80` do `<div>` container
2. ✅ Substituiu `<img>` por `<OptimizedImage>`
3. ✅ Mudou `src={img('DSC06890.jpg')}` para `src="DSC06890.jpg"`
4. ✅ Mudou `className="w-full h-full object-cover cursor-zoom-in"` para `className="cursor-zoom-in h-64 lg:h-80"`
5. ✅ Manteve `onClick` handler intacto

## Arquivos já migrados

- ✅ `src/components/HeroSection.tsx` (3 imagens)

## Arquivos pendentes de migração

### Components
- `src/components/AboutSection.tsx` - Carrossel com 16 imagens
- `src/components/VacationContent.tsx` - 2 imagens com zoom + arrays de imagens

### Pages
- `src/pages/Infrastructure.tsx` - Muitas imagens (carrosséis, grids, etc)
- `src/pages/Methodology.tsx` - 3 imagens + PinterestGallery com ~26 imagens

## Casos especiais

### Imagens em arrays (FadeCarousel, ImageCollage, etc)

**ANTES:**
```tsx
<FadeCarousel
  images={[
    { src: img('DSC06856.jpg'), alt: 'Decoração temática' },
    { src: img('DSC07744.jpg'), alt: 'Ambiente imersivo' },
  ]}
/>
```

**DEPOIS:**
```tsx
<FadeCarousel
  images={[
    { src: 'DSC06856.jpg', alt: 'Decoração temática' },
    { src: 'DSC07744.jpg', alt: 'Ambiente imersivo' },
  ]}
/>
```

**Ação:** Apenas remover `img()` dos arrays. Os componentes de carrossel/galeria vão precisar ser atualizados internamente para usar `OptimizedImage` ou aplicar a função `img()` internamente.

### Imagens com zoom click handler

Manter o `onClick` handler que chama `openImageZoom` - ele usa `img()` dentro do handler e isso está correto.

## Checklist de migração por arquivo

Para cada arquivo:

- [ ] Adicionar `import OptimizedImage from './OptimizedImage'` no topo
- [ ] Encontrar todas as tags `<img>` que usam `img('...')`
- [ ] Para cada imagem:
  - [ ] Substituir `<img>` por `<OptimizedImage>`
  - [ ] Mudar `src={img('foto.jpg')}` para `src="foto.jpg"`
  - [ ] Mover classes de altura do container para dentro do componente
  - [ ] Remover `w-full`, `h-full`, `object-cover` do className
  - [ ] Manter `onClick` handlers
- [ ] Testar visualmente se as imagens estão carregando corretamente
- [ ] Verificar se não há bordas brancas ou espaços vazios

## Benefícios

✅ **Performance**: Lazy loading reduz carregamento inicial
✅ **UX**: Placeholder blur evita layout shift
✅ **Otimização**: Cloudinary serve imagens em WebP automaticamente
✅ **Qualidade**: Progressive loading melhora percepção de velocidade
✅ **Largura**: 1920px é suficiente para telas modernas sem exagero

## Observações importantes

⚠️ **Não remover** a função `img()` dos handlers de zoom! Exemplo:
```tsx
onClick={() => {
  const event = new CustomEvent('openImageZoom', {
    detail: { src: img('DSC06890.jpg'), alt: '...' } // img() AQUI está correto!
  });
}}
```

⚠️ **Componentes de terceiros** (FadeCarousel, ImageCollage, PinterestGallery, ScrollingBackground) podem precisar de ajustes internos para usar OptimizedImage ou aplicar img() internamente.
