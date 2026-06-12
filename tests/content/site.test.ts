// Garante que o catálogo de conteúdo do site (src/content/site.ts) é coerente
// com o contrato do backend `site_content`: toda peça é publicável pela API
// real (não estoura o teto de caracteres derivado do fieldKey), tem chave em
// kebab-case e valor não-vazio. Roda sem banco — é só validação de dados puros.
import test from 'node:test';
import assert from 'node:assert/strict';
import { siteDefaults, c } from '../../src/content/site.ts';

// Espelha api/site-content.ts capFor — se aquele mudar, este teste avisa.
function capFor(fieldKey: string): number {
  if (/sub(titulo|title)/i.test(fieldKey)) return 200;
  if (/(titulo|title)/i.test(fieldKey)) return 120;
  return 600;
}

const pages = Object.keys(siteDefaults) as Array<keyof typeof siteDefaults>;

test('catálogo tem ao menos uma página com peças', () => {
  assert.ok(pages.length > 0, 'siteDefaults vazio');
  for (const page of pages) {
    assert.ok(Object.keys(siteDefaults[page]).length > 0, `página "${page}" sem peças`);
  }
});

test('fieldKeys em kebab-case e valores não-vazios', () => {
  for (const page of pages) {
    for (const [fieldKey, value] of Object.entries(siteDefaults[page])) {
      assert.match(fieldKey, /^[a-z0-9]+(-[a-z0-9]+)*$/, `fieldKey inválido: ${page}/${fieldKey}`);
      assert.ok(typeof value === 'string' && value.trim().length > 0, `valor vazio: ${page}/${fieldKey}`);
    }
  }
});

test('toda peça respeita o teto de caracteres da API (capFor)', () => {
  for (const page of pages) {
    for (const [fieldKey, value] of Object.entries(siteDefaults[page])) {
      const cap = capFor(fieldKey);
      assert.ok(
        (value as string).length <= cap,
        `${page}/${fieldKey} tem ${(value as string).length} chars > teto ${cap}`,
      );
    }
  }
});

test('c() retorna o default quando não há overlay', () => {
  assert.equal(c('home', 'hero-cta-matricula'), siteDefaults.home['hero-cta-matricula']);
});
