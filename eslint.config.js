import hooks from 'eslint-plugin-react-hooks'

export default [{
  files: ['src/**/*.{js,jsx}'],
  plugins: { 'react-hooks': hooks },
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly', fetch: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', AbortController: 'readonly', console: 'readonly', setTimeout: 'readonly' } },
  rules: { ...hooks.configs.recommended.rules, 'no-unused-vars': ['error', { argsIgnorePattern: '^_|^Icon$', varsIgnorePattern: '^[A-Z]' }] },
}]