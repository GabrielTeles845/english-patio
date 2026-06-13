/* Suíte de regressão E2E da dashboard (Playwright Test).
   Sobe o build do front + o dev-server (que delega ao roteador real de /api)
   contra o banco LOCAL e dirige o Chrome de verdade.

   Pré-requisito: banco de teste de pé — rode `npm run test:db:up` antes (Docker).

   Scripts:
     npm run test:regression          # headless, suíte completa
     npm run test:regression:watch    # Chrome VISÍVEL (slowMo) — assistir os testes
     npm run test:regression:ui       # modo UI do Playwright (lista interativa)
     npx playwright show-report       # relatório HTML do último run
*/
import { defineConfig } from '@playwright/test';

const PORT = 4321;
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1, // série: um Chrome só, um teste por vez — fácil de assistir
  timeout: 90_000, // teto por teste — folga p/ o slowMo do modo assistir
  expect: { timeout: 12_000 },
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE,
    actionTimeout: 25_000, // teto por clique/preenchimento — não pendura numa tela inesperada
    navigationTimeout: 30_000, // teto por navegação de página
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
  },
  webServer: {
    command: 'npm run build && node --env-file=.env.test --import tsx scripts/dev-server.ts',
    url: BASE,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
