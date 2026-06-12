/* Orquestrador do E2E full-stack da dashboard React:
   build → seed (banco LOCAL) → sobe o servidor local → smoke (abre as telas) →
   derruba o servidor. Pré-requisito: banco de teste de pé (npm run test:db:up).
   Uso: npm run test:e2e:app */
import { spawn } from 'node:child_process';

const ENV_TSX = ['--env-file=.env.test', '--import', 'tsx'];

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} saiu com ${code}`))));
  });
}

async function main() {
  await run('npm', ['run', 'build']);
  await run('node', [...ENV_TSX, 'scripts/seed-e2e.ts']);

  const server = spawn('node', [...ENV_TSX, 'scripts/dev-server.ts'], {
    env: { ...process.env, PORT: '4321' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('servidor local não subiu em 15s')), 15000);
    server.stdout.on('data', (d) => { if (String(d).includes('dev-server (E2E)')) { clearTimeout(to); resolve(); } });
    server.on('exit', (c) => reject(new Error(`servidor saiu antes de subir (${c})`)));
  });

  let code = 0;
  try {
    await run('node', ['scripts/e2e-smoke.mjs']); // abre cada tela (render)
    await run('node', [...ENV_TSX, 'scripts/seed-e2e.ts']); // base limpa p/ os fluxos
    await run('node', ['scripts/e2e-flows.mjs']); // modais básicos (criar/editar/contrato/import/comunicados/reset)
    await run('node', [...ENV_TSX, 'scripts/seed-e2e.ts']); // base limpa de novo
    await run('node', ['scripts/e2e-flows-2.mjs']); // Agenda CRUD, mover, desligar/reativar/excluir, negativo
    await run('node', [...ENV_TSX, 'scripts/seed-e2e.ts']); // base limpa de novo
    await run('node', ['scripts/e2e-flows-3.mjs']); // Usuários CRUD + guards + Conta (senha errada)
  } catch {
    code = 1;
  } finally {
    server.kill('SIGTERM');
  }
  process.exit(code);
}

main().catch((e) => { console.error(e); process.exit(1); });
