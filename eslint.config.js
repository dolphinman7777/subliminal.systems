const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = {
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      plugins: {
        '@typescript-eslint': typescript,
        'react-hooks': true
      },
      languageOptions: {
        parser: typescriptParser,
        parserOptions: {
          ecmaVersion: 2021,
          sourceType: 'module',
        },
      },
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true 
        }],
        'react-hooks/exhaustive-deps': 'warn',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
      },
    }
  ]
};