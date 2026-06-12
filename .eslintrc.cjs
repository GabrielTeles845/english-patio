/* Config do ESLint (template Vite + React + TS). O arquivo estava faltando — os
   plugins já estavam nas devDeps. O gate forte continua sendo o `tsc` do build
   (tipos + noUnusedLocals); aqui pegamos sobretudo bugs de hooks (deps).
   Ajustes documentados abaixo evitam falsos positivos sem afrouxar o que importa. */
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs', 'scripts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // co-locar helpers com componentes é proposital aqui; a regra é só dica de
    // Fast Refresh (HMR), não afeta produção.
    'react-refresh/only-export-components': 'off',
    // convenção do código: prefixo _ = intencionalmente não usado.
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    // BOM (U+FEFF) deliberado em regex/template (CSV de import/export).
    'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true, skipRegExps: true, skipComments: true }],
  },
  overrides: [
    // shims de teste (mkReq/mkRes) usam any de propósito.
    { files: ['tests/**/*.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
  ],
};
