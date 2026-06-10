// Seed das 13 salas e 19 níveis fixos (AGENDA_PLAN.md, espelhando o preview).
// Idempotente (ON CONFLICT DO NOTHING). Rodar com: npm run db:seed:agenda
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Use: node --env-file=.env scripts/seed-agenda.mjs');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const ROOMS = [
  ['Green Room', '#7CB342', 'Mariana Rios'],
  ['Vanilla Room', '#D9B777', 'Júlia Tavares'],
  ['Peach Room', '#F2997A', 'Letícia Prado'],
  ['Purple Room', '#8E5AC8', 'Rafaela Pires'],
  ['Blue Room', '#4A7FD4', 'Ana Castro'],
  ['Orange Room', '#F08A3C', 'Bruno Costa'],
  ['Mint Room', '#4DB89E', 'Carla Mendes'],
  ['Yellow Room', '#E8B931', 'Paula Vieira'],
  ['Guava Room', '#E0606E', null],
  ['Beige Room', '#B9A189', 'Renata Lopes'],
  ['Rose Room', '#E26D9F', null],
  ['Turquoise Room', '#31B5C4', 'Camila Duarte'],
  ['Lavender Room', '#A78BDB', null],
];

// [key, name, family]; sort_order = ordem de evolução (índice + 1).
const LEVELS = [
  ['fun-a', 'Fun Plus A', 'fun'],
  ['fun-b', 'Fun Plus B', 'fun'],
  ['conv-1', 'Conversation 1', 'conv'],
  ['conv-2', 'Conversation 2', 'conv'],
  ['conv-3', 'Conversation 3', 'conv'],
  ['power-1', 'Power 1', 'power'],
  ['power-2', 'Power 2', 'power'],
  ['power-3', 'Power 3', 'power'],
  ['power-4', 'Power 4', 'power'],
  ['power-5', 'Power 5', 'power'],
  ['power-6', 'Power 6', 'power'],
  ['sprint-1a', 'Sprint 1A', 'sprint'],
  ['sprint-1b', 'Sprint 1B', 'sprint'],
  ['sprint-2a', 'Sprint 2A', 'sprint'],
  ['sprint-2b', 'Sprint 2B', 'sprint'],
  ['sprint-3a', 'Sprint 3A', 'sprint'],
  ['sprint-3b', 'Sprint 3B', 'sprint'],
  ['sprint-4a', 'Sprint 4A', 'sprint'],
  ['sprint-4b', 'Sprint 4B', 'sprint'],
];

let rooms = 0;
for (const [name, color, teacher] of ROOMS) {
  const r = await sql`
    INSERT INTO rooms (name, color, teacher_name)
    VALUES (${name}, ${color}, ${teacher})
    ON CONFLICT (lower(name)) DO NOTHING
    RETURNING id`;
  rooms += r.length;
}

let lvls = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const [key, name, family] = LEVELS[i];
  const r = await sql`
    INSERT INTO levels (key, name, family, sort_order)
    VALUES (${key}, ${name}, ${family}, ${i + 1})
    ON CONFLICT (key) DO NOTHING
    RETURNING id`;
  lvls += r.length;
}

console.log(`Salas inseridas: ${rooms}/${ROOMS.length} | Níveis inseridos: ${lvls}/${LEVELS.length}`);
console.log('(linhas já existentes foram ignoradas)');
