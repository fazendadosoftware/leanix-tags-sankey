// @ts-check
const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/essential',
    'standard-with-typescript'
  ],
  parserOptions: {
    ecmaVersion: 12,
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    project: ['./tsconfig.json'],
    extraFileExtensions: ['.vue']
  },
  plugins: [
    'vue',
    '@typescript-eslint'
  ],
  globals: {
    lx: true,
    defineProps: true,
    defineEmits: true
  }
})
