module.exports = {
  extends: 'eslint-config-egg',
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Prettier 相关规则
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'all'],
    'array-bracket-spacing': ['error', 'always'],
    'object-shorthand': 'error',
    'quote-props': ['error', 'as-needed'],
    'no-else-return': 'error',
    'no-trailing-spaces': 'error',
    'eol-last': ['error', 'always'],
  },
};
