// Lint rules: the recommended JavaScript, TypeScript and Vue sets, Prettier
// for layout, and the size limits from the workspace rules.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', '.wrangler/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Size limits from the workspace rules (CLAUDE.md, "Keep it lean"):
      // split code before it crosses them.
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // A describe block groups related specs, so it grows with them; each
    // spec inside it is still short. The other limits apply to tests too.
    files: ['tests/**'],
    rules: { 'max-lines-per-function': 'off' },
  },
)
