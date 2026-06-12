// Testes do casamento de rota do roteador único (server/lib/router.ts).
// Puro, sem banco — cobre as colisões estática×curinga que mais arriscam bug
// (ex.: /enrollments/export vs /enrollments/:id) e a extração de params.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchPath, segments } from '../../server/lib/router';

// Espelha os padrões reais sensíveis a colisão.
const PATTERNS = [
  '/api/enrollments',
  '/api/enrollments/:id',
  '/api/enrollments/export',
  '/api/enrollments/import',
  '/api/enrollments/import/commit',
  '/api/contracts/:id',
  '/api/contracts/:id/pdf',
  '/api/notifications/:id/read',
  '/api/notifications/read-all',
];

describe('matchPath', () => {
  it('casa rota estática simples, sem params', () => {
    const m = matchPath(PATTERNS, '/api/enrollments');
    assert.equal(m?.pattern, '/api/enrollments');
    assert.deepEqual(m?.params, {});
  });

  it('estática vence curinga no mesmo nível (export ≠ :id)', () => {
    assert.equal(matchPath(PATTERNS, '/api/enrollments/export')?.pattern, '/api/enrollments/export');
  });

  it('import estático vence :id', () => {
    assert.equal(matchPath(PATTERNS, '/api/enrollments/import')?.pattern, '/api/enrollments/import');
  });

  it('captura :id quando não há estática concorrente', () => {
    const m = matchPath(PATTERNS, '/api/enrollments/42');
    assert.equal(m?.pattern, '/api/enrollments/:id');
    assert.equal(m?.params.id, '42');
  });

  it('rota aninhada com :id no meio', () => {
    const m = matchPath(PATTERNS, '/api/contracts/7/pdf');
    assert.equal(m?.pattern, '/api/contracts/:id/pdf');
    assert.equal(m?.params.id, '7');
  });

  it('read-all estático não conflita com :id/read (tamanhos diferentes)', () => {
    assert.equal(matchPath(PATTERNS, '/api/notifications/read-all')?.pattern, '/api/notifications/read-all');
    assert.equal(matchPath(PATTERNS, '/api/notifications/9/read')?.pattern, '/api/notifications/:id/read');
  });

  it('decodifica o param de URL', () => {
    assert.equal(matchPath(PATTERNS, '/api/enrollments/a%20b')?.params.id, 'a b');
  });

  it('sem match retorna null', () => {
    assert.equal(matchPath(PATTERNS, '/api/inexistente'), null);
    assert.equal(matchPath(PATTERNS, '/api/enrollments/import/nope/deep'), null);
  });

  it('segments ignora barras vazias e final', () => {
    assert.deepEqual(segments('/api/x/'), ['api', 'x']);
  });
});
